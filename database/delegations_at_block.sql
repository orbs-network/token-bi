
CREATE  OR REPLACE VIEW delegations_at_block as
SELECT 
	known(address),
	address,
	SUM(total_delegated) as total_delegated,
	SUM(own_stake) as own_stake,
	SUM(total_stake) as total_stake,
	MAX(is_guardian) as is_guardian,
	MAX(voted) as voted
FROM (
	SELECT 
		known_name,
		GET_ML_DELEGATION_TARGET(address) as address,
		GET_ML_DELEGATION_VALUE(address) as total_delegated,
		0 as own_stake,
		GET_ML_DELEGATION_VALUE(address) as total_stake,
		0 as is_guardian,
		0 as voted
	FROM (
		SELECT 
		    *
		FROM
		    raw_delegations_at_block
		WHERE
			is_guardian = 0
			)multi_level_additions
	UNION ALL
		SELECT * FROM raw_delegations_at_block
	)after_union
GROUP BY address
ORDER BY total_stake DESC