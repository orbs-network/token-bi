CREATE FUNCTION blockNumber() RETURNS INTEGER DETERMINISTIC NO SQL RETURN @blockNumber;

CREATE VIEW delegations_at_block as
SELECT 
    known_name,
    address,
    MAX(delegated_stake),
    own_stake,
    total_stake,
    is_guardian
FROM
    (SELECT 
        KNOWN(recipient) AS known_name,
            recipient AS address,
            delegated_stake,
            own_stake,
            (delegated_stake + own_stake) total_stake,
            IS_GUARDIAN_AT_BLOCK(recipient, BLOCKNUMBER()) is_guardian
    FROM
        (SELECT 
        recipient,
            SUM(stake) delegated_stake,
            GET_STAKE_AT_BLOCK(recipient, BLOCKNUMBER()) own_stake
    FROM
        (SELECT 
        source,
            recipient,
            GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
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
                delegates) UNION ALL SELECT 
        source,
            recipient,
            GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
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
                    GROUP BY source))) dlgt_same_most_recent
    GROUP BY recipient) agg UNION SELECT 
        KNOWN(address) AS known_name,
            address AS address,
            0 AS delegated_stake,
            GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) AS own_stake,
            GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) AS total_stake,
            1 AS is_guardian
    FROM
        computed_guardians_at_block) with_non_delegated_guardians
GROUP BY address
ORDER BY total_stake DESC;