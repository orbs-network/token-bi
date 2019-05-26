USE `orbs_token`;
DROP function IF EXISTS `in_orbs`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `in_orbs`(amount decimal(29,0)) RETURNS decimal(29,4)
BEGIN
RETURN amount / 1000000000000000000;
END$$

DELIMITER ;

