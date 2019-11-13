import { getFromAddressAddressFromEvent, extractAddressFromRawHexValue } from './eventDataExtraction';
import {EventData} from 'web3-eth-contract';

describe('Event data extraction', function () {
    const ADDRESS_A = 'fbb1b73c4f0bda4f67dca266ce6ef42f520fbb98';
    const ADDRESS_B = '9efd5eaf661864ac6668ca00531aa91fedcc674b';
    const ADDRESS_TOPIC_A = `0x000000000000000000000000${ADDRESS_A}`;
    const ADDRESS_TOPIC_B = `0x000000000000000000000000${ADDRESS_B}`;

    const demoEvent : EventData = {
        returnValues: {},
        raw: {
            data: '',
            topics: ['', ''],
        },
        event: '',
        signature: '',
        logIndex: 0,
        transactionIndex: 0,
        transactionHash: '',
        blockHash: '',
        blockNumber: 0,
        address: '',
    };

    // test('getFromAddressAddressFromEvent', () => {
    //
    // })

    describe('extractAddressFromRawHexValue', () => {
        test('Should extract the proper address', () => {
            const resultA = extractAddressFromRawHexValue(ADDRESS_TOPIC_A);
            const resultB = extractAddressFromRawHexValue(ADDRESS_TOPIC_B);

            expect(resultA).toBe(`0x${ADDRESS_A}`);
            expect(resultB).toBe(`0x${ADDRESS_B}`);
        });

        test('Should only expect 66 chars strings', () => {
            expect(() => extractAddressFromRawHexValue('')).toThrow();
            expect(() => extractAddressFromRawHexValue(ADDRESS_TOPIC_A + 'extra')).toThrowError();
        });
    });
});