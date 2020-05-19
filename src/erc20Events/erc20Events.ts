/* eslint-disable @typescript-eslint/no-use-before-define */
import Web3 from 'web3';
import {Contract, EventData, EventOptions} from 'web3-eth-contract';
import ProgressBar from 'progress';
import perfy from 'perfy';

// Imported for types
import {Block} from 'web3-eth';

export type TEventConverterFunction<T extends {}> = (web3: Web3, event: EventData, eventTransactionBlock: Block) => T;


export async function getEvents<T = EventData>(web3: Web3, contract: Contract, eventName: string,
                                               startBlock: number, endBlock: number,  eventBatchingSize: number,
                                               eventConverter?: TEventConverterFunction<T>): Promise<any[]> {
    const eventsData = await readAndMergeEvents(web3, contract, startBlock, endBlock, eventBatchingSize, eventName, false, eventConverter);

    console.log('\x1b[33m%s\x1b[0m', `Merged to ${eventsData.length} ${eventName} events`);

    return eventsData;
}

async function readAndMergeEvents<T = EventData>(web3: Web3, contract: Contract,
                                  startBlock: number, endBlock: number, eventBatchingSize: number,
                                  eventName: string, requireSuccess: boolean,
                                  eventConverter?: TEventConverterFunction<T>) {
    let events = [];
    let curBlockInt = startBlock;

    while (curBlockInt < endBlock) {
        // Calculate next starting block by the given interval step
        // NOTE : O.L : We are reducing '1' because the block fetching is range-inclusive and we want to adhere to the
        //              'eventBatchingSize'
        let targetBlock = curBlockInt + eventBatchingSize - 1;

        // Ensure we are not going over the 'end block'
        targetBlock = Math.min(targetBlock, endBlock);

        // Gets all of the events for the current start and end blocks
        const eventsInterval = await getAllPastEvents(web3, contract, curBlockInt, targetBlock, eventName, requireSuccess, eventConverter);

        console.log('\x1b[33m%s\x1b[0m', `Found ${eventsInterval.length} ${eventName} events of Contract Address ${contract.options.address} between blocks ${curBlockInt} , ${targetBlock}`);

        curBlockInt += eventBatchingSize;

        // Add the the total list of events
        events = events.concat(eventsInterval);
    }

    console.log('\x1b[33m%s\x1b[0m', `Found total of ${events.length} ${eventName} events of Contract Address ${contract.options.address} between blocks ${startBlock} , ${endBlock}`);

    return events;
}

async function getAllPastEvents<T = EventData>(web3: Web3, contract: Contract,
                                startBlock: number, endBlock: number,
                                eventName: string, requireSuccess: boolean,
                                eventConverter?: TEventConverterFunction<T>) {
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
        console.log(`Got ${events.length} past events from ${endBlock - startBlock + 1} blocks at ${getPastEventsPerf.time.toFixed(5)} ms`);

        const green = '\u001b[42m \u001b[0m';
        const red = '\u001b[41m \u001b[0m';
        const bar = new ProgressBar(':bar \x1b[33m:percent :current/:total time spent: :elapseds done in: :etas\x1b[0m', {
            complete: green,
            incomplete: red,
            width: 80,
            total: events.length });

        for (const event of events) {

            // NOTE : O.L : This was relevant before, now should consider removing it.
            // Is success-validation required ?
            if (requireSuccess) {
                const curTxnReceipt = await web3.eth.getTransactionReceipt(event.transactionHash);
                if (curTxnReceipt == null) {
                    throw "Could not find a transaction for your id! ID you provided was " + event.transactionHash;
                } else {
                    if(curTxnReceipt.status === false) {
                        console.log("Transaction failed, event ignored txid: " + event.transactionHash);
                        continue;
                    }
                }
            }

            // DEV_NOTE : The use of the cache saves us multiple 'getBlock' calls for events that
            // happened in the same block.
            if (! blockCache.has(event.blockNumber)) {
                const block = await web3.eth.getBlock(event.blockNumber);
                blockCache.set(event.blockNumber, block);
            }

            const transactionBlock = blockCache.get(event.blockNumber);

            let eventToAdd: T | EventData = event;

            if (eventConverter) {
                eventToAdd = eventConverter(web3, event, transactionBlock);
            }

            rows.push(eventToAdd);
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
