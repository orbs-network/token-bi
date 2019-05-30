USE `orbs_token`;
CREATE  OR REPLACE VIEW `guardians_rewards` AS
    SELECT 
        known_name,
        address,
        guardian_total_stake,
        guardian_total_stake / orbs_total_stake AS voting_power,
        guardian_total_stake / orbs_top10_total_stake AS top10_power,
        orbs_pool_size * guardian_total_stake / orbs_top10_total_stake AS top10_guardian_reward
    FROM
        (SELECT 
            IN_ORBS(SUM(total_stake)) AS orbs_total_stake
        FROM
            delegations_at_block d
        WHERE
            d.is_guardian = 1
                AND d.address IN (SELECT 
                    gv.address
                FROM
                    guardians_votes gv
                WHERE
                    block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                        AND block <= BLOCKNUMBER())) total_stake,
        (SELECT 
            IN_ORBS(SUM(total_stake)) AS orbs_top10_total_stake
        FROM
            (SELECT 
            d.known_name, d.address, d.total_stake
        FROM
            delegations_at_block d
        WHERE
            d.is_guardian = 1
                AND d.address IN (SELECT 
                    gv.address
                FROM
                    guardians_votes gv
                WHERE
                    block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                        AND block <= BLOCKNUMBER())
        ORDER BY d.total_stake DESC
        LIMIT 10) top10) top10_total_stake,
        (SELECT GUARDIAN_REWARD_POOL(BLOCKNUMBER()) AS orbs_pool_size) pool_size,
        (SELECT 
            d.known_name,
                d.address,
                IN_ORBS(d.total_stake) AS guardian_total_stake
        FROM
            delegations_at_block d
        WHERE
            d.is_guardian = 1
                AND d.address IN (SELECT 
                    gv.address
                FROM
                    guardians_votes gv
                WHERE
                    block >= BLOCKNUMBER() - VOTE_VALID_BLOCKS()
                        AND block <= BLOCKNUMBER())
        ORDER BY d.total_stake DESC
        LIMIT 10) guardian_data;;
