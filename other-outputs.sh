#!/bin/bash
set -e

::set-output name=multiline-2::true
::set-output name=with-json-2::\"{\"x:\":[\"yz\"]}\"
