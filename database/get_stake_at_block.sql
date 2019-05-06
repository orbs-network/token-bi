DELIMITER $$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_stake_at_block`(address CHAR(42), blockNumber BIGINT) RETURNS decimal(29,0)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;

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

RETURN stake;
END$$
DELIMITER ;