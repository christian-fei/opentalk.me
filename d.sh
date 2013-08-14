#!/bin/sh
echo "removing .demeteorized"
rm -rf .demeteorized
echo "compiling styles"
compass compile
echo "demeteorization in progress..."
demeteorizer
cp .package.json .demeteorized/package.json
cd .demeteorized
npm install && jitsu deploy