USE `orbs_token`;
DROP function IF EXISTS `get_stake`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_stake`(address CHAR(42)) RETURNS decimal(29,0)
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
            source = address) s,
        (SELECT 
            COALESCE(SUM(amount), 0) received
        FROM
            transfers
        WHERE
            recipient = address) r;
END IF;
RETURN stake;
END$$

DELIMITER ;

