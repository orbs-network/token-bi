# token-bi

This Repo holds scripts to extract all the ERC20 transfer events and Orbs PoS related events from Ethereum to an external database for research and analysis.

Part of its usage it to act as a control mechanism for the calculation of rewards around the PoS ecosystem.

## High level

There are two main parts to this system

1. Extracting data from Ethereum (via a node.js script using web3)
2. Analyzing the data extract to csv files (mysql)

## Installation and setup

To extract the data, after cloning the repo open `export-data.ts` and look into the different constants at the top, not going into too many details, we assume you understand what blocks are and how web3 works at the high level. We extract transfer events (ERC20), delegate events (Orbs PoS), guardian register/leave and voting (also Orbs PoS)

Data is extracted to csv files and indented to then be imported into a MySQL server for analysis.

The analysis part is entirely written in plain SQL and should work on any sql based database engine, but was only tested on MySQL.

## Using the Ethereum data export

After cloning, run `npm install` and then use `node export-data.ts` to trigger it.

It is important to check the settings inside the `export-data.ts` before running it, such as which blocks to run on - it works fine with Infura nodes and does not require any special setup from the Ethereum node.

## Using the SQL scripts

All the scripts are inside the `/databse` folder.

The development was done over AWS Aurora, so the `load-data` script is set to load data directly from s3, you can change it to load locally using the regular `LOAD DATA` syntax.

The database is denormalized, there are no relations between tables to simplify data input and manipulation.

`create.sql` holds all the tables in the system.

| Name                     | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| transfers                | Holds all ERC20 transfer events for ORBS token                   |
| delegates                | The delegate events from the Orbs PoS Voting contract            |
| known_addresses          | Helps track exchanges and other known entities                   |
| guardians_register       | Register events for guardians in the Orbs PoS Guardians contract |
| guardians_leave          | Leave events for guardians in the Orbs PoS Guardians contract    |
| guardians_votes          | Votes of guardians in the Orbs PoS Voting contract               |
| validators               | The list of validators in the system                             |
| precalc_valid_delegators | List of valid delegators for each election block (precalculated) |

Once data has been imported, there are several views, functions and stored procedures available for working with the ethereum based data:

### Common Functions:

* `get_stake(address)` - will show the current stake for an address (returns a floating point number)
* `get_stake_at_block(address, block)` - used in many of the views/aggregates to get the stake at a specific election block, returns a integer value of the stake
* `in_orbs(amount)` - will return the amount / 10^18, to convert from the raw amount data to 'Orbs' 
* `known(address)` - will attempt to convert the address to a 'known name' (usually an indication for an exchange)

### Common Views:

A Note about views, most of the views use a function called `BLOCKNUMBER()`, it returns the value stored in `@blockNumber`, and is sort of a workaround on passing a variable to a view. This means that for the views to return the expected data, a pre-query of setting `@blockNumber` is required, for example:

`select d.* from (select @blockNumber:=7528900) param, delegations_at_block d`

* `delegations_at_block` - returns all the delegation numbers pivoted by the delegate target. This calculation includes bad delegations (delgations made to a non-guardian address) and multi level delegations (delegate to someone who later delegates to a guardian). The guardian delegation values include the multi level ones.
* `total_delegated_to_address_at_block` - returns the total delegated to a specific addresses, uses the function ADDRESS() to get the address as a parameter, it reads @address variable so set it before calling.
* `computed_guardians_at_block` - the guardian list at a block (taking leave events into account)
* `xxxxxxx_rewards` - these are three views, guardians/delegators/validators views which return the raw rewards for a single election (by block)
* `all_rewards` - union of the above three

### Stored Procedures:

* `get_rewards_aggregate(number)` - will aggregate and get all of the reward data for the first X elections, it calls `get_rewards_aggregate_in_range(number,1)`
* `get_rewards_aggregate_in_range(start,end)` - will aggregate and get all of the reward data for the `start` election to `end` election, depends on the input number, it uses the function `get_elections_block` internally to set the block number for the different blocks
* `sp_get_region(address, region)` - will return the region of the given address into the `region` parameter. This will query the different Orbs token transfer trail until an address with a known region is found. If the source is coming from an Exchange, the region will be 'From Exchange'
* `sp_get_mld_value(source, last_own, total_delegate, guardian_address)` - will return the total multi level delegation (stake) for that guardian address. It will recurse starting at `source` to find out which guardian is eventually getting the delegation values. The purpose is to call this when we see delegation values on non-guardians, meaning that they are delegating to a guardian in a multi level delegation. `last_own` is used for tracking the value of the last delegator own delegation value in the recursion, and should be initiated with 0. It will be reduced from the total delegation when a guardian is found as its included in the regular calculation per guardian.
* `sp_populate_delegators_for_next_election()` - this will precalculate the valid delegators for next election, due to the multi level and some weird behaviour in MySQL with this query, it is required to run it manually after each data import, so the reward calculation will be correct for the election data imported. For example, if importing 100k blocks from ethereum, run this five times. (as each 20k blocks an election happens)
