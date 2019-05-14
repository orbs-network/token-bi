USE `orbs_token`;
DROP function IF EXISTS `known_from`;

DELIMITER $$
USE `orbs_token`$$
CREATE FUNCTION `known_from` (address CHAR(42))
RETURNS VARCHAR(100)
BEGIN
DECLARE known_name VARCHAR(100) DEFAULT "unknown";

SELECT 
    KNOWN(source)
INTO known_name FROM
    transfers
WHERE
    recipient = address
ORDER BY block
LIMIT 1;

RETURN known_name;
END$$

DELIMITER ;

