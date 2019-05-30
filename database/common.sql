use orbs_token;

-- truncate table transfers
-- select * from transfers limit 1

/* popular addresses */
select source, count(*) from transfers 
group by source 
having count(*)>100
order by 2 desc 

/* popular addresses with known names */
select known(source), count(*) from transfers 
group by source 
having count(*)>100
order by 2 desc 

/* where did X tokens went to? (one level) */ 
select * from transfers
where source in (
select recipient from transfers
where source = "0x91a5f8b4c0245ebf816e87e292976aa555a7460d")

/* STAKE, also available as a function 'get_stake(address)' */
select r.received-s.sent from
(select COALESCE(sum(amount), 0) sent from transfers
where source = "0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d") s,
(select COALESCE(sum(amount), 0) received from transfers
where recipient = "0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d") r

/* stake holders */
select get_stake(address) stake, address from (
select source address from transfers union select recipient from transfers) addresses
having stake > 0

/* amount of stake holders */
select count(*) from (
select get_stake(source) stake, source from transfers
group by source
having stake > 0) stake_holders

/* delegate by transfer */
select * from transfers
where amount = 70000000000000000

/* delegate by transfer - actual/most recent per delegator */
SELECT a.*
FROM transfers a
INNER JOIN (
	SELECT source, MAX(block) block
	FROM transfers
	WHERE amount = 70000000000000000
	GROUP BY source
) b ON a.source = b.source AND a.block = b.block
WHERE (a.source,transactionIndex) IN (
	SELECT source, max(transactionIndex) FROM (
		SELECT aa.source, aa.transactionIndex
		FROM transfers aa
		INNER JOIN (
			SELECT source, MAX(block) block
			FROM transfers
			WHERE amount = 70000000000000000
			GROUP BY source
		) bb ON aa.source = bb.source AND aa.block = bb.block
		)txIdxOrder
	group by source)


/* most delegated to */
select recipient, count(*) from transfers
where amount = 70000000000000000
group by recipient
order by 2 desc

/* delegated more than once (by transfer) */
select source, count(*) from transfers
where amount = 70000000000000000
group by source
having count(*) > 1
order by 2 desc

/* delegate by delegate, most recent */
SELECT a.*
FROM delegates a
INNER JOIN (
	SELECT source, MAX(block) block
	FROM delegates
	GROUP BY source
) b ON a.source = b.source AND a.block = b.block
WHERE (a.source,transactionindex) IN (
	SELECT source, max(transactionIndex) FROM (
		SELECT aa.source, aa.transactionIndex
		FROM delegates aa
		INNER JOIN (
			SELECT source, MAX(block) block
			FROM delegates
			GROUP BY source
		) bb ON aa.source = bb.source AND aa.block = bb.block
		)txIdxOrder
	group by source)

/* delegated by both transfer and delegate */
SELECT * FROM transfers
WHERE amount = 70000000000000000
AND source IN (SELECT source FROM delegates)
GROUP BY source

/* addresses who delegated by transfar ***AFTER*** delegating by delegate */
SELECT * FROM
    (SELECT 
        t.source,
		GET_STAKE(t.source) stake,
		t.recipient trnfD,
		d.recipient deleD,
		MAX(t.block) tb,
		MAX(d.block) db
    FROM transfers t
    LEFT JOIN delegates d ON t.source = d.source
    WHERE t.amount = 70000000000000000
	AND t.source IN 
		(SELECT source FROM delegates
		WHERE id IN 
			(SELECT a.id
				FROM delegates a
				INNER JOIN (
					SELECT source, MAX(block) block
					FROM delegates
					GROUP BY source
				) b ON a.source = b.source AND a.block = b.block
				WHERE (a.source,transactionindex) IN (
					SELECT source, max(transactionIndex) FROM (
						SELECT aa.source, aa.transactionIndex
						FROM delegates aa
						INNER JOIN (
							SELECT source, MAX(block) block
							FROM delegates
							GROUP BY source
						) bb ON aa.source = bb.source AND aa.block = bb.block
						)txIdxOrder
					GROUP BY source)
				) 
			)
	GROUP BY t.source) z
WHERE tb > db 
/* add the below to get invalid states - where the transfer and delegate addresses are different */
AND trnfD != deleD

/* get the delegated values for each address (computed stake) - two stored prodecedures exists that does that 'at-block' 
   
   get_known_delegated_stake(123) (translate names)
   get_delegated_stake(123) (return addresses)
*/
-- outer select for total stake
SELECT 
    KNOWN(recipient),
    delegated_stake,
    own_stake,
    (delegated_stake + own_stake) total_stake
