#!/bin/bash

aws s3 cp ./outputs/transfers-$1-$2.csv s3://import-rds/uploads/$1-$2/transfers-$1-$2.csv --profile $3
aws s3 cp ./outputs/delegates-$1-$2.csv s3://import-rds/uploads/$1-$2/delegates-$1-$2.csv --profile $3
aws s3 cp ./outputs/votes-$1-$2.csv s3://import-rds/uploads/$1-$2/votes-$1-$2.csv --profile $3
aws s3 cp ./outputs/guardian_register-$1-$2.csv s3://import-rds/uploads/$1-$2/guardian_register-$1-$2.csv --profile $3
aws s3 cp ./outputs/guardian_leave-$1-$2.csv s3://import-rds/uploads/$1-$2/guardian_leave-$1-$2.csv --profile $3