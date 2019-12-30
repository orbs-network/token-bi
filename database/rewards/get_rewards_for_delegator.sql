USE `orbs_token`;
DROP procedure IF EXISTS `get_rewards_for_delegator`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `get_rewards_for_delegator`(IN election_num_start INTEGER, IN election_num_end INTEGER, IN filter_address CHAR(42))
BEGIN

DROP TEMPORARY TABLE IF EXISTS tmp_drewards;
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_drewards(
    known VARCHAR(200),
    address CHAR(42),
    stake decimal(29,4),
    delegators_reward FLOAT,
    election_block BIGINT,
    election_num INT,
    INDEX ix_address (address)
);

WHILE election_num_start >= election_num_end DO
    SET @blocknumber := get_elections_block(election_num_start);
    INSERT tmp_drewards
    SELECT
        known,
        address,
        stake,
        delegators_reward,
        @blocknumber,
        election_num_start
    FROM delegators_rewards
    WHERE address = filter_address;
    SET election_num_start = election_num_start - 1;
END WHILE;

SELECT 
    address,
    known,
    GET_REGION(address) AS region,
    stake AS stake_at_election,
    IN_ORBS(GET_STAKE(address)) AS current_holdings,
    delegators_reward,
    election_block,
    election_num
FROM
    tmp_drewards;
DROP TEMPORARY TABLE IF EXISTS tmp_rewards;
END$$

DELIMITER ;

