
create
    definer = orbs@`%` function get_stake_at_block(address char(42), blockNumber bigint) returns decimal(29)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;

IF address = "0x0000000000000000000000000000000000000000" THEN
    SELECT 0 INTO stake;
ELSE
    SELECT
        (r.received - s.sent - MOD(r.received - s.sent, 1000000000000000000)) + get_contract_stake_at_block(address, blockNumber)
    INTO stake FROM
        (SELECT
            COALESCE(SUM(amount), 0) sent
        FROM
            transfers
        WHERE
            source = address
                AND block <= blockNumber) s,
        (SELECT
            COALESCE(SUM(amount), 0) received
        FROM
            transfers
        WHERE
            recipient = address
                AND block <= blockNumber) r;
END IF;
RETURN stake;
END;

