-- This function returns the latest contract-stake (as in ORBS staked in the contract) of a given address

create
    definer = orbs@`%` function get_contract_stake(address char(42)) returns decimal(29)
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
            ORDER BY blockTime DESC
            LIMIT 1;
END IF;
RETURN contract_stake;
END;

