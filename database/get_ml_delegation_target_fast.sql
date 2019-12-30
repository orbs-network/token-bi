USE `orbs_token`;
DROP function IF EXISTS `get_ml_delegation_target_fast`;

DELIMITER $$
USE `orbs_token`$$
CREATE DEFINER=`orbs`@`%` FUNCTION `get_ml_delegation_target_fast`(input_address CHAR(42)) RETURNS char(42) CHARSET latin1
BEGIN
	DECLARE next_target char(42) DEFAULT input_address;
	DECLARE current_target char(42) DEFAULT input_address;
	DECLARE depth_limit INT DEFAULT 10;
	DECLARE current_depth INT DEFAULT 0;

	WHILE next_target <> "" DO
		-- loops
		IF current_depth = depth_limit THEN
			RETURN "";
		END IF;

		SET current_target := next_target;
		SELECT get_delegation_target(current_target, @blocknumber) INTO next_target;
		-- self delegation?
		IF next_target = current_target THEN
			RETURN current_target;
		END IF;
		
		SET current_depth := current_depth + 1;
	END WHILE;
	
	RETURN current_target;
END$$

DELIMITER ;

