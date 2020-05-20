#!/bin/bash

aws s3 cp ./outputs/staked-$1-$2.csv s3://import-rds/uploads/$1-$2/staked-$1-$2.csv --profile $3
aws s3 cp ./outputs/unstaked-$1-$2.csv s3://import-rds/uploads/$1-$2/unstaked-$1-$2.csv --profile $3
aws s3 cp ./outputs/restaked-$1-$2.csv s3://import-rds/uploads/$1-$2/restaked-$1-$2.csv --profile $3
aws s3 cp ./outputs/withdrew-$1-$2.csv s3://import-rds/uploads/$1-$2/withdrew-$1-$2.csv --profile $3
