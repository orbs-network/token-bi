import Web3 from 'web3';
import { AbiItem } from 'web3-utils';


// Imports for types
import { EventData, EventOptions, Contract } from 'web3-eth-contract';

import {getFromAddressAddressFromEvent, getToAddressAddressFromEvent} from './src/eventDataExtraction';
import {
    formatDelegate,
    formatGuardian,
    formatTransfer,
    formatVoteOut,
    writeEventsDataToCsv
} from './src/csv/ecentsDataToCsv';
import {getEvents} from './src/erc20Events/erc20Events';

//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
const ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint
let erc20ContractAddress = "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"; //token contract
const votingContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"; //voting
const guardiansContractAddress = "0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711"; //guardians - not used yet
let startBlock = "9588901";//transactions start at 7437000; //contract created at 5710114
let endBlock = "9608900"; // last elections as of now.. first election at 7528900
const interval = 200000;
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
        startBlock = 7420000;
    }

    // TODO : ORL : Think about max value (instead of 'latest')
    if (!endBlock) {
        endBlock = 1_000_000;
    }

    if (!filenameTransfers) {
        filenameTransfers = 'transfers.csv';
    }

    if (!filenameDelegates) {
        filenameDelegates = 'delegates.csv';
    }
}

async function main(startBlock: number, endBlock: number,  eventBatchingSize: number,
                    executionFlags: { doTransfers: boolean, doDelegates: boolean, doGuardians: boolean, doVotes: boolean },
                    outputFlags: { addHumanReadableDate: boolean }) {
    validateInput();

    const web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));

    if (executionFlags.doTransfers) {
        const tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
        const transferEvents = await getEvents(web3, tokenContract, TRANSFER_EVENT_NAME, startBlock, endBlock, eventBatchingSize);

        await writeEventsDataToCsv(transferEvents, TRANSFERS_HEADER, TRANSFER_EVENT_NAME, filenameTransfers, formatTransfer, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doDelegates) {
        const votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

        const delegatesEvents = await getEvents(web3, votingContract, DELEGATE_EVENT_NAME, startBlock, endBlock, eventBatchingSize);
        await writeEventsDataToCsv(delegatesEvents, DELEGATES_HEADER, DELEGATE_EVENT_NAME, filenameDelegates, formatDelegate, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doGuardians) {
        const guardianContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);

        // Guardians register
        const guardianRegisterEvents = await getEvents(web3, guardianContract, GUARDIAN_REGISTER_EVENT_NAME, startBlock, endBlock, eventBatchingSize);
        await writeEventsDataToCsv(guardianRegisterEvents, GUARDIANS_HEADER, GUARDIAN_REGISTER_EVENT_NAME, filenameGuardiansRegister, formatGuardian, outputFlags.addHumanReadableDate);

        // Guardians leave
        const guardianLeaveEvents = await getEvents(web3, guardianContract, GUARDIAN_LEAVE_EVENT_NAME, startBlock, endBlock, eventBatchingSize);
        await writeEventsDataToCsv(guardianLeaveEvents, GUARDIANS_HEADER, GUARDIAN_LEAVE_EVENT_NAME, filenameGuardiansLeave, formatGuardian, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doVotes) {
        const votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

        const voteoutEvents = await getEvents(web3, votingContract, VOTEOUT_EVENT_NAME, startBlock, endBlock, eventBatchingSize);
        await writeEventsDataToCsv(voteoutEvents, VOTEOUT_HEADER, VOTEOUT_EVENT_NAME, filenameVoteOut, formatVoteOut, outputFlags.addHumanReadableDate);
    }
}

main(startBlock, endBlock, interval,
    {
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
