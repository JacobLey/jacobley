#!/bin/bash
set -e

echo "::set-output name=multiline::true"
echo "::set-output name=with-json::\"{\"x:\":[\"yz\"]}\""
