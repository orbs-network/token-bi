USE `orbs_token`;
CREATE  OR REPLACE VIEW `all_rewards` AS
    SELECT 
        known,
        address,
        'validator' type,
        0 AS delegate_reward,
        FLOOR(validators_total_reward) AS validator_reward,
        0 AS guardian_reward
    FROM
        validators_rewards 
    UNION ALL SELECT 
        known,
        address,
        'delegator' type,
        FLOOR(delegators_reward) AS delegate_reward,
        0 AS validator_reward,
        0 AS guardian_reward
    FROM
        delegators_rewards 
    UNION ALL SELECT 
        known,
        address,
        'guardian' type,
        0 AS delegate_reward,
        0 AS validator_reward,
        FLOOR(top10_guardian_reward) AS guardian_reward
    FROM
        guardians_rewards;
