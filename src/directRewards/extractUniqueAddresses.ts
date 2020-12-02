import fs from 'fs';
const parse = require('csv-parse/lib/sync')

const FILE_NAME = './staked_117_171.csv'
const STAKER_ADDRESS_INDEX = 0;

async function main() {
    const rawFileText = fs.readFileSync(FILE_NAME).toString();
    const lines = parse(rawFileText);
    const  [headerLine, ...dataLines] = lines;

    const onlyAddresses = dataLines.map(line => line[STAKER_ADDRESS_INDEX]);
    const addressesSet = new Set(onlyAddresses);
    const uniqueAddresses = Array.from(addressesSet);

    console.log(`Found ${uniqueAddresses.length} unique addresses with staking`);

    fs.writeFileSync('./uniqueAddresses.json', JSON.stringify(uniqueAddresses, null, 2));
}

main();