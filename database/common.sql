use orbs_token;

truncate table transfers
select * from transfers limit 1

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


/* time format */
select FROM_UNIXTIME(blocktime, '%Y-%m-%dT%TZ') from transfers



/* load data - transfers */
LOAD DATA FROM S3 's3://import-rds/transfers_7669000_f.csv'
INTO TABLE transfers
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(source,recipient,amount,transactionIndex,transactionHash,block,blockTime)

/* load data - delegates */
LOAD DATA FROM S3 's3://import-rds/delegates_7669000.csv'
INTO TABLE delegates
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(source,recipient,transactionIndex,transactionHash,block,blockTime)

/* load data - known addresses */
LOAD DATA FROM S3 's3://import-rds/known-addresses-20190502.csv'
INTO TABLE known_addresses
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(address,name,tde_funds,region)

