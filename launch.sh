#!/bin/bash


npx prisma generate

npx prisma db push

node dist/server.js
