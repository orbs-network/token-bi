import Web3 from 'web3';
import {Contract, EventData, EventOptions} from 'web3-eth-contract';
import ProgressBar from 'progress';
import perfy from 'perfy';

// Imported for types
import {Block} from 'web3-eth';

import {getFromAddressAddressFromEvent, getToAddressAddressFromEvent} from '../eventDataExtraction';

export async function getEvents(web3: Web3, contract: Contract, eventName: string,
                                startBlock: number, endBlock: number,  eventBatchingSize: number) : Promise<any[]> {
    const eventsData = await readAndMergeEvents(web3, contract, startBlock, endBlock, eventBatchingSize, eventName, false);

    console.log('\x1b[33m%s\x1b[0m', `Merged to ${eventsData.length} ${eventName} events`);

    return eventsData;
}

async function readAndMergeEvents(web3: Web3, contract: Contract,
                                  startBlock: number, endBlock: number, eventBatchingSize: number,
                                  eventName: string, requireSuccess: boolean) {
    let events = [];
    let curBlockInt = startBlock;

    while (curBlockInt < endBlock) {
        // Calculate next starting block by the given interval step
        let targetBlock = curBlockInt + eventBatchingSize - 1;

        // Ensure we are not going over the 'end block'
        targetBlock = Math.min(targetBlock, endBlock);

        // Gets all of the events for the current start and end blocks
        const eventsInterval = await getAllPastEvents(web3, contract, curBlockInt, targetBlock, eventName, requireSuccess);

        console.log('\x1b[33m%s\x1b[0m', `Found ${eventsInterval.length} ${eventName} events of Contract Address ${contract.options.address} between blocks ${curBlockInt} , ${targetBlock}`);

        // TODO : ORL : Understand whe we add the interval and not the '-1' (and also if we can calculate it once and not in two places)
        curBlockInt += eventBatchingSize;

        // Add the the total list of events
        events = events.concat(eventsInterval);
    }

    console.log('\x1b[33m%s\x1b[0m', `Found total of ${events.length} ${eventName} events of Contract Address ${contract.options.address} between blocks ${startBlock} , ${endBlock}`);

    return events;
}

async function getAllPastEvents(web3, contract, startBlock, endBlock, eventName, requireSuccess) {
    console.log('\x1b[33m%s\x1b[0m', `Reading from block ${startBlock} to block ${endBlock}`);

    const options: EventOptions = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    // Used as a 'cache' to keep data about blocks.
    const blockCache: Map<number, Block> = new Map();

    const rows = [];

    try {

        perfy.start('getPastEvents');

        // Get all of the events of the given name in the given block range.
        const events: EventData[] = await contract.getPastEvents(eventName, options);

        const getPastEventsPerf = perfy.end('getPastEvents');
        console.log(`Got ${events.length} past events from ${endBlock - startBlock} blocks at ${getPastEventsPerf.time.toFixed(5)} ms`);

        const green = '\u001b[42m \u001b[0m';
        const red = '\u001b[41m \u001b[0m';
        const bar = new ProgressBar(':bar \x1b[33m:percent :current/:total time spent: :elapseds done in: :etas\x1b[0m', {
            complete: green,
            incomplete: red,
            width: 80,
            total: events.length });

        for (const event of events) {

            // TODO : O.L : Check if we really need this part.
            // Is success-validation required ?
            if (requireSuccess) {
                const curTxnReceipt = await web3.eth.getTransactionReceipt(event.transactionHash);
                if (curTxnReceipt == null) {
                    throw "Could not find a transaction for your id! ID you provided was " + event.transactionHash;
                } else {
                    if(curTxnReceipt.status == '0x0') {
                        console.log("Transaction failed, event ignored txid: " + event.transactionHash);
                        continue;
                    }
                }
            }

            // Extract 'source' and 'recipient' addresses
            const sourceAddress = getFromAddressAddressFromEvent(event);
            const recipientAddress = getToAddressAddressFromEvent(event) || 'NA';

            // DEV_NOTE : The use of the cache saves us multiple 'getBlock' calls for events that
            // happened in the same block.
            if (! blockCache.has(event.blockNumber)) {
                const block = await web3.eth.getBlock(event.blockNumber);
                blockCache.set(event.blockNumber, block);
            }

            const transactionBlock = blockCache.get(event.blockNumber);


            const unixTimestamp = transactionBlock.timestamp;

            // @ts-ignore (O.L: 'timestamp' can be string, will still result in proper multiplication)
            const jsTimestamp = new Date(unixTimestamp * 1000);

            let humanDate = jsTimestamp.toUTCString();
            humanDate = humanDate.slice(0, 3) + humanDate.slice(4);

            let amount = 0;
            let logData = [];
            if (event.raw.data != null) { // no data for guardians event
                if (event.event === "VoteOut") {
                    logData = web3.eth.abi.decodeLog([{
                        type: 'address',
                        name: 'sender',
                        indexed: true
                    },{
                        type: 'address[]',
                        name: 'validators'
                    },{
                        type: 'uint256',
                        name: 'counter'
                    }], event.raw.data, event.raw.topics[1]);

                } else {
                    amount = web3.utils.toBN(event.raw.data);
                }
            }
            const obj = generateRowObject(amount,event.blockNumber, event.transactionIndex, event.transactionHash, sourceAddress, recipientAddress, event.event, unixTimestamp, humanDate, logData);

            rows.push(obj);
            bar.tick();
        }

        return rows;
    } catch (error) {
        // DEV_NOTE : O.L : This part is probably not relevant as it solves a problem with Infura and block ranges that
        // should not exist by now. we keep it here for now, should look for the logs message.
        if (error.message.includes("-32005")) {
            console.warn(`NOTICE : Error while trying to get all past events, will try again with half of the range.`, error);

            const interval = endBlock - startBlock;
            // try log execution
            let halfInterval = Math.floor(interval / 2);
            const startPlusHalf = startBlock+halfInterval;
            const firstHalf = await getAllPastEvents(web3, contract, startBlock, startPlusHalf-1, eventName, requireSuccess);
            if (startPlusHalf + halfInterval < endBlock) {
                // handle odd integer division from a couple of lines back
                halfInterval++;
            }
            const secondHalf = await getAllPastEvents(web3, contract, startPlusHalf, startPlusHalf+halfInterval, eventName, requireSuccess);
            return firstHalf.concat(secondHalf);
        } else {
            console.log(error);
            return [];
        }
    }
}

function generateRowObject(amount: number, block: number,
                           transactionIndex: number, txHash: string,
                           transferFrom: string, transferTo: string,
                           method: string,
                           unixDate, humanDate: string, logData) {
    return {
        // NOTE : needs to manually check the return object property names
        // eslint-disable-next-line @typescript-eslint/camelcase
        amount, block, transactionIndex, txHash, transferFrom, transferTo, method, unix_date: unixDate, human_date: humanDate, logData
    }
}