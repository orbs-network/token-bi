USE `orbs_token`;
DROP function IF EXISTS `known`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `known`(unknown_address CHAR(42)) RETURNS varchar(100) CHARSET latin1
BEGIN
DECLARE known_name VARCHAR(100) default "unknown";
SELECT 
    name
INTO known_name FROM
    known_addresses
WHERE
    address = unknown_address;
RETURN known_name;
END$$

DELIMITER ;

