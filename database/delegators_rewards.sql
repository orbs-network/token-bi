USE `orbs_token`;
CREATE  OR REPLACE VIEW `delegators_rewards` AS
    SELECT 
        source,
        recipient,
        GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
        block,
        'transfer' type,
        GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS delegators_reward
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
                delegates)
            AND recipient IN (SELECT 
                gv.address
            FROM
                guardians_votes gv
            WHERE
                block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                    AND block <= BLOCKNUMBER()) 
    UNION ALL SELECT 
        source,
        recipient,
        GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
        block,
        'delegate' type,
        GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS reward
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
            AND recipient IN (SELECT 
                gv.address
            FROM
                guardians_votes gv
            WHERE
                block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                    AND block <= BLOCKNUMBER()) 
    UNION ALL SELECT 
        address,
        address,
        GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) stake,
        block,
        'guardian' type,
        GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS reward
    FROM
        computed_guardians_at_block
    WHERE
        address IN (SELECT 
                gv.address
            FROM
                guardians_votes gv
            WHERE
                block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                    AND block <= BLOCKNUMBER());