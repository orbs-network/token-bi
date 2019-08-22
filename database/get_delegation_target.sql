USE `orbs_token`;
DROP function IF EXISTS `get_delegation_target`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_delegation_target`(address CHAR(42), blockNumber INTEGER) RETURNS CHAR(42) CHARSET latin1
BEGIN
DECLARE target_delegation CHAR(42) default "";


SELECT
    recipient
INTO 
    target_delegation
FROM (SELECT 
    source,
    recipient,
    block,
    'transfer' type
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
            AND block <= blockNumber
            AND source = address
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
                    AND block <= blockNumber
                    AND source = address
            GROUP BY source) b ON a.source = b.source
                AND a.block = b.block) trnsfr_same_most_recent_transfers
            GROUP BY source))
    AND source NOT IN (SELECT 
            source
        FROM
            delegates
        WHERE
            block <= blockNumber) 
UNION ALL SELECT 
    source,
    recipient,
    block,
    'delegate' type
FROM
    delegates
WHERE
    id IN (SELECT 
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
            block <= blockNumber
            AND source = address
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
                    block <= blockNumber
                    AND source = address
                GROUP BY source) b ON a.source = b.source
                    AND a.block = b.block) zz
                GROUP BY source))) both_merged;



RETURN target_delegation;
END$$

DELIMITER ;

