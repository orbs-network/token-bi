import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import fs from "fs";
import ProgressBar from "progress";

import { EventData, EventOptions } from 'web3-eth-contract';
import {getFromAddressAddressFromEvent, getToAddressAddressFromEvent} from './src/eventDataExtraction';
import {
    formatDelegate,
    formatGuardian,
    formatTransfer,
    formatVoteOut,
    writeEventsDataToCsv
} from './src/csv/ecentsDataToCsv';

//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
const ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint
let erc20ContractAddress = "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"; //token contract
const votingContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"; //voting
const guardiansContractAddress = "0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711"; //guardians - not used yet
let startBlock = "8408900";//transactions start at 7437000; //contract created at 5710114
let endBlock = "8548900"; // last elections as of now.. first election at 7528900
const interval = 100000;
const doTransfers = true;
const doDelegates = true;
const doGuardians = true;
const doVotes = true;
const filenameVoteOut = "votes.csv";
let filenameTransfers = "transfers.csv";
let filenameDelegates = "delegates.csv";
const filenameGuardiansRegister = "guardian_register.csv";
const filenameGuardiansLeave = "guardian_leave.csv";
const withHumanDate = false;
const TOKEN_ABI: AbiItem[] = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const VOTING_ABI: AbiItem[] = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
const GUARDIANS_ABI: AbiItem[] = [{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDepositWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"registrationMinTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"registrationDepositWei_","type":"uint256"},{"name":"registrationMinTime_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"}];
const TRANSFERS_HEADER = "From,To,Amount,txnIndex,txnHash,Block,UnixDate";
const DELEGATES_HEADER = "From,To,txnIndex,txnHash,Block,UnixDate";
const GUARDIANS_HEADER = "Address,txnIndex,txnHash,Block,UnixDate";
const TRANSFER_EVENT_NAME = "Transfer";
const DELEGATE_EVENT_NAME = "Delegate";
const GUARDIAN_REGISTER_EVENT_NAME = "GuardianRegistered";
const GUARDIAN_LEAVE_EVENT_NAME = "GuardianLeft";
const VOTEOUT_EVENT_NAME = "VoteOut";
const VOTEOUT_HEADER = "Counter,Address,Validators,txnIndex,txnHash,Block,UnixDate";


function validateInput() {
    if (!ethereumConnectionURL) {
        throw("missing env variable ETHEREUM_NETWORK_URL");
    }

    if (!erc20ContractAddress) {
        erc20ContractAddress = '0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA';
    }

    if (!startBlock) {
        startBlock = '7420000';
    }

    if (!endBlock) {
        endBlock = 'latest';
    }

    if (!filenameTransfers) {
        filenameTransfers = 'transfers.csv';
    }

    if (!filenameDelegates) {
        filenameDelegates = 'delegates.csv';
    }
}

async function getAllPastEvents(web3, contract, startBlock, endBlock, eventName, requireSuccess) {
    console.log('\x1b[33m%s\x1b[0m', `Reading from block ${startBlock} to block ${endBlock}`);
    const options: EventOptions = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    const blockCache = {}
    const rows = [];
    try {
        const events: EventData[] = await contract.getPastEvents(eventName, options);
        const green = '\u001b[42m \u001b[0m';
        const red = '\u001b[41m \u001b[0m';
        const bar = new ProgressBar(':bar \x1b[33m:percent :current/:total time spent: :elapseds done in: :etas\x1b[0m', {
              complete: green,
              incomplete: red,
              width: 80,
              total: events.length });

        for (let i = events.length-1; i >= 0;i--) {
            const event = events[i];
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

            // Get timestamp (with block cache)
            let transactionBlock = blockCache[event.blockNumber];
            if (transactionBlock == undefined) {
                transactionBlock = await web3.eth.getBlock(event.blockNumber);
                blockCache[event.blockNumber] = transactionBlock;
            }
            const unixdate = transactionBlock.timestamp;
            const jsDate = new Date(unixdate*1000);
            let humanDate = jsDate.toUTCString();
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
            const obj = generateRowObject(amount,event.blockNumber, event.transactionIndex, event.transactionHash, sourceAddress, recipientAddress, event.event, unixdate, humanDate, logData);
            rows.push(obj);
            bar.tick();
        }
        return rows;
    } catch (error) {
        if (error.message.includes("-32005")) {
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

async function readAndMergeEvents(web3, contract, startBlock, endBlock, eventName, requireSuccess) {
    let events = [];
    let curBlockInt = parseFloat(startBlock);
    const endBlockInt = parseFloat(endBlock);
    while (curBlockInt < endBlockInt) {
        let targetBlock = curBlockInt+interval-1
        if (targetBlock > endBlockInt) {
            targetBlock = endBlockInt
        }

        const eventsInterval = await getAllPastEvents(web3, contract, curBlockInt, targetBlock, eventName, requireSuccess);
        console.log('\x1b[33m%s\x1b[0m', `Found ${eventsInterval.length} ${eventName} events of Contract Address ${contract.address} between blocks ${curBlockInt} , ${targetBlock}`);
        curBlockInt += interval;
        events = events.concat(eventsInterval);
    }
    console.log('\x1b[33m%s\x1b[0m', `Found total of ${events.length} ${eventName} events of Contract Address ${contract.address} between blocks ${startBlock} , ${endBlock}`);
    return events;
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

async function getEvents(web3, contract, eventName) : Promise<any[]> {
    const eventsData = await readAndMergeEvents(web3, contract, startBlock, endBlock, eventName, false);

    console.log('\x1b[33m%s\x1b[0m', `Merged to ${eventsData.length} ${eventName} events`);

    return eventsData;
}

async function main(executionFlags: { doTransfers: boolean, doDelegates: boolean, doGuardians: boolean, doVotes: boolean }, outputFlags: { addHumanReadableDate: boolean }) {
    validateInput();

    const web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));

    if (executionFlags.doTransfers) {
        const tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
        const transferEvents = await getEvents(web3, tokenContract, TRANSFER_EVENT_NAME);

        await writeEventsDataToCsv(transferEvents, TRANSFERS_HEADER, TRANSFER_EVENT_NAME, filenameTransfers, formatTransfer, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doDelegates) {
        const votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

        const delegatesEvents = await getEvents(web3, votingContract, DELEGATE_EVENT_NAME);
        await writeEventsDataToCsv(delegatesEvents, DELEGATES_HEADER, DELEGATE_EVENT_NAME, filenameDelegates, formatDelegate, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doGuardians) {
        const guardianContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);

        // Guardians register
        const guardianRegisterEvents = await getEvents(web3, guardianContract, GUARDIAN_REGISTER_EVENT_NAME);
        await writeEventsDataToCsv(guardianRegisterEvents, GUARDIANS_HEADER, GUARDIAN_REGISTER_EVENT_NAME, filenameGuardiansRegister, formatGuardian, outputFlags.addHumanReadableDate);

        // Guardians leave
        const guardianLeaveEvents = await getEvents(web3, guardianContract, GUARDIAN_LEAVE_EVENT_NAME);
        await writeEventsDataToCsv(guardianLeaveEvents, GUARDIANS_HEADER, GUARDIAN_LEAVE_EVENT_NAME, filenameGuardiansLeave, formatGuardian, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doVotes) {
        const votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

        const voteoutEvents = await getEvents(web3, votingContract, VOTEOUT_EVENT_NAME);
        await writeEventsDataToCsv(voteoutEvents, VOTEOUT_HEADER, VOTEOUT_EVENT_NAME, filenameVoteOut, formatVoteOut, outputFlags.addHumanReadableDate);
    }
}

main({
        doTransfers,
        doDelegates,
        doGuardians,
        doVotes
    }, {
        addHumanReadableDate: withHumanDate,
    })
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);
