USE `orbs_token`;
DROP function IF EXISTS `guardian_reward_pool`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `guardian_reward_pool`(electionsBlock BIGINT) RETURNS decimal(10,4)
BEGIN
DECLARE pool_size FLOAT DEFAULT 0.0;
DECLARE all_stake DECIMAL(29,0) DEFAULT 0;

SELECT 
    IN_ORBS(SUM(total_stake))
INTO all_stake FROM
    (SELECT @blockNumber:=electionsBlock) param,
    delegations_at_block d
WHERE
    d.is_guardian = 1
        AND d.address IN (SELECT 
            gv.address
        FROM
            guardians_votes gv
        WHERE
            block > electionsBlock - 45500
                AND block <= electionsBlock);

-- more than 400million stake? pool is capped at 40M annual, and reward eventually is 10% stake
if all_stake > 400000000 THEN
    SELECT 40000000 INTO pool_size;
ELSE
    SELECT all_stake * 0.1 INTO pool_size;
END IF;

RETURN pool_size / NUMBER_OF_PERIODS();
END$$

DELIMITER ;

