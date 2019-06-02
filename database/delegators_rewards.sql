USE `orbs_token`;
CREATE  OR REPLACE VIEW `delegators_rewards` AS
-- returns the delegates rewards as a specific block number - which should an elections block number 
-- this is just the delegates part on a **specific** block, not the accumulated reward
SELECT 
    source AS address,
    KNOWN(source) AS known,
    GET_REGION(source) AS region,
    IN_ORBS(stake) AS stake,
    type,
    IN_ORBS(delegators_reward) AS delegators_reward
FROM
    (SELECT 
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
                address
            FROM
                computed_guardians_at_block
            WHERE
                address IN (SELECT 
                        gv.address
                    FROM
                        guardians_votes gv
                    WHERE
                        block > CAST(BLOCKNUMBER() - VOTE_VALID_BLOCKS() AS UNSIGNED)
                            AND block <= BLOCKNUMBER())) UNION ALL SELECT 
        source,
            recipient,
            GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
            block,
            'delegate' type,
            GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS delegators_reward
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
                address
            FROM
                computed_guardians_at_block
            WHERE
                address IN (SELECT 
                        gv.address
                    FROM
                        guardians_votes gv
                    WHERE
                        block > CAST(BLOCKNUMBER() - VOTE_VALID_BLOCKS() AS UNSIGNED)
                            AND block <= BLOCKNUMBER())) UNION ALL SELECT 
        address AS source,
            address AS recipient,
            GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) stake,
            block,
            'guardian' type,
            GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS delegators_reward
    FROM
        computed_guardians_at_block
    WHERE
        address IN (SELECT 
                gv.address
            FROM
                guardians_votes gv
            WHERE
                block > CAST(BLOCKNUMBER() - VOTE_VALID_BLOCKS() AS UNSIGNED)
                    AND block <= BLOCKNUMBER())) main_agg;