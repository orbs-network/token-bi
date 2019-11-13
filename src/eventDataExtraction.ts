import {EventData} from 'web3-eth-contract';

/**
 * Extract the 'sender' address from the given event.
 */
export function getFromAddressAddressFromEvent(event: EventData) : string {
    const TOPIC_FROM_ADDR_INDEX = 1;
    const senderTopic = event.raw.topics[TOPIC_FROM_ADDR_INDEX];

    return extractAddressFromRawHexValue(senderTopic);
}

/**
 * Extract the 'receiver' address from the given event.
 */
export function getToAddressAddressFromEvent(event: EventData) : string {
    const TOPIC_TO_ADDR_INDEX = 2;
    const receiverTopic = event.raw.topics[TOPIC_TO_ADDR_INDEX];

    if (receiverTopic === null) {
        return null;
    } else {
        return extractAddressFromRawHexValue(receiverTopic);
    }
}

/**
 * Receives a HEX representation of a 32 bytes data (used for the event 'topic's)
 * and extract the value of the address from it.
 */
export function extractAddressFromRawHexValue(rawHexString: string) : string {
    // 20 bytes addresses
    const ADDRESS_LENGTH_IN_HEX_CHARS = 40;
    // 32 bytes addresses + '0x'
    const RAW_LENGTH_IN_HEX_CHARS = 66;

    // Validate length
    if (rawHexString.length !== RAW_LENGTH_IN_HEX_CHARS) {
        throw new Error(`raw hex string should be of made of 66 chars ('0x' + 64 hex chars (32 bytes)). instead, input has ${rawHexString.length}`);
    }

    return `0x${rawHexString.substring(RAW_LENGTH_IN_HEX_CHARS - ADDRESS_LENGTH_IN_HEX_CHARS)}`;
}