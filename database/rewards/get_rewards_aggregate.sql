USE `orbs_token`;
DROP procedure IF EXISTS `get_rewards_aggregate`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `get_rewards_aggregate`(IN election_num INTEGER)
BEGIN

SET @recentblocknumber := get_elections_block(election_num);

DROP TEMPORARY TABLE IF EXISTS tmp_rewards;
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_rewards(
    known VARCHAR(200),
    address CHAR(42),
    type VARCHAR(10),
    delegate_reward FLOAT,
    validator_reward FLOAT,
    guardian_reward FLOAT,
    election_block BIGINT,
    election_num INT,
    INDEX ix_address (address)
);

WHILE election_num >= 1 DO
    SET @blocknumber := get_elections_block(election_num);
    INSERT tmp_rewards
    SELECT
        known,
        address,
        type,
        delegate_reward,
        validator_reward,
        guardian_reward,
        @blocknumber,
        election_num
    FROM all_rewards;
    SET election_num = election_num - 1;
END WHILE;

SELECT 
    address,
    known,
    GET_REGION(address) AS region,
    IN_ORBS(GET_STAKE_AT_BLOCK(address, @recentblocknumber)) AS holdings_at_recent_election,
    IN_ORBS(GET_STAKE(address)) AS current_holdings,
    SUM(delegate_reward) AS accum_delegate_reward,
    SUM(validator_reward) AS accum_validator_reward,
    SUM(guardian_reward) AS accum_guardian_reward
FROM
    tmp_rewards
GROUP BY address;
DROP TEMPORARY TABLE IF EXISTS tmp_rewards;
END$$

DELIMITER ;

