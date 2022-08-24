#!/usr/bin/env bash

npx wait-on http://checkmk:5000 && cypress run
