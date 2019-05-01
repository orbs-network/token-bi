const Web3 = require('web3');
const fs = require('fs');
const _ = require('lodash/core');
var ProgressBar = require('progress');

//let ethereumConnectionURL = "http://ec2-18-222-114-71.us-east-2.compute.amazonaws.com:8545"; //orbs endpoint
let ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint
let erc20ContractAddress = "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"; //token contract
let votingContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"; //voting
let guardiansContractAddress = "0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711"; //guardians
let startBlock = "7437000";//transactions start at 7437000; //contract created at 5710114 
//let endBlock = "7669000";//"7590000"; //_latest_ , first election at 7528900
//let endBlock = "7452866";//should be first 97 transfers - excluding mint+wallet change (so 99 total if start is "0")
let endBlock = "7470000";
let interval = 20000;
let doTransfers = false;
let doDelegates = true;
let transfers_filename = "transfers.csv"; 
let delegate_filename = "delegates.csv";
let withHumanDate = false;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const VOTING_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];


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
    return '0x' + topic.substring(26)
}

function getToAddressAddressFromEvent(event) {
    const TOPIC_TO_ADDR = 2;
    let topic = event.raw.topics[TOPIC_TO_ADDR];
    return '0x' + topic.substring(26)
}

function generateRowObject(amount,block, transactionIndex, txHash, transferFrom, transferTo, method,unix_date,human_date) {
    if (withHumanDate) {
        return {
            amount, block, transactionIndex, txHash, transferFrom, transferTo, method,unix_date,human_date
        }    
    } else {
        return {
            amount, block, transactionIndex, txHash, transferFrom, transferTo, method,unix_date
        } 
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
            let obj = generateRowObject(web3.utils.toBN(event.raw.data),event.blockNumber, event.transactionIndex, event.transactionHash, sourceAddress, receipientAddress, event.event,unix_date,human_date);
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

async function getTransferEvents(web3, tokenContract) {
    let transfers = await readAndMergeEvents(web3, tokenContract, startBlock, endBlock, 'Transfer', false);
    console.log('\x1b[33m%s\x1b[0m', `Merged to ${transfers.length} Transfer events`);

    let csvStr = 'From,To,Amount,txnIndex,txnHash,Block,UnixDate\n';
    if (withHumanDate) {
        csvStr = 'From,To,Amount,txnIndex,txnHash,Block,UnixDate,HumanDate\n';
    }

    for (let i = 0;i < transfers.length;i++) {
        let result = transfers[i];
        // too verbose..
        // console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m',
        //     `From`, `${result.transferFrom}`,
        //     `To`, `${result.transferTo}`,
        //     `amount`, `${result.amount}`,
        //     `at block`, `${result.block}`);
        let humanDatePart = ""
        if (withHumanDate) {
            humanDatePart = `,${result.human_date}`
        }

        csvStr += `${result.transferFrom},${result.transferTo},${result.amount},${result.transactionIndex},${result.txHash},${result.block},${result.unix_date}${humanDatePart}\n`;
    }

    fs.writeFileSync(transfers_filename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Transfers CSV version file was saved to ${transfers_filename}!`);
}

async function getDelegateEvents(web3, votingContract) {
    let delegates = await readAndMergeEvents(web3, votingContract, startBlock, endBlock, 'Delegate', false);
    console.log('\x1b[33m%s\x1b[0m', `Merged to ${delegates.length} Delegate events`);

    let csvStr = 'From,To,txnIndex,txnHash,Block,UnixDate\n';
    if (withHumanDate) {
        csvStr = 'From,To,txnIndex,txnHash,Block,UnixDate,HumanDate\n';
    }

    for (let i = 0;i < delegates.length;i++) {
        let result = delegates[i];

        let humanDatePart = ""
        if (withHumanDate) {
            humanDatePart = `,${result.human_date}`
        }

        csvStr += `${result.transferFrom},${result.transferTo},${result.transactionIndex},${result.txHash},${result.block},${result.unix_date}${humanDatePart}\n`;
    }

    fs.writeFileSync(delegate_filename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Delegate CSV version file was saved to ${delegate_filename}!`);
}

async function main() {
    validateInput();
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    if (doTransfers) {
        let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
        await getTransferEvents(web3, tokenContract);
    }

    if (doDelegates) {
        let votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);
        await getDelegateEvents(web3, votingContract);
    }
}

main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);
