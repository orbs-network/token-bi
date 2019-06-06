# token-bi

This Repo holds scripts to extract all the ERC20 transfer events and orbs PoS related events from Ethereum to an external database for research and analysis.

Part of its usage it to act as a control mechanism for the calculation of rewards around the PoS ecosystem.

## High level

There are two main parts to this system

1. Extracting data from Ethereum (via a node.js script using web3)
2. Analyzing the data extract to csv files (mysql)

## Installation and setup

To extract the data, after cloning the repo open `export-data.js` and look into the different constants at the top, not going into too many details, we assume you understand what blocks are and how web3 works at the high level. We extract transfer events (ERC20), delegate events (Orbs PoS), guardian register/leave and voting (also Orbs PoS)

Data is extracted to csv files and indented to then be imported into a MySQL server for analysis.

The analysis part is entirely written in plain SQL and should work on any sql based database engine, but was only tested on MySQL.

## Using the Ethereum data export

After cloning, run `npm install` and then use `node export-data.js` to trigger it.

It is important to check the settings inside the `export-data.js` before running it, such as which blocks to run on - it works fine with Infura nodes and does not require any special setup from the Ethereum node.

## Using the SQL scripts

All the scripts are inside the `/databse` folder.

The development was done over AWS Aurora, so the `load-data` script is set to load data directly from s3, you can change it to load locally using the regular `LOAD DATA` syntax.

The database is denormalized, there are no relations between tables to simplify data input and manipulation.

`create.sql` holds all the tables in the system.

| Name               | Description                                                      |
|--------------------|------------------------------------------------------------------|
| transfers          | Holds all ERC20 transfer events for Orbs token                   |
| delegates          | The delegate events from the Orbs PoS Voting contract            |
| known_addresses    | Helps track exchanges and other known entities                   |
| guardians_register | Register events for guardians in the Orbs PoS Guardians contract |
| guardians_leave    | Leave events for guardians in the Orbs PoS Guardians contract    |
| guardians_votes    | Votes of guardians in the Orbs PoS Voting contract               |
| validators         | The list of validators in the system                             |

Once data has been imported, there are several views, functions and stored procedures available for working with the ethereum based data:

### Common Functions:

* `get_stake(address)` - will show the current stake for an address (returns a floating point number)
* `get_stake_at_block(address, block)` - used in many of the views/aggregates to get the stake at a specific election block, returns a integer value of the stake
* `in_orbs(amount)` - will return the amount / 10^18, to convert from the raw amount data to 'Orbs' 
* `known(address)` - will attempt to convert the address to a 'known name' (usually an indication for an exchange)

### Common Views:

A Note about views, most of the views use a function called `BLOCKNUMBER()`, it returns the value stored in `@blockNumber`, and is sort of a workaround on passing a variable to a view. This means that for the views to return the expected data, a pre-query of setting `@blockNumber` is required, for example:

`select d.* from (select @blockNumber:=7528900) param, delegations_at_block d`

* `delegations_at_block` - returns all the delegation numbers pivoted by the delegate target (all of which should be a guardian, but we have some incorrect delegations in the ecosystem as of writing this)
* `computed_guardians_at_block` - the guardian list at a block (taking leave events into account)
* `xxxxxxx_rewards` - these are three views, guardians/delegators/validators views which return the raw rewards for a single election (by block)
* `all_rewards` - union of the above three

### Stored Procedures:

* `get_rewards_aggregate(number)` - all aggregate and get all of the reward data for the first X elections, depends on the input number, it uses the function `get_elections_block` internally to set the block number for the different blocks