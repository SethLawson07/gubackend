#!/bin/bash

npm install

tsc

npx prisma generate

npx prisma db push

echo "Build successful"
