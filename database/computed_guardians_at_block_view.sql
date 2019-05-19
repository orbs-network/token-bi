CREATE VIEW `computed_guardians_at_block` AS
    SELECT 
        *
    FROM
        (SELECT 
            a.*
        FROM
            guardians_register a
        INNER JOIN (SELECT 
            id, address, MAX(block) block
        FROM
            guardians_register
        GROUP BY address) b ON a.address = b.address
            AND a.address = b.address) guardians_most_recent_register
    WHERE
        block < BLOCKNUMBER() -- register happened
            AND address NOT IN (SELECT 
                a.address
            FROM
                guardians_leave a
                    INNER JOIN
                (SELECT 
                    id, address, MAX(block) block
                FROM
                    guardians_leave
                GROUP BY address) b ON a.address = b.address
                    AND a.address = b.address
                    AND a.block < BLOCKNUMBER()) -- laeve happened
