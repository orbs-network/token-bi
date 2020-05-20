//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
import {ELECTION_BLOCKS} from './src/electionBlocks';
import ELECTION_BLOCKS_JSON from './src/electionBlocks.json';

const ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint

// let startBlock = ELECTION_BLOCKS['107'].firstBlock; //transactions start at 7437000; //contract created at 5710114
// let endBlock = ELECTION_BLOCKS['110'].lastBlock; // last elections as of now.. first election at 7528900
const startBlock = ELECTION_BLOCKS_JSON["111"].firstBlock; //transactions start at 7437000; //contract created at 5710114
const endBlock = ELECTION_BLOCKS_JSON["128"].lastBlock; // last elections as of now.. first election at 7528900
const blocksInterval = 200000;
const processTransfers = true;
const processDelegates = true;
const processGuardians = true;
const processVotes = true;
const processStaked = true;
const processUntaked = true;
const processRestaked = true;
const processWithdrew = true;
const outputFilePathTransfers = "outputs/transfers.csv";
const outputFilePathDelegates = "outputs/delegates.csv";
const outputFilePathVoteOut = "outputs/votes.csv";
const outputFilePathGuardiansRegister = "outputs/guardian_register.csv";
const outputFilePathGuardiansLeave = "outputs/guardian_leave.csv";
const outputFilePathStaked = "outputs/staked.csv";
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
        // Regular events
        processTransfers,
        processDelegates,
        processGuardians,
        processVotes,

        // Staking contract events
        processStaked,
        processUntaked,
        processRestaked,
        processWithdrew,
    },
    outputPaths: {
        transfers: outputFilePathTransfers,
        delegates: outputFilePathDelegates,
        voteOut: outputFilePathVoteOut,
        guardiansRegister: outputFilePathGuardiansRegister,
        guardiansLeave: outputFilePathGuardiansLeave,

        // Staking events
        staked: outputFilePathStaked,
    },
    outputFlags: {
        withHumanDate,
    }
};