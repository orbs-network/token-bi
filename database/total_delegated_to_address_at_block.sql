CREATE  OR REPLACE VIEW total_delegated_to_address_at_block as
SELECT 
    address,
    get_delegation_target(address, BLOCKNUMBER()) AS delegated_to,
    in_orbs(MAX(delegated_stake)) AS total_delegated,
    in_orbs(own_stake) AS own_stake,
    in_orbs(total_stake) AS total_stake,
    is_guardian
FROM
    (SELECT 
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
                            AND recipient = ADDRESS()
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
                                    AND recipient = ADDRESS()
                            GROUP BY source) b ON a.source = b.source
                                AND a.block = b.block
                            WHERE
                                a.amount = 70000000000000000
                                AND a.block <= BLOCKNUMBER()
                                AND a.recipient = ADDRESS()) trnsfr_same_most_recent_transfers
                          GROUP BY source))
                    AND source NOT IN (SELECT 
                            source
                        FROM
                            delegates
                        WHERE
                            block <= BLOCKNUMBER()) 
            UNION ALL SELECT 
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
                        AND recipient = ADDRESS()
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
                                AND recipient = ADDRESS()
                            GROUP BY source) b ON a.source = b.source
                                AND a.block = b.block
                            WHERE
                                a.block <= BLOCKNUMBER()
                                AND a.recipient = ADDRESS()) zz
                            GROUP BY source))) dlgt_same_most_recent
        GROUP BY recipient) agg) with_total_stake
GROUP BY address
ORDER BY total_stake DESC;