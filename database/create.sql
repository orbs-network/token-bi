CREATE TABLE transfers (
	id BIGINT NOT NULL AUTO_INCREMENT,
	source CHAR(42) NOT NULL,
	recipient CHAR(42) NOT NULL,
	amount DECIMAL(29,0) NOT NULL,
	transactionIndex INT NOT NULL,
	transactionHash CHAR(66) NOT NULL,
	block BIGINT NOT NULL,
	blockTime BIGINT NOT NULL,
	PRIMARY KEY (id),
	KEY `ix_source` (`source`),
    KEY `ix_recipient` (`recipient`)
    KEY `ix_amount_source` (`amount`,`source`)
)

CREATE TABLE delegates (
	id BIGINT NOT NULL AUTO_INCREMENT,
	source CHAR(42) NOT NULL,
	recipient CHAR(42) NOT NULL,
	transactionIndex INT NOT NULL,
	transactionHash CHAR(66) NOT NULL,
	block BIGINT NOT NULL,
	blockTime BIGINT NOT NULL,
	PRIMARY KEY (id),
	KEY `ix_source` (`source`),
    KEY `ix_recipient` (`recipient`)
)

create table known_addresses(
	ID INT NOT NULL AUTO_INCREMENT,
	address CHAR(42) NOT NULL,
	name VARCHAR(100) NOT NULL,
	tde_funds DECIMAL(29,0) NOT NULL,
	region VARCHAR(50) NOT NULL,
	PRIMARY KEY (id),
	KEY `ix_address` (`address`),
    KEY `ix_name` (`name`),
    KEY `ix_region` (`region`)
)

create table guardians_register(
	id BIGINT NOT NULL AUTO_INCREMENT,
	address CHAR(42) NOT NULL,
	transactionIndex INT NOT NULL,
	transactionHash CHAR(66) NOT NULL,
	block BIGINT NOT NULL,
	blockTime BIGINT NOT NULL,
	PRIMARY KEY (id),
	KEY `ix_address` (`address`),
	KEY `ix_block` (`block`)
)

create table guardians_leave(
	id BIGINT NOT NULL AUTO_INCREMENT,
	address CHAR(42) NOT NULL,
	transactionIndex INT NOT NULL,
	transactionHash CHAR(66) NOT NULL,
	block BIGINT NOT NULL,
	blockTime BIGINT NOT NULL,
	PRIMARY KEY (id),
	KEY `ix_address` (`address`),
	KEY `ix_block` (`block`)
)