-- most recent transfers, without delegate
FROM (SELECT 
        recipient,
		SUM(stake) delegated_stake,
		GET_STAKE(recipient) own_stake
    FROM (SELECT 
			source,
            recipient,
            GET_STAKE(source) stake,
            block,
            'transfer' type
    FROM transfers t
    WHERE id IN (SELECT id FROM 
		(SELECT a.* FROM transfers a
		INNER JOIN (SELECT 
			source, MAX(block) block
			FROM transfers
			WHERE amount = 70000000000000000
			GROUP BY source) b ON a.source = b.source
			AND a.block = b.block) trnsfr_most_recent_transfers
		-- pick highest txnId in block if multiple txn in same block
		WHERE (source , transactionindex) IN (SELECT 
			source, MAX(transactionindex)
			FROM (SELECT a.*
				FROM transfers a
				INNER JOIN (SELECT 
					source, MAX(block) block
					FROM transfers
					WHERE amount = 70000000000000000
					GROUP BY source) b ON a.source = b.source
					AND a.block = b.block) trnsfr_same_most_recent_transfers
				GROUP BY source)
			)
            -- exculde transfers of people who delegate by delegate
            AND source NOT IN (SELECT source FROM delegates) 
	UNION ALL 
    -- merge with delegate by delegate
		SELECT 
			source,
			recipient,
			GET_STAKE(source) stake,
			block,
			'delegate' type
		FROM delegates
		WHERE id IN (SELECT 
			id
			FROM (SELECT a.* FROM delegates a
			INNER JOIN (SELECT 
				id, source, MAX(block) block FROM delegates
				GROUP BY source) b ON a.source = b.source
				AND a.block = b.block) dlgt_most_recent
			-- pick highest txnId in block if multiple txn in same block
			WHERE (source , transactionindex) IN (SELECT 
				source, MAX(transactionindex)
				FROM (SELECT a.* FROM delegates a
					INNER JOIN (SELECT 
						source, MAX(block) block
						FROM delegates
						GROUP BY source) b ON a.source = b.source
						AND a.block = b.block) zz
					GROUP BY source))) dlgt_same_most_recent
		GROUP BY recipient) agg
ORDER BY total_stake DESC


/* get raw delegation rows used to calculate the delegation state in the above / stored procedures. with block limit */
select source, stake, recipient, type, block from (
select source, recipient, get_stake_at_block(source, 7648900) stake, block, "transfer" type from transfers t 
where id in (
SELECT id FROM 
		(SELECT a.* FROM transfers a
		INNER JOIN (SELECT 
			source, MAX(block) block
			FROM transfers
			WHERE amount = 70000000000000000
            and block <= 7648900
			GROUP BY source) b ON a.source = b.source
			AND a.block = b.block) trnsfr_most_recent_transfers
		-- pick highest txnId in block if multiple txn in same block
		WHERE (source , transactionindex) IN (SELECT 
			source, MAX(transactionindex)
			FROM (SELECT a.*
				FROM transfers a
				INNER JOIN (SELECT 
					source, MAX(block) block
					FROM transfers
					WHERE amount = 70000000000000000
                    and block <= 7648900
					GROUP BY source) b ON a.source = b.source
					AND a.block = b.block) trnsfr_same_most_recent_transfers
				GROUP BY source)
			)
            -- exculde transfers of people who delegate by delegate
            AND source NOT IN (SELECT source FROM delegates) 
	UNION ALL 
    -- merge with delegate by delegate
		SELECT 
			source,
			recipient,
			GET_STAKE_AT_BLOCK(source, 7648900) stake,
			block,
			'delegate' type
		FROM delegates
		WHERE id IN (SELECT 
			id
			FROM (SELECT a.* FROM delegates a
			INNER JOIN (SELECT 
				id, source, MAX(block) block FROM delegates
				GROUP BY source) b ON a.source = b.source
				AND a.block = b.block) dlgt_most_recent
			-- pick highest txnId in block if multiple txn in same block
			WHERE (source , transactionindex) IN (SELECT 
				source, MAX(transactionindex)
				FROM (SELECT a.* FROM delegates a
					INNER JOIN (SELECT 
						source, MAX(block) block
						FROM delegates
                        where block <= 7648900
						GROUP BY source) b ON a.source = b.source
						AND a.block = b.block) zz
					GROUP BY source))
                    ) dlgt_same_most_recent
-- where dlgt_same_most_recent.recipient = "0xf7ae622c77d0580f02bcb2f92380d61e3f6e466c" -- optional, limit by delegate target
order by dlgt_same_most_recent.block


/* use the delegations view (can later continue aggregating the results) */
select d.* from (select @blockNumber:=7528900) param, delegations_at_block d

/* create a region pivoted view of stake holding */
set @blockNum := 7662975;
select 
	SUM(get_stake_at_block(source, @blockNum)) / 1000000000000000000 as total_stake, -- if the address did not exist at that block, the stake will be 0, which is okay for this summation (zero is neutral)
	SUM(get_stake_if_delegated_at_block(source, @blockNum)) / 1000000000000000000 as delegated_stake, -- if did not stake, returns zero (for summation)
    region, 
	count(source) as "number of addresses"
from (
	select source, 
    known(source), 
    known_from(source), 
    get_region(source) region 
    from (
		select source from transfers 
		union -- union will also run distinct for us
		select recipient from transfers
		)all_unique_addresses
	)formatted_region_data
group by region

/* transactions and volume by day */
SELECT 
    FROM_UNIXTIME(blocktime, '%Y-%m-%dT%TZ') date_time,
    COUNT(*) transaction_count,
    SUM(amount) / 1000000000000000000 volume
FROM
    transfers
