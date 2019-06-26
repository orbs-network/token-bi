USE `orbs_token`;
DROP function IF EXISTS `guardian_vote_valid_at_block`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `guardian_vote_valid_at_block`(address_to_check CHAR(42), blockNumber BIGINT) RETURNS tinyint(1)
BEGIN
DECLARE the_address CHAR(42) DEFAULT "";
SELECT 
    gv.address
INTO the_address FROM
    guardians_votes gv
WHERE
    address = address_to_check
        AND block > BLOCKNUMBER() - 45500
        AND block <= BLOCKNUMBER()
GROUP BY gv.address;
        
IF the_address = address_to_check THEN
	RETURN 1;
ELSE
	RETURN 0;
END IF;
END$$

DELIMITER ;

