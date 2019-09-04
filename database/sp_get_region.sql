USE `orbs_token`;
DROP procedure IF EXISTS `sp_get_region`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `sp_get_region`(IN the_address CHAR(42), OUT the_region VARCHAR(50), OUT distance INT)
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
	SELECT distance + 1 INTO distance;

	SELECT 
		source
	INTO address_source FROM
		transfers
	WHERE
		recipient = the_address
	ORDER BY block
	LIMIT 1;

	IF address_source != the_address THEN
		CALL sp_get_region(address_source, the_region, distance);
		IF the_region = "Exchange" THEN
			SELECT "From Exchange" INTO the_region;
		END IF;
    END IF;
END IF;
END$$

DELIMITER ;

