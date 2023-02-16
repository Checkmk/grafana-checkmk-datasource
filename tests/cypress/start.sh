#!/usr/bin/env bash

npx wait-on -l http://checkmk:5000 && python3 -u /cypress/wait-for-agent.py && cypress run
