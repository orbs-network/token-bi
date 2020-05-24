-- This function returns the contract-stake (as in ORBS staked in the contract) of a given address up until the given block.

create
    definer = orbs@`%` function get_contract_stake_at_block(address char(42), blockNumber bigint) returns decimal(29)
BEGIN
DECLARE contract_stake DECIMAL(29,0) DEFAULT 0;

IF address = "0x0000000000000000000000000000000000000000" THEN
    SELECT 0 INTO contract_stake;
ELSE
    SELECT
        allStkEvnts.totalAmount
    INTO contract_stake FROM
        all_staking_events as allStkEvnts
            WHERE allStkEvnts.stakeOwner = address
            AND allStkEvnts.block <= blockNumber
            ORDER BY blockTime DESC
            LIMIT 1;
END IF;
RETURN contract_stake;
END;

