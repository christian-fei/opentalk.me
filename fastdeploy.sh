#!/bin/bash

if curl --output /dev/null -sI "http://athmosphere.meteor.com/"; then
	echo '====athmosphere is up===='
	echo '====checking out===='
	git checkout .
	echo '====pulling latest changes===='
	git pull
	echo '====removing .demeteorized===='
	rm -rf .demeteorized
	echo '====demeteorizing===='
	demeteorizer
	echo '====cd .demeteorized===='
	cd .demeteorized
	echo '====npm install===='
	npm install
	echo '====starting forever daemon===='
	ROOT_URL=http://opentalk.me:3000 PORT=3000 MONGO_URL=mongodb://localhost:27017/opentalk forever restart /root/nodestuff/opentalk.me/.demeteorized/main.js  >> /root/nodestuff/opentalk.me/log.txt 2>&1
else
	echo '====athmosphere is down==== '
fi