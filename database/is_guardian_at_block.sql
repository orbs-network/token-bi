USE `orbs_token`;
DROP function IF EXISTS `is_guardian_at_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE FUNCTION `is_guardian_at_block` (address_to_check CHAR(42), blockNumber BIGINT) RETURNS BOOL
BEGIN
DECLARE address_found CHAR(42) DEFAULT "";
SET @blocknumber := blockNumber;

SELECT 
    address
INTO address_found FROM
    computed_guardians_at_block
WHERE
    address = address_to_check;

IF address_found = address_to_check THEN
	RETURN 1;
END IF;
RETURN 0;
END$$

DELIMITER ;