GROUP BY blocktime DIV 86400

/* top 100 holders */
-- if this becomes slow, do the aggregation on distinct in each side (source/recipient) and then union
SELECT 
    GET_STAKE_AT_BLOCK(source, 7668900) stake,
    KNOWN(source) name,
    source
FROM
    (SELECT source FROM transfers 
    UNION 
    SELECT recipient FROM transfers) all_unique_addresses
WHERE KNOWN(source) NOT LIKE '%orbs wallet%'
AND KNOWN(source) NOT LIKE '%exchange%'
GROUP BY source
ORDER BY stake DESC
LIMIT 100

/* top 100 holders **who delegated** */
SET @blocknumber := 7668900;
SELECT 
    KNOWN(source) name,
    source,
    GET_STAKE_AT_BLOCK(source, @blocknumber) stake
FROM
    (SELECT 
        source
    FROM
        transfers UNION SELECT 
        recipient
    FROM
        transfers) all_unique_addresses
WHERE
    KNOWN(source) NOT LIKE '%orbs wallet%'
        AND KNOWN(source) NOT LIKE '%exchange%'
        AND (source IN (SELECT 
            source
        FROM
            delegates
        WHERE
            block <= @blocknumber UNION SELECT 
            source
        FROM
            transfers
        WHERE
            amount = 70000000000000000
                AND block <= @blocknumber)
        OR source IN (SELECT 
            address
        FROM
            computed_guardians_at_block))
GROUP BY source
ORDER BY stake DESC
LIMIT 100

/* andrey's table */
set @blocknumber := 7777677;
select 
    source as address, 
	known(source) as known_name, 
	get_region(source) as region,
    known_from(source) as transfer_from,
    get_stake_at_block(source, @blocknumber) as stake,
    is_delegating_at_block(source, @blocknumber) as delegating,
    is_guardian_at_block(source, @blocknumber) as guardian 

    from (
		select source from transfers 
		union -- union will also run distinct for us
		select recipient from transfers
		)all_unique_addresses


/* get the guardians who votes with their stake */
select d.known_name, d.address, d.total_stake from (select @blockNumber:=7528900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
)

/* get the guardians who voted with their voting power (without a window function) */
select @all_stake := sum(total_stake) from (select @blockNumber:=7828900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
);
select d.known_name, d.address, in_orbs(d.total_stake) as orbs_total_stake, d.total_stake / @all_stake as voting_power from (select @blockNumber:=7828900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
)

/* reward for top10 guardian */
-- cap at 10% or 40M annual (per election)
select @all_stake := sum(total_stake) from (select @blockNumber:=7828900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
);
select @top10_total_stake := sum(total_stake) from (
select d.known_name, 
d.address, 
d.total_stake
from (select @blockNumber:=7828900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
)
order by d.total_stake desc
limit 10)top10;
select @pool_size := guardian_reward_pool(blocknumber());
select known_name, 
address, 
orbs_total_stake, 
voting_power, 
top10_power, 
@pool_size * top10_power as reward
from
(select d.known_name, 
d.address, 
in_orbs(d.total_stake) as orbs_total_stake, 
d.total_stake / @all_stake as voting_power,
d.total_stake / @top10_total_stake as top10_power
-- in_orbs(d.total_stake * 0.1 / 117.23) as reward -- uncomment this for control (direct calc without 40M cap)
from (select @blockNumber:=7828900) param, delegations_at_block d
where d.is_guardian = 1
and d.address in (
select gv.address from guardians_votes gv
where block >= blocknumber() - 45000 and block <= blocknumber()
)
order by d.total_stake desc
limit 10)x;

/* get rewards for valid delegators */
-- delegates - get a list of guardians who voted, then get everyone who voted for them, show stake (no grouping), show reward
-- reward is 0.08 / 117.23 => 0.000682 per election according to the stake at that election
select @blockNumber:=7828900;
SELECT 
    source,
    recipient,
    GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) stake,
    block,
    'transfer' type,
    GET_STAKE_AT_BLOCK(source, BLOCKNUMBER()) * 0.08 / NUMBER_OF_PERIODS() AS reward
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
                AND block <= BLOCKNUMBER())

/* validators rewards */
-- validator rewards - stake_at_block * (0.04 / 117.23) = 0.0003412... (not natural) + 1M/117.23 (8530.2396... not natural again)
set @blocknumber := 7828900;
SELECT
name,
address,
in_orbs(stake),
in_orbs(stake_reward),
million_reward_in_orbs,
in_orbs(stake_reward) + million_reward_in_orbs AS total_reward
from(
SELECT 
    KNOWN(address) AS name,
    address,
    GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) AS stake,
    GET_STAKE_AT_BLOCK(address, BLOCKNUMBER()) * 0.04 / NUMBER_OF_PERIODS() AS stake_reward,
    1000000 / NUMBER_OF_PERIODS() AS million_reward_in_orbs
FROM
    validators
WHERE
    COALESCE(validUntilBlock, POW(2, 64) - 1) > BLOCKNUMBER()
)x


/* time format */
select FROM_UNIXTIME(blocktime, '%Y-%m-%dT%TZ') from transfers



