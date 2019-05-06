
USE `orbs_token`;
DROP procedure IF EXISTS `orbs_token`.`get_known_delegated_stake`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` PROCEDURE `get_known_delegated_stake`(blockNumber BIGINT)
BEGIN
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
		GET_STAKE_AT_BLOCK(recipient, blockNumber) own_stake
    FROM (SELECT 
			source,
            recipient,
            GET_STAKE_AT_BLOCK(source, blockNumber) stake,
            block,
            'transfer' type
    FROM transfers t
    WHERE id IN (SELECT id FROM 
		(SELECT a.* FROM transfers a
		INNER JOIN (SELECT 
			source, MAX(block) block
			FROM transfers
			WHERE amount = 70000000000000000
            AND block <= blockNumber
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
                    AND block <= blockNumber
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
			GET_STAKE_AT_BLOCK(source, blockNumber) stake,
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
                        WHERE block <= blockNumber
						GROUP BY source) b ON a.source = b.source
						AND a.block = b.block) zz
					GROUP BY source))) dlgt_same_most_recent
		GROUP BY recipient) agg
ORDER BY total_stake DESC;
END$$

DELIMITER ;
;
