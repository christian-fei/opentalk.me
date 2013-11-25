#!/bin/bash

if curl --output /dev/null -sI "http://athmosphere.meteor.com/"; then
	echo '====athmosphere is up===='
	echo '====stopping opentalk.me===='
	forever stop /root/nodestuff/opentalk.me/.demeteorized/main.js
	echo '====checking out===='
	git checkout .
	echo '====pulling latest changes===='
	git pull
	echo '====removing .demeteorized===='
	rm -rf .demeteorized
	echo '====demeteorizing===='
	demeteorizer
	echo '====cd .demeteorized===='
#	cp .package.json .demeteorized/package.json
	cd .demeteorized
	echo '====npm install===='
	npm install fibers@1.0.1
	npm install
	ROOT_URL=http://opentalk.me:3000 PORT=3000 MONGO_URL=mongodb://localhost:27017/opentalk forever start /root/nodestuff/opentalk.me/.demeteorized/main.js  >> /root/nodestuff/opentalk.me/log.txt 2>&1
	echo '====starting forever daemon===='
else
	echo '====athmosphere is down==== '
fi
