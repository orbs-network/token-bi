select sum(stake) from (
select source, recipient, get_stake(source) stake from delegates where id in (
select id from 
(select id, source, max(block) from delegates
group by source) most_recent
) 
and recipient  = "0xf7ae622c77d0580f02bcb2f92380d61e3f6e466c"
) x

guardians - by dele
5452279280976977435000000
72555664983699092059000859

select sum(stake) from (
select source, recipient, get_stake(source) stake from transfers t where id in (
select id from 
(select id, source, max(block) from transfers
where amount = 70000000000000000
group by source) most_recent_t_id
) 
and recipient  = "0xf7ae622c77d0580f02bcb2f92380d61e3f6e466c"
and source not in (select source from delegates where id in (
select id from 
(select id, source, max(block) from delegates
group by source) most_recent
) 
)
) z