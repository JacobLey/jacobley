#!/bin/bash
set -e

echo "::set-output name=multiline-3::true\n::set-output name=with-json-3::\"{\"x:\":[\"yz\"]}\""
