//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
import {ELECTION_BLOCKS} from './src/electionBlocks';

const ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint

let startBlock = ELECTION_BLOCKS['104'].ethereumBlockNumber + 1; //transactions start at 7437000; //contract created at 5710114
let endBlock = ELECTION_BLOCKS['105'].ethereumBlockNumber; // last elections as of now.. first election at 7528900
const blocksInterval = 200000;
const processTransfers = true;
const processDelegates = true;
const processGuardians = true;
const processVotes = true;
const outputFilePathTransfers = "transfers.csv";
const outputFilePathDelegates = "delegates.csv";
const outputFilePathVoteOut = "votes.csv";
const outputFilePathGuardiansRegister = "guardian_register.csv";
const outputFilePathGuardiansLeave = "guardian_leave.csv";
const withHumanDate = false;

export const configs = {
    ethereumConfigs: {
        ethereumConnectionURL,
    },
    blocksReading: {
        startBlock,
        endBlock,
        blocksInterval,
    },
    activationFlags: {
        processTransfers,
        processDelegates,
        processGuardians,
        processVotes,
    },
    outputPaths: {
        transfers: outputFilePathTransfers,
        delegates: outputFilePathDelegates,
        voteOut: outputFilePathVoteOut,
        guardiansRegister: outputFilePathGuardiansRegister,
        guardiansLeave: outputFilePathGuardiansLeave,
    },
    outputFlags: {
        withHumanDate,
    }
};