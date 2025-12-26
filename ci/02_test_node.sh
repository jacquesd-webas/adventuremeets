#!bin/sh

# This script will run tests against node projects specified either via
# command line arguments or via environment variable NODE_PROJECTS
# NODE_PROJECTS may be set in ci/config.sh, but can be overridden
# with args
#
# usage:
#   ci/02_test_node.sh api common
#   NODE_PROJECTS="api common" ci/02_test_node.sh

source $(dirname $0)/config.sh
source $(dirname $0)/utils.sh

NODE_PROJECTS_ARGS=$@

if [ ! -z "$NODE_PROJECTS_ARGS" ]; then
    echo "NODE_PROJECTS set via args [$NODE_PROJECTS_ARGS]"
    NODE_PROJECTS=$NODE_PROJECTS_ARGS
elif [ ! -z "$NODE_PROJECTS" ]; then
    echo "NODE_PROJECTS set via environment [$NODE_PROJECTS]"
else
    echo "NODE_PROJECTS is not set and no args provided"
    echo "Nothing to test"
    exit 0
fi

for DIR in $NODE_PROJECTS; do
    echo "Testing $DIR..."
    cd $DIR
    NPM=$(get_package_manaher)
    $NPM test
    cd $OLDPWD
done