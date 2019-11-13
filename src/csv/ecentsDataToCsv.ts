import fs from "fs";

/**
 * Creates the CSV file Content from the given eventsData + appendFunction and then writes the results to the file with the given name.
 */
export async function writeEventsDataToCsv(eventsData: any[], csvHeader: string, eventName, outputFilename: string, appendFunc, withHumanDate: boolean) {
    let csvStr = csvHeader + "\n";
    if (withHumanDate) {
        csvStr = csvHeader + ',HumanDate\n';
    }

    const flagsForCsvFormatter = { addHumanReadableDate: withHumanDate };

    for (let i = 0;i < eventsData.length;i++) {
        const row = eventsData[i];
        csvStr += appendFunc(row, flagsForCsvFormatter);
    }

    fs.writeFileSync(outputFilename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `${eventName} CSV version file was saved to ${outputFilename}!`);
}

export function formatTransfer(row, flags: { addHumanReadableDate: boolean }) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transferTo},${row.amount},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatDelegate(row, flags: { addHumanReadableDate: boolean }) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transferTo},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatGuardian(row, flags: { addHumanReadableDate: boolean }) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.transferFrom},${row.transactionIndex},${row.txHash},${row.block},${row.unix_date}${humanDatePart}\n`;
}

export function formatVoteOut(row, flags: { addHumanReadableDate: boolean }) {
    const humanDatePart = flags.addHumanReadableDate ? getHumanDateForRow(row, ";") : '';
    return `${row.logData.counter.toString(10)};${row.transferFrom};${JSON.stringify(row.logData.validators)};${row.transactionIndex};${row.txHash};${row.block};${row.unix_date}${humanDatePart}\n`;
}

function getHumanDateForRow(row, delim) {
    let humanDatePart = `${delim}${row.human_date}`;

    return humanDatePart;
}