USE `orbs_token`;
DROP function IF EXISTS `get_stake_if_delegated_at_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_stake_if_delegated_at_block`(address CHAR(42), blockNumber BIGINT) RETURNS decimal(29,0)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;
DECLARE address_found CHAR(42) DEFAULT "";


SELECT 
    source
INTO address_found FROM
    delegates
WHERE
    source = address
        AND block <= blockNumber
GROUP BY source;
    
IF address_found != address THEN
    SELECT 
        source
    INTO address_found FROM
        transfers
    WHERE
        amount = 70000000000000000
            AND source = address
            AND block <= blockNumber
    GROUP BY source;
END IF;

IF address_found = address THEN
    SELECT get_stake_at_block(address, blockNumber) INTO stake;
END IF;

RETURN stake;
END$$

DELIMITER ;

