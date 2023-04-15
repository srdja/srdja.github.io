#!/bin/bash

IP=45.63.10.99

rm _site/deploy.sh
rm _site/CNAME
rm _site/LICENSE.md
rm _site/Capfile


echo "Removing old site..."
ssh -p 41214 -tq dep@$IP "rm -rf /blog/current/*"

echo "Deploying update..."
scp -P 41214 -r _site/* dep@$IP:/home/dep/blog/current
