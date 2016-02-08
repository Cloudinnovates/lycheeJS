#!/bin/bash

lowercase() {
	echo "$1" | sed "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/";
}

OS=`lowercase \`uname\``;
ARCH=`lowercase \`uname -m\``;

LYCHEEJS_ROOT=$(cd "$(dirname "$(readlink -f "$0")")/../"; pwd);
CHILD_PID="";


if [ "$ARCH" == "x86_64" -o "$ARCH" == "amd64" ]; then
	ARCH="x86_64";
fi;

if [ "$ARCH" == "i386" -o "$ARCH" == "i686" -o "$ARCH" == "i686-64" ]; then
	ARCH="x86";
fi;

if [ "$ARCH" == "armv7l" -o "$ARCH" == "armv8" ]; then
	ARCH="arm";
fi;


if [ "$OS" == "darwin" ]; then

	OS="osx";

elif [ "$OS" == "linux" ]; then

	OS="linux";

fi;



_handle_signal() {
	kill -s "$1" "$CHILD_PID" 2>/dev/null;
}

_trap() {

	handler="$1"; shift;
	for signal; do
		trap "$handler $signal" "$signal";
	done;

}

_start_env () {

	_trap _handle_signal INT HUP TERM EXIT;

	$1 $2 $3 $4 $5 &

	CHILD_PID=$!;
	wait "$CHILD_PID";

}

_put_API_Projects () {

	action="$1";
	identifier="$2";
	apiurl="http://localhost:4848/api/Project?identifier=$identifier&action=$action";

	curl -i -X PUT $apiurl 2>&1;

}



#
# USE CASES (ARGUMENTS LIST)
#
# lycheejs://boot=development
# lycheejs://unboot
# lycheejs://start=boilerplate
# lycheejs://stop=boilerplate
# lycheejs://edit=boilerplate
# lycheejs://file=boilerplate
# lycheejs://web=boilerplate
#
# env:html /path/to/program.js
# env:html-nwjs /path/to/program.js
# env:node /path/to/program.js
# env:node-sdl /path/to/program.js
#




protocol=$(echo $1 | cut -d":" -f 1);
content=$(echo $1 | cut -d":" -f 2);



if [ "$protocol" == "lycheejs" ]; then

	action=$(echo $content | cut -c 3- | cut -d"=" -f 1);


	if [[ $content =~ .*=.* ]]; then
		resource=$(echo $content | cut -d"=" -f 2);
	else
		resource="";
	fi;


	if [ "$action" == "web" ]; then
		resource=$(echo $1 | cut -c 16-);
	fi;


	# XXX: https://bugs.freedesktop.org/show_bug.cgi?id=91027
	resource=${resource%/};


	if [ "$action" != "" -a "$resource" != "" ]; then

		case "$action" in

			boot)

				cd $LYCHEEJS_ROOT;

				./bin/harvester.sh stop 2>&1;
				./bin/harvester.sh start "$resource" 2>&1;
				exit 0;

			;;

			unboot)

				cd $LYCHEEJS_ROOT;

				./bin/harvester.sh stop 2>&1;
				exit 0;

			;;

			start)

				_put_API_Projects "start" "$resource";
				exit 0;

			;;

			stop)

				_put_API_Projects "stop" "$resource";
				exit 0;

			;;

			edit)

				if [ -f ./bin/editor.sh ]; then

					if [ "$OS" == "linux" -o "$OS" == "osx" ]; then
						./bin/editor.sh "$resource" 2>&1;
						exit 0;
					fi;

				fi;

			;;

			file)

				if [ "$OS" == "linux" ]; then

					xdg-open "file://$LYCHEEJS_ROOT/projects/$resource" 2>&1;
					exit 0;

				elif [ "$OS" == "osx" ]; then

					open "file://$LYCHEEJS_ROOT/projects/$resource" 2>&1;
					exit 0;

				fi;

			;;

			web)

				# Well, fuck you, Blink and WebKit.

				clean_resource="$resource";
				clean_resource=${clean_resource//%5B/\[};
				clean_resource=${clean_resource//%5D/\]};
				clean_resource=${clean_resource//http:0\/\//http:\/\/};


				if [ "$OS" == "linux" ]; then

					chrome1=`which google-chrome`;
					chrome2=`which chromium-browser`;

					if [ -x "$chrome1" ]; then
						"$chrome1" "$clean_resource";
					elif [ -x "$chrome2" ]; then
						"$chrome2" "$clean_resource";
					else
						xdg-open "$clean_resource" 2>&1;
					fi;

					exit 0;

				elif [ "$OS" == "osx" ]; then

					chrome1="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

					if [ -x "$chrome1" ]; then
						"$chrome1" "$clean_resource";
					else
						open "$clean_resource" 2>&1;
					fi;

					exit 0;

				fi;

			;;

		esac;

	fi;


	exit 0;

elif [ "$protocol" == "env" ]; then

	platform=$(echo $content | cut -d":" -f 2);
	program=$2;


	if [ -f "$program" ]; then

		if [ "$platform" == "html" ]; then

			if [ "$OS" == "linux" ]; then

				chrome1=`which google-chrome`;
				chrome2=`which chromium-browser`;

				if [ -x "$chrome1" ]; then
					"$chrome1" "$program";
				elif [ -x "$chrome2" ]; then
					"$chrome2" "$program";
				else
					xdg-open "$program" 2>&1;
				fi;

			elif [ "$OS" == "osx" ]; then

				chrome1="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

				if [ -x "$chrome1" ]; then
					"$chrome1" "$program";
				else
					open "$program" 2>&1;
				fi;

			fi;

		elif [ "$platform" == "html-nwjs" ]; then

			if [ "$OS" == "linux" ]; then
				_start_env $LYCHEEJS_ROOT/bin/runtime/html-nwjs/linux/$ARCH/nw $program $3 $4 $5;
			elif [ "$OS" == "osx" ]; then
				_start_env $LYCHEEJS_ROOT/bin/runtime/html-nwjs/osx/$ARCH/nw $program $3 $4 $5;
			fi;

		elif [ "$platform" == "node" ]; then

			if [ "$OS" == "linux" ]; then
				_start_env $LYCHEEJS_ROOT/bin/runtime/node/linux/$ARCH/node $program $3 $4 $5;
			elif [ "$OS" == "osx" ]; then
				_start_env $LYCHEEJS_ROOT/bin/runtime/node/osx/$ARCH/node $program $3 $4 $5;
			fi;

		elif [ "$platform" == "jerry" ]; then


# TODO: Use correct jerry binary paths when we have it available in lycheeJS-runtime repository.


			if [ "$OS" == "linux" ]; then
				_start_env /opt/jerryscript/build/jerry.bin $program $3 $4 $5;
			elif [ "$OS" == "osx" ]; then

			fi;

		fi;

	fi;


	exit 0;

else

	exit 1;

fi;

