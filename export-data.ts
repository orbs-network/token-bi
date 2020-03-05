import Web3 from 'web3';

import {
    formatDelegate,
    formatGuardian,
    formatTransfer,
    formatVoteOut,
    writeEventsDataToCsv
} from './src/csv/ecentsDataToCsv';
import {getEvents} from './src/erc20Events/erc20Events';
import { convertEventDataToCsvRowForm } from './src/orbsEvents/orbsEventConverter'
import {ELECTION_BLOCKS} from './src/electionBlocks';
import {ABIS, CONTRACTS, CSV_CONSTANTS, EVENT_NAMES} from './scriptConstants';

let START_BLOCK = ELECTION_BLOCKS['104'].ethereumBlockNumber + 1; //transactions start at 7437000; //contract created at 5710114
let END_BLOCK = ELECTION_BLOCKS['105'].ethereumBlockNumber; // last elections as of now.. first election at 7528900
const INTERVAL = 200000;

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

async function main(startBlock: number, endBlock: number,  eventBatchingSize: number,
                    executionFlags: { doTransfers: boolean, doDelegates: boolean, doGuardians: boolean, doVotes: boolean },
                    outputFlags: { addHumanReadableDate: boolean }) {
    const web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));

    if (executionFlags.doTransfers) {
        const tokenContract = await new web3.eth.Contract(ABIS.token, CONTRACTS.erc20ContractAddress);
        const transferEvents = await getEvents(web3, tokenContract, EVENT_NAMES.transfer, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);

        await writeEventsDataToCsv(transferEvents, CSV_CONSTANTS.transfersHeader, EVENT_NAMES.transfer, filenameTransfers, formatTransfer, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doDelegates) {
        const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);

        const delegatesEvents = await getEvents(web3, votingContract, EVENT_NAMES.delegate, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(delegatesEvents, CSV_CONSTANTS.delegatesHeader, EVENT_NAMES.delegate, filenameDelegates, formatDelegate, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doGuardians) {
        const guardianContract = await new web3.eth.Contract(ABIS.guardians, CONTRACTS.guardiansContractAddress);

        // Guardians register
        const guardianRegisterEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianRegister, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(guardianRegisterEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianRegister, filenameGuardiansRegister, formatGuardian, outputFlags.addHumanReadableDate);

        // Guardians leave
        const guardianLeaveEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianLeave, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(guardianLeaveEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianLeave, filenameGuardiansLeave, formatGuardian, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doVotes) {
        const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);

        const voteoutEvents = await getEvents(web3, votingContract, EVENT_NAMES.voteOut, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(voteoutEvents, CSV_CONSTANTS.voteOutHeader, EVENT_NAMES.voteOut, filenameVoteOut, formatVoteOut, outputFlags.addHumanReadableDate);
    }
}

main(START_BLOCK, END_BLOCK, INTERVAL,
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
