import Web3 from 'web3';

import { configs } from './scriptConfigs'
import {ABIS, CONTRACTS, CSV_CONSTANTS, EVENT_NAMES} from './scriptConstants';

import {
    formatDelegate,
    formatGuardian,
    formatTransfer,
    formatVoteOut,
    writeEventsDataToCsv
} from './src/csv/ecentsDataToCsv';
import {getEvents} from './src/erc20Events/erc20Events';
import { convertEventDataToCsvRowForm } from './src/orbsEvents/orbsEventConverter'


async function main(startBlock: number, endBlock: number,  eventBatchingSize: number,
                    executionFlags: { doTransfers: boolean, doDelegates: boolean, doGuardians: boolean, doVotes: boolean },
                    outputFlags: { addHumanReadableDate: boolean }) {
    const web3 = await new Web3(new Web3.providers.HttpProvider(configs.ethereumConfigs.ethereumConnectionURL));

    if (executionFlags.doTransfers) {
        const tokenContract = await new web3.eth.Contract(ABIS.token, CONTRACTS.erc20ContractAddress);
        const transferEvents = await getEvents(web3, tokenContract, EVENT_NAMES.transfer, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);

        await writeEventsDataToCsv(transferEvents, CSV_CONSTANTS.transfersHeader, EVENT_NAMES.transfer, configs.outputPaths.transfers, formatTransfer, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doDelegates) {
        const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);

        const delegatesEvents = await getEvents(web3, votingContract, EVENT_NAMES.delegate, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(delegatesEvents, CSV_CONSTANTS.delegatesHeader, EVENT_NAMES.delegate, configs.outputPaths.delegates, formatDelegate, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doGuardians) {
        const guardianContract = await new web3.eth.Contract(ABIS.guardians, CONTRACTS.guardiansContractAddress);

        // Guardians register
        const guardianRegisterEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianRegister, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(guardianRegisterEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianRegister, configs.outputPaths.guardiansRegister, formatGuardian, outputFlags.addHumanReadableDate);

        // Guardians leave
        const guardianLeaveEvents = await getEvents(web3, guardianContract, EVENT_NAMES.guardianLeave, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(guardianLeaveEvents, CSV_CONSTANTS.guardiansHeader, EVENT_NAMES.guardianLeave, configs.outputPaths.guardiansLeave, formatGuardian, outputFlags.addHumanReadableDate);
    }

    if (executionFlags.doVotes) {
        const votingContract = await new web3.eth.Contract(ABIS.voting, CONTRACTS.votingContractAddress);

        const voteoutEvents = await getEvents(web3, votingContract, EVENT_NAMES.voteOut, startBlock, endBlock, eventBatchingSize, convertEventDataToCsvRowForm);
        await writeEventsDataToCsv(voteoutEvents, CSV_CONSTANTS.voteOutHeader, EVENT_NAMES.voteOut, configs.outputPaths.voteOut, formatVoteOut, outputFlags.addHumanReadableDate);
    }
}

main(configs.blocksReading.startBlock, configs.blocksReading.endBlock, configs.blocksReading.blocksInterval,
    {
        doTransfers: configs.activationFlags.processTransfers,
        doDelegates: configs.activationFlags.processDelegates,
        doGuardians: configs.activationFlags.processGuardians,
        doVotes: configs.activationFlags.processVotes,
    }, {
        addHumanReadableDate: configs.outputFlags.withHumanDate,
    })
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);
