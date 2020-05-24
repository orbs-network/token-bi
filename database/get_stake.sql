-- Calculates the total stake (contract and balance tokens) of the given address

create
    definer = orbs@`%` function get_stake(address char(42)) returns decimal(29)
BEGIN
DECLARE stake DECIMAL(29,0) DEFAULT 0;

IF address = "0x0000000000000000000000000000000000000000" THEN
    SELECT 0 INTO stake;
ELSE
    SELECT
        (r.received - s.sent) + get_contract_stake(address)
    INTO stake FROM
        (SELECT
            COALESCE(SUM(amount), 0) sent
        FROM
            transfers
        WHERE
            source = address) s,
        (SELECT
            COALESCE(SUM(amount), 0) received
        FROM
            transfers
        WHERE
            recipient = address) r;
END IF;
RETURN stake;
END;

