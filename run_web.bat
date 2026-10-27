@echo off
title Paracord Web Sanctuary
echo Starting Paracord Web Sanctuary on http://localhost:3000...
start "" "http://localhost:3000"
node "%~dp0server.js"
pause
