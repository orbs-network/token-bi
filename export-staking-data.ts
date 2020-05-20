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

  // if (executionFlags.doDelegates) {
  //   const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);
  //
  //   const delegatesEvents = await getEvents(web3, votingContract, EVENT_NAMES.delegate, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
  //   await writeEventsDataToCsv(delegatesEvents, CSV_CONSTANTS.delegatesHeader, EVENT_NAMES.delegate, outputPaths.delegates, formatDelegate, outputFlags.addHumanReadableDate);
  // }
  //
  // if (executionFlags.doGuardians) {
  //   const guardianContract = await new web3.eth.Contract(ABIS.guardians, CONTRACTS.guardiansContractAddress);
  //
  //   // Guardians register
  //   const guardianRegisterEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianRegister, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
  //   await writeEventsDataToCsv(guardianRegisterEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianRegister, outputPaths.guardiansRegister, formatGuardian, outputFlags.addHumanReadableDate);
  //
  //   // Guardians leave
  //   const guardianLeaveEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianLeave, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
  //   await writeEventsDataToCsv(guardianLeaveEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianLeave, outputPaths.guardiansLeave, formatGuardian, outputFlags.addHumanReadableDate);
  // }
  //
  // if (executionFlags.doVotes) {
  //   const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);
  //
  //   const voteoutEvents = await getEvents(web3, votingContract, EVENT_NAMES.voteOut, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
  //   await writeEventsDataToCsv(voteoutEvents, CSV_CONSTANTS.voteOutHeader, EVENT_NAMES.voteOut, outputPaths.voteOut, formatVoteOut, outputFlags.addHumanReadableDate);
  // }
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
