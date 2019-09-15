const Web3 = require('web3');
const csv = require('fast-csv');
var ProgressBar = require('progress');
const fs = require('fs');


let ethereumConnectionURL = "https://mainnet.infura.io/v3/6e3487b19a364da6965ca35a72fb6d68"; //infura endpoint
let output_filename = "eth-balance.csv"; 
let input_filename = "addresses.csv";
let block = 8468900;


async function getBalanceFromEthereumAtBlock(web3, address, block) {
	balance = web3.eth.getBalance(address, block);
	return balance;
}

async function processEthereum(allAddresses) {
	let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
	
	var csvStr = `address,balance\n`;
	
	var green = '\u001b[42m \u001b[0m';
    var red = '\u001b[41m \u001b[0m';
	let bar = new ProgressBar(':bar \x1b[33m:percent :current/:total time spent: :elapseds done in: :etas\x1b[0m', { 
              complete: green,
              incomplete: red,
              width: 80,
              total: allAddresses.length });

	for (let i = 0; i < allAddresses.length;i++) {
		let address = allAddresses[i];
		let balance = await getBalanceFromEthereumAtBlock(web3, address.toLowerCase(), block);
		singleRow = `${address},${web3.utils.fromWei(balance)}\n`;
		csvStr += singleRow;
		bar.tick();
	}


    fs.writeFileSync(output_filename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `eth-balance CSV version file was saved to ${output_filename}!`);
}

async function main() {
    var allAddresses = [];

    csv.parseFile(input_filename, { headers: true })
	    .on('error', error => console.error(error))
	  	.on('data', row => allAddresses.push(row.address))
	  	.on('end', rowCount => processEthereum(allAddresses));
}

main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);