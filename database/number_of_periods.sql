USE `orbs_token`;
DROP function IF EXISTS `number_of_periods`;

DELIMITER $$
USE `orbs_token`$$
CREATE FUNCTION `number_of_periods` ()
RETURNS FLOAT
BEGIN

RETURN 117.23;
END$$

DELIMITER ;

