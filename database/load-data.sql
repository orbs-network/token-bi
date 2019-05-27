
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

/* load data - guardians register events */
LOAD DATA FROM S3 's3://import-rds/guardian_register.csv'
INTO TABLE guardians_register
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(address,transactionIndex,transactionHash,block,blockTime)

/* load data - guardians leave events */
LOAD DATA FROM S3 's3://import-rds/guardian_leave.csv'
INTO TABLE guardians_leave
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(address,transactionIndex,transactionHash,block,blockTime)

/* load data - voting data */
LOAD DATA FROM S3 's3://import-rds/votes-7828900.csv'
INTO TABLE guardians_votes
FIELDS TERMINATED BY ';'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(counter,address,validators,transactionIndex,transactionHash,block,blockTime)
