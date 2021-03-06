USE `orbs_token`;
DROP function IF EXISTS `get_region`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_region`(input_address CHAR(42)) RETURNS varchar(50) CHARSET latin1
BEGIN
	DECLARE the_region VARCHAR(50) DEFAULT "unknown";
	DECLARE distance INT DEFAULT 0;
	CALL sp_get_region(input_address, the_region, distance);
	RETURN the_region;
END$$

DELIMITER ;

