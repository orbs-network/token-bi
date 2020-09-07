import fs from 'fs';

const earliestElection = 103;
const earliestElectionLastBlockBlock = 9568900;
const INTERVAL_BETWEEN_ELECTIONS = 20_000;

function generateBlocks(upUntilElection: number) {
  if (upUntilElection <= earliestElection) {
    throw new Error(`Invalid election number of ${upUntilElection}, minimum should be ${earliestElection + 1}`);
  }

  let currentElection = earliestElection + 1;
  let lastBlockIncluded = earliestElectionLastBlockBlock;

  const ELECTIONS = {};

  while (currentElection <= upUntilElection) {
    const lastBLockForCurrentElection = lastBlockIncluded + INTERVAL_BETWEEN_ELECTIONS;

    ELECTIONS[currentElection] = {
      firstBlock: lastBlockIncluded + 1,
      lastBlock: lastBLockForCurrentElection,
    };

    currentElection++;
    lastBlockIncluded = lastBLockForCurrentElection;
  }

  console.log(ELECTIONS);

  fs.writeFileSync('./src/electionBlocks.json', JSON.stringify(ELECTIONS, null, 2));
}

generateBlocks(190);
