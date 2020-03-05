#!/bin/bash

aws s3 cp transfers-$1-$2.csv s3://import-rds/transfers-$1-$2.csv --profile $3
aws s3 cp delegates-$1-$2.csv s3://import-rds/delegates-$1-$2.csv --profile $3
aws s3 cp votes-$1-$2.csv s3://import-rds/votes-$1-$2.csv --profile $3
aws s3 cp guardian_register-$1-$2.csv s3://import-rds/guardian_register-$1-$2.csv --profile $3
