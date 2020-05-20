/* eslint-disable @typescript-eslint/camelcase,@typescript-eslint/no-use-before-define */
// Imports for types
import {EventData} from 'web3-eth-contract';
import BN from 'bn.js';
import Web3 from 'web3';
import {TEventConverterFunction} from '../erc20Events/erc20Events';
import {
    getFromAddressAddressFromEvent,
    getToAddressAddressFromEvent
} from '../fieldsExtraction/eventFieldsExtraction';
import {Block} from 'web3-eth';
import {ITypedEventData} from "../types/typesUtils";

/**
 * DEV_NOTE : COPIED from 'orbs-pos-data'
 * It just so happens that all of the staking related events have the same signature.
 * DEV_NOTE : The real object will also have array accessors ("1", "2", "3") that match the named members.
 * DEV_NOTE : Currently amounts are strings, in the future should change to bigint)
 */
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IStakingContractEventValues {
    stakeOwner: string;
    // TODO : O.L : Change this to bigint after web3 change
    amount: string; // Amount for the event
    // TODO : O.L : Change this to bigint after web3 change
    totalStakedAmount: string; // Total staked amount for given owner
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IOrbsCSVRowObjectFromStakingEvents {
    // Event data
    stakeOwner: string;
    eventAmount: BN;
    totalAmount: BN;

    // Event meta data
    method: string;

    // Transaction data
    transactionIndex: number;
    txHash: string;
    block: number;
    unix_date: number;
    human_date: string;
}

export const convertStakingEventDataToCsvRowForm: TEventConverterFunction<IOrbsCSVRowObjectFromStakingEvents> = (web3: Web3, event: ITypedEventData<IStakingContractEventValues>, eventTransactionBlock: Block) => {
    // Stake owner is the sender of the tx
    const stakeOwnerAddress = event.returnValues.stakeOwner;
    const eventAmount = new BN(event.returnValues.amount);
    const totalStakedAmount = new BN(event.returnValues.totalStakedAmount);


    // event data
    const { blockNumber, transactionIndex, transactionHash, event: eventName } = event;

    // Ensure numeric timestamp
    const { timestamp } = eventTransactionBlock;
    const unixTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

    const jsTimestamp = new Date(unixTimestamp * 1000);

    let humanDate = jsTimestamp.toUTCString();
    humanDate = humanDate.slice(0, 3) + humanDate.slice(4);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // const obj = generateRowObject(amount,event.blockNumber, event.transactionIndex, event.transactionHash, sourceAddress, recipientAddress, event.event, unixTimestamp, humanDate, logData);
    const obj = generateRowObject(stakeOwnerAddress, eventAmount, totalStakedAmount, blockNumber, transactionIndex, transactionHash, eventName, unixTimestamp, humanDate);

    return obj;
};


function generateRowObject(stakeOwner: string,
                           eventAmount: BN,
                           totalAmount: BN,
                           block: number,
                           transactionIndex: number, txHash: string,
                           method: string,
                           unixDate: number, humanDate: string): IOrbsCSVRowObjectFromStakingEvents{
    const csvRowForStakingEvent: IOrbsCSVRowObjectFromStakingEvents = {
        stakeOwner,
        eventAmount,
        totalAmount,
        method,
        transactionIndex,
        txHash,
        block,
        unix_date: unixDate,
        human_date: humanDate,
    };

    return csvRowForStakingEvent;

    // return {
    //     // NOTE : needs to manually check the return object property names
    //     // eslint-disable-next-line @typescript-eslint/camelcase
    //     amount, block, transactionIndex, txHash, transferFrom, transferTo, method, unix_date: unixDate, human_date: humanDate, logData
    // }
}
