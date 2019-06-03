USE `orbs_token`;
DROP function IF EXISTS `vote_valid_blocks`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `vote_valid_blocks`() RETURNS bigint(20)
BEGIN

RETURN 45500;
END$$

DELIMITER ;

