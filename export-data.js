const Web3 = require('web3');
const fs = require('fs');
var ProgressBar = require('progress');

//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
let ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint
let erc20ContractAddress = "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"; //token contract
let votingContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"; //voting
let guardiansContractAddress = "0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711"; //guardians - not used yet
let startBlock = "8468901";//transactions start at 7437000; //contract created at 5710114 
let endBlock = "8548900"; // last elections as of now.. first election at 7528900
let interval = 100000;
let doTransfers = true;
let doDelegates = true;
let doGuardians = true;
let doVotes = true;
let voteout_filename = "votes.csv";
let transfers_filename = "transfers.csv"; 
let delegate_filename = "delegates.csv";
let guardian_register_filename = "guardian_register.csv"
let guardian_leave_filename = "guardian_leave.csv"
let withHumanDate = false;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const VOTING_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
const GUARDIANS_ABI = [{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDepositWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"registrationMinTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"registrationDepositWei_","type":"uint256"},{"name":"registrationMinTime_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"}];
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

    if (!transfers_filename) {
        transfers_filename = 'transfers.csv';
    }
    
    if (!delegate_filename) {
        delegate_filename = 'delegates.csv';
    }
}

function getFromAddressAddressFromEvent(event) {
    const TOPIC_FROM_ADDR = 1;
    let topic = event.raw.topics[TOPIC_FROM_ADDR];
    return '0x' + topic.substring(26);
}

function getToAddressAddressFromEvent(event) {
    const TOPIC_TO_ADDR = 2;
    let topic = event.raw.topics[TOPIC_TO_ADDR];
    if (topic != null) {
        return '0x' + topic.substring(26);
    }
    return "NA";
}

function generateRowObject(amount, block, transactionIndex, txHash, transferFrom, transferTo, method, unix_date, human_date, logData) {
    return {
        amount, block, transactionIndex, txHash, transferFrom, transferTo, method, unix_date, human_date, logData
    }    
}

async function getAllPastEvents(web3, contract, startBlock, endBlock, eventName, requireSuccess) {
    console.log('\x1b[33m%s\x1b[0m', `Reading from block ${startBlock} to block ${endBlock}`);
    let options = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    let blockCache = {}
    let rows = [];
    try {
        let events = await contract.getPastEvents(eventName, options);
        var green = '\u001b[42m \u001b[0m';
        var red = '\u001b[41m \u001b[0m';
        let bar = new ProgressBar(':bar \x1b[33m:percent :current/:total time spent: :elapseds done in: :etas\x1b[0m', { 
              complete: green,
              incomplete: red,
              width: 80,
              total: events.length });
        for (let i = events.length-1; i >= 0;i--) {
            let event = events[i];
            if (requireSuccess) {
                let curTxnReceipt = await web3.eth.getTransactionReceipt(event.transactionHash);
                if (curTxnReceipt == null) {
                    throw "Could not find a transaction for your id! ID you provided was " + event.transactionHash;
                } else {
                    if(curTxnReceipt.status == '0x0') {
                        console.log("Transaction failed, event ignored txid: " + event.transactionHash);
                        continue;
                    }
                }               
            }

            let sourceAddress = getFromAddressAddressFromEvent(event);
            let receipientAddress = getToAddressAddressFromEvent(event);

            // Get timestamp (with block cache)
            let transactionBlock = blockCache[event.blockNumber];
            if (transactionBlock == undefined) {
                transactionBlock = await web3.eth.getBlock(event.blockNumber);
                blockCache[event.blockNumber] = transactionBlock; 
            }
            let unix_date = transactionBlock.timestamp;
            let jsDate = new Date(unix_date*1000);
            let human_date = jsDate.toUTCString();
            human_date = human_date.slice(0, 3) + human_date.slice(4);
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
            let obj = generateRowObject(amount,event.blockNumber, event.transactionIndex, event.transactionHash, sourceAddress, receipientAddress, event.event, unix_date, human_date, logData);
            rows.push(obj);
            bar.tick()
        }
        return rows;
    } catch (error) {
        if (error.message.includes("-32005")) {
            let interval = endBlock - startBlock;
            // try log execution
            let halfInterval = Math.floor(interval / 2);
            let startPlusHalf = startBlock+halfInterval;
            let firstHalf = await getAllPastEvents(web3, contract, startBlock, startPlusHalf-1, eventName, requireSuccess);
            if (startPlusHalf + halfInterval < endBlock) {
                // handle odd integer division from a couple of lines back
                halfInterval++;
            }
            let secondHalf = await getAllPastEvents(web3, contract, startPlusHalf, startPlusHalf+halfInterval, eventName, requireSuccess);
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
    let endBlockInt = parseFloat(endBlock);
    while (curBlockInt < endBlockInt) {
        let targetBlock = curBlockInt+interval-1
        if (targetBlock > endBlockInt) {
            targetBlock = endBlockInt
        }

        let eventsInterval = await getAllPastEvents(web3, contract, curBlockInt, targetBlock, eventName, requireSuccess);
        console.log('\x1b[33m%s\x1b[0m', `Found ${eventsInterval.length} ${eventName} events of Contract Address ${contract.address} between blocks ${curBlockInt} , ${targetBlock}`);
        curBlockInt += interval;
        events = events.concat(eventsInterval);
    }
    console.log('\x1b[33m%s\x1b[0m', `Found total of ${events.length} ${eventName} events of Contract Address ${contract.address} between blocks ${startBlock} , ${endBlock}`);
    return events;
}

function getHumanDateForRow(row, delim) {
    let humanDatePart = "";
    if (withHumanDate) {
        humanDatePart = `${delim}${row.human_date}`;
    }
    return humanDatePart;
}

function formatDelegate(row) {
    let humanDatePart = getHumanDateForRow(row, ",");
    return `${row.transferFrom},${row.transferTo},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

function formatTransfer(row) {
    let humanDatePart = getHumanDateForRow(row, ",");
    return `${row.transferFrom},${row.transferTo},${row.amount},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

function formatGuardian(row) {
let humanDatePart = getHumanDateForRow(row, ",");
    return `${row.transferFrom},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;    
}

function formatVoteOut(row) {
let humanDatePart = getHumanDateForRow(row, ";");
    return `${row.logData.counter.toString(10)};${row.transferFrom};${JSON.stringify(row.logData.validators)};${row.transactionIndex};${row.txHash};${row.block};${row.unix_date}${humanDatePart}\n`;    
}

async function getEvents(web3, contract, eventName, csvHeader, appendFunc, outputFilename) {
    let eventsData = await readAndMergeEvents(web3, contract, startBlock, endBlock, eventName, false);
    console.log('\x1b[33m%s\x1b[0m', `Merged to ${eventsData.length} ${eventName} events`);

    let csvStr = csvHeader + "\n";
    if (withHumanDate) {
        csvStr = csvHeader + ',HumanDate\n';
    } 

    for (let i = 0;i < eventsData.length;i++) {
        let row = eventsData[i];
        csvStr += appendFunc(row);
    }

    fs.writeFileSync(outputFilename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `${eventName} CSV version file was saved to ${outputFilename}!`);
}

async function main() {
    validateInput();
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    if (doTransfers) {
        let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
        await getEvents(web3, tokenContract, TRANSFER_EVENT_NAME, TRANSFERS_HEADER, formatTransfer, transfers_filename);
    }

    if (doDelegates) {
        let votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);
        await getEvents(web3, votingContract, DELEGATE_EVENT_NAME, DELEGATES_HEADER, formatDelegate, delegate_filename);
    }

    if (doGuardians) {
        let guardianContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);
        await getEvents(web3, guardianContract, GUARDIAN_REGISTER_EVENT_NAME, GUARDIANS_HEADER, formatGuardian, guardian_register_filename);
        await getEvents(web3, guardianContract, GUARDIAN_LEAVE_EVENT_NAME, GUARDIANS_HEADER, formatGuardian, guardian_leave_filename);
    }

    if (doVotes) {
        let votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);
        await getEvents(web3, votingContract, VOTEOUT_EVENT_NAME, VOTEOUT_HEADER, formatVoteOut, voteout_filename);   
    }
}

main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);
