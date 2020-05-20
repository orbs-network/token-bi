import Web3 from 'web3';

import {

   formatStaked,


  writeEventsDataToCsv
} from './src/csv/ecentsDataToCsv';
import {getEvents} from './src/erc20Events/erc20Events';
import {ABIS, CONTRACTS, CSV_CONSTANTS, STAKING_EVENT_NAMES} from './scriptConstants';
import {configs} from './scriptConfigs';
import {
  convertStakingEventDataToCsvRowForm,
  IOrbsCSVRowObjectFromStakingEvents
} from "./src/orbsEvents/orbsStakingEventConverter";
const { outputPaths, activationFlags, outputFlags, blocksReading } = configs;

async function main(startBlock: number, endBlock: number,  eventBatchingSize: number,
                    executionFlags: { doStaked: boolean; doUnstaked: boolean; doRestaked: boolean; doWithdrew: boolean },
                    outputFlags: { addHumanReadableDate: boolean }) {
  console.log(`STAKING-EVENTS Running for Ethereum blocks ${startBlock}-${endBlock}`);

  const web3 = await new Web3(new Web3.providers.HttpProvider(configs.ethereumConfigs.ethereumConnectionURL));

  const stakingContract = await new web3.eth.Contract(ABIS.staking, CONTRACTS.stakingContractAddress);

  if (executionFlags.doStaked) {
    const transferEvents: IOrbsCSVRowObjectFromStakingEvents[] = await getEvents(web3, stakingContract, STAKING_EVENT_NAMES.staked, startBlock, endBlock, eventBatchingSize, convertStakingEventDataToCsvRowForm);

    await writeEventsDataToCsv<IOrbsCSVRowObjectFromStakingEvents>(transferEvents, CSV_CONSTANTS.stakedHeader, STAKING_EVENT_NAMES.staked, outputPaths.staked, formatStaked, outputFlags.addHumanReadableDate);
  }

  if (executionFlags.doUnstaked) {
    const transferEvents: IOrbsCSVRowObjectFromStakingEvents[] = await getEvents(web3, stakingContract, STAKING_EVENT_NAMES.unstaked, startBlock, endBlock, eventBatchingSize, convertStakingEventDataToCsvRowForm);

    await writeEventsDataToCsv<IOrbsCSVRowObjectFromStakingEvents>(transferEvents, CSV_CONSTANTS.unstakedHeader, STAKING_EVENT_NAMES.unstaked, outputPaths.unstaked, formatStaked, outputFlags.addHumanReadableDate);
  }

  if (executionFlags.doRestaked) {
    const transferEvents: IOrbsCSVRowObjectFromStakingEvents[] = await getEvents(web3, stakingContract, STAKING_EVENT_NAMES.restaked, startBlock, endBlock, eventBatchingSize, convertStakingEventDataToCsvRowForm);

    await writeEventsDataToCsv<IOrbsCSVRowObjectFromStakingEvents>(transferEvents, CSV_CONSTANTS.restakedHeader, STAKING_EVENT_NAMES.restaked, outputPaths.restaked, formatStaked, outputFlags.addHumanReadableDate);
  }

  if (executionFlags.doWithdrew) {
    const transferEvents: IOrbsCSVRowObjectFromStakingEvents[] = await getEvents(web3, stakingContract, STAKING_EVENT_NAMES.withdrew, startBlock, endBlock, eventBatchingSize, convertStakingEventDataToCsvRowForm);

    await writeEventsDataToCsv<IOrbsCSVRowObjectFromStakingEvents>(transferEvents, CSV_CONSTANTS.withdrewHeader, STAKING_EVENT_NAMES.withdrew, outputPaths.withdrew, formatStaked, outputFlags.addHumanReadableDate);
  }
}

main(blocksReading.startBlock, blocksReading.endBlock, blocksReading.blocksInterval,
  {
    doStaked: activationFlags.processStaked,
    doUnstaked: activationFlags.processUntaked,
    doRestaked: activationFlags.processRestaked,
    doWithdrew: activationFlags.processWithdrew,
  }, {
    addHumanReadableDate: outputFlags.withHumanDate,
  })
  .then(results => {
    console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
  }).catch(console.error);
