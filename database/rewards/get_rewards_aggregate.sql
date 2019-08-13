USE `orbs_token`;
DROP procedure IF EXISTS `get_rewards_aggregate`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `get_rewards_aggregate`(IN election_num INTEGER)
BEGIN
CALL get_rewards_aggregate_in_range(election_num, 1);
END$$

DELIMITER ;

