use orbs_token;

truncate table transfers
select * from transfers limit 1

/* popular addresses */
select source, count(*) from transfers 
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
select * from transfers where id in (
select id from 
(select id, source, max(block) from transfers
where amount = 70000000000000000
group by source) most_recent
) order by block

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
select * from delegates where id in (
select id from 
(select id, source, max(block) from delegates
group by source) most_recent
) order by block

/* delegated by both transfer and delegate */
select * from transfers
where amount = 70000000000000000
and source in (select source from delegates where id in (
select id from 
(select id, source, max(block) from delegates
group by source) most_recent
) order by block)

/* addresses who delegated by transfar ***AFTER*** delegating by delegate */
select * from (
select t.source, get_stake(t.source), t.recipient trnfD, d.recipient deleD, max(t.block) tb, max(d.block) db from transfers t 
left outer join delegates d on t.source = d.source 
where t.amount = 70000000000000000
and t.source in (select source from delegates where id in (
select id from 
(select id, source, max(block) from delegates
group by source) most_recent
) order by block) 
group by t.source) z
where tb > db
/* add the below to get invalid states - where the transfer and delegate addresses are different */
and trnfD != deleD



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
