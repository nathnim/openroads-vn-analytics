#!/usr/bin/env bash

# create then source a virtual environemnt

echo "---Setting up python environment for transifex client---"

pip install virtualenv
virtualenv ~/env
source ~/env/bin/activate

# download transifex client
echo ""
echo "---Downloading Transifex Client\n---"

pip install transifex-client

# generate .transifexrc
echo ""
echo "---Linking repo with Transifex Project---"

echo $'[https://www.transifex.com]\nhostname = https://www.transifex.com\nusername = '"$TRANSIFEX_USER"$'\npassword = '"$TRANSIFEX_PASSWORD"$'\ntoken = \n' > ~/.transifexrc

echo "repo linked to project!"

# push any new changes from translation source
echo ""
echo "---Pushing any changes to translation source file---"

tx push -s

# map most recent translations from transifex to translation files
echo ""
echo "---Pulling any new translations from into project---"

tx pull
