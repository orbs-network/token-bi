
USE `orbs_token`;
DROP function IF EXISTS `get_region_distance`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_region_distance`(input_address CHAR(42)) RETURNS INT
BEGIN
	DECLARE the_region VARCHAR(50) DEFAULT "unknown";
	DECLARE distance INT DEFAULT 0;
	CALL sp_get_region(input_address, the_region, distance);
	RETURN distance;
END$$

DELIMITER ;
