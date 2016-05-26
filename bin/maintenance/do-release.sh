#!/bin/bash

_get_version () {

	local year=`date +%Y`;
	local month=`date +%m`;
	local version="";

	if [ $month -gt "09" ]; then
		version="$year-Q4";
	elif [ $month -gt "06" ]; then
		version="$year-Q3";
	elif [ $month -gt "03" ]; then
		version="$year-Q2";
	else
		version="$year-Q1";
	fi;

	echo $version;

}

USER_WHO=`whoami`;
USER_LOG=`logname`;


LYCHEEJS_ROOT=$(cd "$(dirname "$0")/../../"; pwd);
LYCHEEJS_TEMP="/tmp/lycheejs";
LYCHEEJS_BRANCH=$(cd $LYCHEEJS_ROOT && git symbolic-ref HEAD 2>/dev/null);
OLD_VERSION=$(cd $LYCHEEJS_ROOT && cat ./libraries/lychee/source/core/lychee.js | grep VERSION | cut -d\" -f2);
NEW_VERSION=$(_get_version);


NPM_BIN=`which npm`;


if [ "$NPM_BIN" == "" ]; then
	echo "Install NPM first.";
	exit 1;
fi;


if [ "$USER_WHO" == "root" ]; then

	echo "You are root.";
	echo "Use \"$0\" without sudo.";

	exit 1;

elif [[ "$USER_WHO" == "root" && "$USER_LOG" == "root" ]]; then

	echo "You are root.";
	echo "Please exit su shell and use \"$0\" without sudo.";

	exit 1;

elif [ "$OLD_VERSION" != "$NEW_VERSION" ]; then

	echo "";
	echo "lychee.js Release Tool";
	echo "";
	echo "This tool will automatically create a lychee.js release";
	echo "";
	echo "lychee.js Location: $LYCHEEJS_TEMP";
	echo "lychee.js Branch: $LYCHEEJS_BRANCH";
	echo "";
	echo "Old lychee.js version: $OLD_VERSION";
	echo "New lychee.js version: $NEW_VERSION";
	echo "";



	read -p "Continue (y/n)? " -r

	if [[ $REPLY =~ ^[Yy]$ ]]; then
		echo "";
	else
		exit 1;
	fi;



	if [ -d $LYCHEEJS_TEMP ]; then
		rm -rf $LYCHEEJS_TEMP;
	fi;

	mkdir $LYCHEEJS_TEMP;
	git clone git@github.com:Artificial-Engineering/lycheeJS.git $LYCHEEJS_TEMP;

	mkdir $LYCHEEJS_TEMP/bin/runtime;
	git clone --single-branch --branch master --depth 1 git@github.com:Artificial-Engineering/lycheeJS-runtime.git $LYCHEEJS_TEMP/bin/runtime;


	cd $LYCHEEJS_TEMP;
	git checkout development;

	sed -i 's|2[0-9][0-9][0-9]-Q[1-4]|'$NEW_VERSION'|g' ./README.md;
	sed -i 's|2[0-9][0-9][0-9]-Q[1-4]|'$NEW_VERSION'|g' ./libraries/lychee/source/core/lychee.js;

	git add ./README.md;
	git add ./libraries/lychee/source/core/lychee.js;
	git commit -m "lychee.js $NEW_VERSION release";
	git push origin development;

	git checkout master;
	git merge --squash development;
	git commit -m "lychee.js $NEW_VERSION release";
	git push origin master;


	cd $LYCHEEJS_TEMP;
	$LYCHEEJS_TEMP/bin/configure.sh --sandbox;


	cd $LYCHEEJS_TEMP;
	git clone --single-branch --branch master git@github.com:Artificial-Engineering/lycheeJS-library.git $LYCHEEJS_TEMP/projects/lycheejs-library;

#   XXX: Might not make sense to use Fertilizer due to env:node overhead
#	$LYCHEEJS_TEMP/bin/fertilizer.sh auto /projects/lycheejs-website;

	cd $LYCHEEJS_TEMP/projects/lycheejs-library;
	./bin/build.sh;
	./bin/package.sh;


else

	echo "lychee.js Release for $NEW_VERSION already done.";
	exit 0;

fi;
