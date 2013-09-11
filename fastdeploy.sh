#!/bin/bash
git checkout .
git pull
rm -rf .demeteorized
demeteorizer
cd .demeteorized
npm install
sudo ROOT_URL=http://opentalk.me:3000 PORT=3000 MONGO_URL=mongodb://localhost:27017/opentalk forever start /root/nodestuff/opentalk.me/.demeteorized/main.js  >> /root/nodestuff/opentalk.me/log.txt 2>&1