#!/bin/bash
#

UNTRACKED=`git status | grep Untracked`
if [ "$UNTRACKED!" != "!" ] ; then
  echo "Repository is not committed."
  exit 1
fi

CHANGES=`git status | grep Changes`
if [ "$CHANGES!" != "!" ] ; then
  echo "Repository is not committed."
  exit 1
fi

VERSIONS=`git tag | grep "^[0-9]"`
VERSION=`echo "$VERSIONS" | perl -Mversion -lane 'print join " ", sort { version->parse($a) cmp version->parse($b) } @F'  2>/dev/null | tail -1`

echo $VERSION

rm -rf dist 2>/dev/null
yarn build || exit 1
mv dist sensetif
tar cf sensetif_$VERSION.tar.gz sensetif
scp sensetif_$VERSION.tar.gz root@repo.sensetif.com:/var/www/repository/grafana-plugins/sensetif/
rm -rf sensetif sensetif_$VERSION.tar.gz