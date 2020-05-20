/* eslint-disable @typescript-eslint/no-use-before-define */
import fs from "fs";
import {IOrbsCSVRowObjectFromStakingEvents} from "../orbsEvents/orbsStakingEventConverter";
import BN from "bn.js";

type FlagsForCsvFormatter = { addHumanReadableDate: boolean };

/**
 * Creates the CSV file Content from the given eventsData + appendFunction and then writes the results to the file with the given name.
 */
export async function writeEventsDataToCsv<T = any>(eventsData: T[], csvHeader: string, eventName, outputFilename: string, appendFunc: (rowData: T, flags: FlagsForCsvFormatter) => string, withHumanDate: boolean) {
    let csvStr = csvHeader + "\n";
    if (withHumanDate) {
        csvStr = csvHeader + ',HumanDate\n';
    }

    const flagsForCsvFormatter: FlagsForCsvFormatter = { addHumanReadableDate: withHumanDate };

    for (let i = 0;i < eventsData.length;i++) {
        const row = eventsData[i];
        csvStr += appendFunc(row, flagsForCsvFormatter);
    }

    fs.writeFileSync(outputFilename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `${eventName} CSV version file was saved to ${outputFilename}!`);
}

export function formatTransfer(row, flags: FlagsForCsvFormatter) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transferTo},${row.amount},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatDelegate(row, flags: FlagsForCsvFormatter) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transferTo},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatGuardian(row, flags: FlagsForCsvFormatter) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatVoteOut(row, flags: FlagsForCsvFormatter) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.logData.counter.toString(10)};${row.transferFrom};${JSON.stringify(row.logData.validators)};${row.transactionIndex};${row.txHash};${row.block};${row.unix_date}${humanDatePart}\n`;
}

export function formatStaked(row: IOrbsCSVRowObjectFromStakingEvents, flags: FlagsForCsvFormatter) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';

    const fields: (string|number|BN)[] = [
      // row.method, // No need for 'method' as we are using separated tables
      row.stakeOwner,
      row.eventAmount,
      row.totalAmount,
      row.transactionIndex,
      row.txHash,
      row.block,
      row.unix_date,
      humanDatePart,
    ];
    return (fields.join(';') + '\n');
}

function getHumanDateForRow(row, delim) {
    const humanDatePart = `${delim}${row.human_date}`;

    return humanDatePart;
}
