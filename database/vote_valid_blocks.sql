USE `orbs_token`;
DROP function IF EXISTS `vote_valid_blocks`;

DELIMITER $$
USE `orbs_token`$$
CREATE FUNCTION `vote_valid_blocks` ()
RETURNS BIGINT
BEGIN

RETURN 45000;
END$$

DELIMITER ;

