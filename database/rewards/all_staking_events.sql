create definer = orbs@`%` view all_staking_events as
select stakeOwner,
       eventAmount,
       totalAmount,
       transactionIndex,
       transactionHash,
       block,
       blockTime,
       'staked'                                           AS `eventName`
from staked_events
UNION ALL
select stakeOwner,
       eventAmount,
       totalAmount,
       transactionIndex,
       transactionHash,
       block,
       blockTime,
       'unstaked'                                           AS `eventName`
from unstaked_events
UNION ALL
select stakeOwner,
       eventAmount,
       totalAmount,
       transactionIndex,
       transactionHash,
       block,
       blockTime,
       'restaked'                                           AS `eventName`
from restaked_events
UNION ALL
select stakeOwner,
       eventAmount,
       totalAmount,
       transactionIndex,
       transactionHash,
       block,
       blockTime,
       'withdrew'                                           AS `eventName`
from withdrew_events;
