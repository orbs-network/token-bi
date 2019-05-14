USE `orbs_token`;
DROP function IF EXISTS `get_stake_at_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_stake_at_block`(address CHAR(42), blockNumber BIGINT) RETURNS decimal(29,0)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;

IF address = "0x0000000000000000000000000000000000000000" THEN
    SELECT 0 INTO stake;
ELSE
    SELECT 
        r.received - s.sent
    INTO stake FROM
        (SELECT 
            COALESCE(SUM(amount), 0) sent
        FROM
            transfers
        WHERE
            source = address
                AND block <= blockNumber) s,
        (SELECT 
            COALESCE(SUM(amount), 0) received
        FROM
            transfers
        WHERE
            recipient = address
                AND block <= blockNumber) r;
END IF;
RETURN stake;
END$$

DELIMITER ;

