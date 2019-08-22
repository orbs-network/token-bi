USE `orbs_token`;
DROP procedure IF EXISTS `sp_get_mld_value`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `sp_get_mld_value`(IN source CHAR(42), IN last_own DECIMAL(29, 0), OUT total_delegate DECIMAL(29,0), OUT guardian_address CHAR(42))
BEGIN
DECLARE td, own, ts DECIMAL(29,0) DEFAULT 0;
DECLARE is_g tinyint(1) DEFAULT 0;

SET @address = source;
-- TEST: TWO LEVELS (MORE THAN ONE)
SELECT 
	delegated_to, total_delegated, own_stake, total_stake, is_guardian 
INTO 
	guardian_address, td, own, ts, is_g
FROM 
	total_delegated_to_address_at_block;

IF is_g = 1 THEN -- handles the main stop condition
	SELECT 0 - last_own INTO total_delegate;
	SELECT source INTO guardian_address;
ELSEIF guardian_address = "" OR guardian_address IS NULL THEN -- handles bad delegation
	SELECT 0 INTO total_delegate;
	SELECT source INTO guardian_address;
ELSE -- multi level delegation, handles the recursive call
	CALL sp_get_mld_value(guardian_address, own, total_delegate, guardian_address);
	SELECT total_delegate + ts INTO total_delegate;
END IF;
END$$

DELIMITER ;