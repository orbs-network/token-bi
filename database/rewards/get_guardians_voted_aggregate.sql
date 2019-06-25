USE `orbs_token`;
DROP procedure IF EXISTS `get_guardians_voted_aggregate`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `get_guardians_voted_aggregate`(IN election_num INTEGER)
BEGIN

DROP TEMPORARY TABLE IF EXISTS tmp_excellence;
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_excellence(
    address CHAR(42),
    election_block BIGINT,
    election_number INT,
    INDEX ix_address (address)
);

WHILE election_num >= 1 DO
    SET @blocknumber := get_elections_block(election_num);
    INSERT tmp_excellence
    SELECT
        address,
        @blocknumber,
        election_num
    FROM delegations_at_block d
    WHERE d.is_guardian = 1
                AND d.address IN (SELECT 
                    gv.address
                FROM
                    guardians_votes gv
                WHERE
                    block > @blocknumber - 45500
                        AND block <= @blocknumber)
        ORDER BY d.total_stake DESC;
    SET election_num = election_num - 1;
END WHILE;

SELECT 
    KNOWN(address), 
    address, 
    COUNT(address) AS elegible_count,
    MIN(election_block) AS first_election_block,
    MIN(election_number) AS first_election
FROM
    tmp_excellence
GROUP BY address;
DROP TEMPORARY TABLE IF EXISTS tmp_excellence;
END$$

DELIMITER ;

