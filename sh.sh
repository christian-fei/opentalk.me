#!/bin/bash
rm -rf .demeteorized
demeteorizer
cd .demeteorized
export ROOT_URL=http://opentalk.me:3000
export PORT=3000
export MONGO_URL=mongodb://localhost:27017/opentalk
npm install
