USE `orbs_token`;
DROP procedure IF EXISTS `sp_populate_delegators_for_next_election`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `sp_populate_delegators_for_next_election`()
BEGIN
-- DECLARE td, own, ts DECIMAL(29,0) DEFAULT 0;
DECLARE election_block BIGINT DEFAULT 0;

SELECT MAX(block) 
INTO election_block
FROM precalc_valid_delegators;

IF election_block is NULL THEN
	-- first election
	SET election_block = 7528900;
ELSE
	SET election_block = election_block + 20000;
END IF;

SET @blocknumber := election_block;
INSERT precalc_valid_delegators
SELECT
    null,
    address,
    election_block
FROM (
SELECT 
        source AS address
    FROM
        transfers t
    WHERE
        source != recipient
            AND id IN (SELECT 
                id
            FROM
                (SELECT 
                a.*
            FROM
                transfers a
            INNER JOIN (SELECT 
                source, MAX(block) block
            FROM
                transfers
            WHERE
                amount = 70000000000000000
                    AND block <= BLOCKNUMBER()
            GROUP BY source) b ON a.source = b.source
                AND a.block = b.block) trnsfr_most_recent_transfers
            WHERE
                (source , transactionindex) IN (SELECT 
                        source, MAX(transactionindex)
                    FROM
                        (SELECT 
                        a.*
                    FROM
                        transfers a
                    INNER JOIN (SELECT 
                        source, MAX(block) block
                    FROM
                        transfers
                    WHERE
                        amount = 70000000000000000
                            AND block <= BLOCKNUMBER()
                    GROUP BY source) b ON a.source = b.source
                        AND a.block = b.block) trnsfr_same_most_recent_transfers
                    GROUP BY source))
            AND source NOT IN (SELECT 
                    source
                FROM
                    delegates
                WHERE
                    block <= BLOCKNUMBER()) 
            AND get_ml_delegation_target_fast(recipient) IN (SELECT 
                address
            FROM
                computed_guardians_at_block
            WHERE
                address IN (SELECT 
                        gv.address
                    FROM
                        guardians_votes gv
                    WHERE
                        block > BLOCKNUMBER() - 45500
                            AND block <= BLOCKNUMBER())) UNION ALL SELECT 
        source AS address
    FROM
        delegates
    WHERE
        source != recipient
            AND id IN (SELECT 
                id
            FROM
                (SELECT 
                a.*
            FROM
                delegates a
            INNER JOIN (SELECT 
                id, source, MAX(block) block
            FROM
                delegates
            WHERE
                block <= BLOCKNUMBER()
            GROUP BY source) b ON a.source = b.source
                AND a.block = b.block) dlgt_most_recent
            WHERE
                (source , transactionindex) IN (SELECT 
                        source, MAX(transactionindex)
                    FROM
                        (SELECT 
                        a.*
                    FROM
                        delegates a
                    INNER JOIN (SELECT 
                        source, MAX(block) block
                    FROM
                        delegates
                    WHERE
                        block <= BLOCKNUMBER()
                    GROUP BY source) b ON a.source = b.source
                        AND a.block = b.block) zz
                    GROUP BY source))
            AND get_ml_delegation_target_fast(recipient) IN (SELECT 
                address
            FROM
                computed_guardians_at_block
            WHERE
                address IN (SELECT 
                        gv.address
                    FROM
                        guardians_votes gv
                    WHERE
                        block > BLOCKNUMBER() - 45500
                            AND block <= BLOCKNUMBER())) UNION ALL SELECT 
        address
    FROM
        computed_guardians_at_block
    WHERE
        address IN (SELECT 
                gv.address
            FROM
                guardians_votes gv
            WHERE
                block > BLOCKNUMBER() - 45500
                    AND block <= BLOCKNUMBER())) main_agg;

END$$

DELIMITER ;