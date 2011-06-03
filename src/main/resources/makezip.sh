#!/bin/bash

set -e
folder=$(basename $PWD)
cd ..
rm -f "$folder.zip"
export ZIPOPT="-D"

zip -r $folder.zip $folder \
    -x $folder/.\* \
    -x $folder/$(basename $0) \
    -x $folder/_locales/\* \
    -x $folder/README

# Removing comments from messages.json for each locale
rm -fr /tmp/$folder
for loc in en fr ru ko
do
    dir=$folder/_locales/$loc
    file=$dir/messages.json
    mkdir -p /tmp/$dir
    egrep -v "^[[:space:]]*(//|$)" $file >/tmp/$file
done
(cd /tmp; zip -ru ~-/"$folder.zip" $folder)
rm -fr /tmp/$folder

