USE `orbs_token`;
CREATE  OR REPLACE VIEW `validators_rewards` AS
    SELECT 
        known,
        address,
        IN_ORBS(stake),
        IN_ORBS(stake_reward),
        million_reward_in_orbs,
        IN_ORBS(stake_reward) + million_reward_in_orbs AS validators_total_reward
    FROM
        (SELECT 
            KNOWN(address) AS known,
                address,
                GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) AS stake,
                GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) * 0.04 / NUMBER_OF_PERIODS() AS stake_reward,
                1000000 / NUMBER_OF_PERIODS() AS million_reward_in_orbs
        FROM
            validators
        WHERE
            COALESCE(validUntilBlock, POW(2, 64) - 1) > BLOCKNUMBER()) res;
