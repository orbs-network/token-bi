USE `orbs_token`;
DROP function IF EXISTS `get_elections_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_elections_block`(count INTEGER) RETURNS bigint(20)
BEGIN
DECLARE block BIGINT default 7528900;

WHILE count > 1 DO
	SET block = block + 20000;
    SET count = count - 1;
END WHILE;

RETURN block;
END$$

DELIMITER ;

