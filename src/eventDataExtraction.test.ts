import { getFromAddressAddressFromEvent, getToAddressAddressFromEvent, extractAddressFromRawHexValue } from './eventDataExtraction';
import {EventData} from 'web3-eth-contract';

describe('Event data extraction', function () {
    const ADDRESS_A = 'fbb1b73c4f0bda4f67dca266ce6ef42f520fbb98';
    const ADDRESS_B = '9efd5eaf661864ac6668ca00531aa91fedcc674b';
    const ADDRESS_TOPIC_A = `0x000000000000000000000000${ADDRESS_A}`;
    const ADDRESS_TOPIC_B = `0x000000000000000000000000${ADDRESS_B}`;

    let event: EventData = null;

    beforeEach(() => {
       event = {
           returnValues: {},
           raw: {
               data: '',
               topics: [
                   '',
                   ADDRESS_TOPIC_A,
                   ADDRESS_TOPIC_B,
               ],
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
    });

    describe('getFromAddressAddressFromEvent', () => {
        test('Should extract the proper address', () => {
            const fromAddress = getFromAddressAddressFromEvent(event);

            expect(fromAddress).toBe(`0x${ADDRESS_A}`);
        });
    });

    describe('getToAddressAddressFromEvent', () => {
        test('Should extract the proper address - when it exists', () => {
            const toAddress = getToAddressAddressFromEvent(event);

            expect(toAddress).toBe(`0x${ADDRESS_B}`);
        });

        test("Should return null - when there is no 'to' address", () => {
            event.raw.topics[2] = null;

            const nullToAddress = getToAddressAddressFromEvent(event);

            expect(nullToAddress).toBe(null);
        });
    });

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