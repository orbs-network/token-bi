USE `orbs_token`;
DROP function IF EXISTS `get_ml_delegation_value`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_ml_delegation_value`(input_address CHAR(42)) RETURNS DECIMAL(29,0) 
BEGIN
	DECLARE target_guardian char(42) DEFAULT "unknown";
	DECLARE value DECIMAL(29,0) DEFAULT "unknown";
	CALL sp_get_mld_value(input_address, 0, value, target_guardian);
	RETURN value;
END$$

DELIMITER ;

