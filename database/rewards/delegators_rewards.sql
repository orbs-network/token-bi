USE `orbs_token`;
CREATE OR REPLACE VIEW `delegators_rewards` AS
-- returns the delegates rewards as a specific block number - which should be an elections block number 
-- this is just the delegates part on a **specific** block, not the accumulated reward
SELECT 
    address,
    KNOWN(address) AS known,
    GET_REGION(address) AS region,
    IN_ORBS(stake) AS stake,
    IN_ORBS(delegators_reward) AS delegators_reward
FROM
    (SELECT 
        address,
        GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) stake,
        block,
        GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS delegators_reward
    FROM
        precalc_valid_delegators
    WHERE
        block = BLOCKNUMBER())e
