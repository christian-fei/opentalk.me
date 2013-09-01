#!/bin/sh

if [ $(ps aux | grep $USER | grep node | grep -v grep | wc -l | tr -s "\n") -eq 0 ]
then
        export PATH=/usr/local/bin:$PATH

        sudo ROOT_URL=http://opentalk.me:3000 PORT=3000 MONGO_URL=mongodb://localhost:27017/opentalk forever start /root/nodestuff/opentalk.me/.demeteorized/main.js  >> /root/nodestuff/opentalk.me/log.txt 2>&1
fi
