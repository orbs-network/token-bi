USE `orbs_token`;
DROP procedure IF EXISTS `sp_get_region`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `sp_get_region`(IN the_address CHAR(42), OUT the_region VARCHAR(50))
BEGIN
DECLARE address_source CHAR(42) DEFAULT the_address;
SELECT "unknown" into the_region;

SELECT 
    region
INTO the_region FROM
    known_addresses
WHERE
    address = the_address;

IF the_region = "unknown" THEN
	SELECT 
		source
	INTO address_source FROM
		transfers
	WHERE
		recipient = the_address
	ORDER BY block
	LIMIT 1;

	CALL sp_get_region(address_source, the_region);
    IF the_region = "Exchange" THEN
		SELECT "From Exchange" INTO the_region;
	END IF;
END IF;
END$$

DELIMITER ;

