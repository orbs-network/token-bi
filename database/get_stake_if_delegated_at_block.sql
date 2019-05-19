USE `orbs_token`;
DROP function IF EXISTS `get_stake_if_delegated_at_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_stake_if_delegated_at_block`(address_to_check CHAR(42), blockNumber BIGINT) RETURNS decimal(29,0)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;
DECLARE address_found CHAR(42) DEFAULT "";
DECLARE guardian_address CHAR(42) DEFAULT "";


-- its much faster to do this in seperate queries
-- delegate by delegate?
SELECT 
    source
INTO address_found FROM
    delegates
WHERE
    source = address_to_check
        AND block <= blockNumber
GROUP BY source;

-- delegate by transfer?
IF address_found != address_to_check THEN
    SELECT 
        source
    INTO address_found FROM
        transfers
    WHERE
        amount = 70000000000000000
            AND source = address_to_check
            AND block <= blockNumber
    GROUP BY source;
END IF;

-- guardian? (this is very slow because of the view, so we pre-query to check if the address is relevant for the computed answer)
IF address_found != address_to_check THEN
    SELECT 
        address 
    INTO guardian_address FROM
        guardians_register
    WHERE
        address = address_to_check
        AND block <= blockNumber;
    
    -- this address may be a guardian, check for the specific block
    IF guardian_address = address_to_check THEN
        SET @blockNumber := blockNumber;
        SELECT 
            address 
        INTO address_found FROM
            computed_guardians_at_block
        WHERE
            address = address_to_check;
    END IF;
END IF;

IF address_found = address_to_check THEN
    SELECT get_stake_at_block(address_to_check, blockNumber) INTO stake;
END IF;

RETURN stake;
END$$

DELIMITER ;

