
# Release Guide for lychee.js

1. [Update Runtimes](#update-runtimes)
  - [Fix Info.plist files](#fix-infoplist-files)
2. [Release Runtimes](#release-runtimes)
3. [Release lychee.js](#release-lycheejs)
4. [Release lychee.js Bundles](#release-lycheejs-bundles)


## Update Runtimes

All runtimes have to be updated. The `update.sh` inside
the `./bin/runtime` folder updates all runtimes and
downloads their latest stable releases.

The update process itself takes around 20min+, depending
on your bandwidth. The reason for that time span is mostly
bandwidth limitations of the runtime's download servers.

```bash
cd /opt/lycheejs-edge/bin/runtime;
./update.sh;
```


### Fix Info.plist files

All OSX Info.plist files contain a `<string>...</string>` tag.
This tag currently is not fixed by the `update.sh` script,
so you have to make sure that every occurance of the name value
is replaced with `__NAME__`.

The two different occurances in the `html-nwjs/osx/x86_64/nwjs.app/Contents/Info.plist`
are listed below:

```html
<key>CFBundleDisplayName</key>
<string>__NAME__</string>

<key>CFBundleName</key>
<string>__NAME__</string>
```


## Release Runtimes

The runtimes are hosted at github, so that a `Contributor Installation`
can still use only github for installing lychee.js.

```bash
cd /opt/lycheejs-edge/bin/runtime;
rm -rf .git/;
git init;
git remote add origin git@github.com:Artificial-Engineering/lycheeJS-runtime.git;
git add ./;
git commit -m ":sparkles: :boom: :sparkles:";
git push origin master -f;
```


## Release lychee.js Engine

The lychee.js version flags are used among all bundle-generation algorithms.
That means we have to fix both the `README.md` and the `lychee.js` file
in `/libraries/lychee/source/core`.

```bash
VERSION="2016-Q1";


sudo mkdir -m 0777 /opt/lycheejs-release;
cd /opt/lycheejs-release;
git clone git@github.com:Artificial-Engineering/lycheeJS.git ./;
git checkout master;


sed -i 's|2[0-9][0-9][0-9]-Q[1-4]|'$VERSION'|g' ./README.md;
sed -i 's|2[0-9][0-9][0-9]-Q[1-4]|'$VERSION'|g' ./libraries/lychee/source/core/lychee.js;

git merge --squash development;

git add ./;
git commit -m "lychee.js $VERSION release";
git rebase -i $OLD_HEAD;


# Now squash everything into this release and remove the commit messages
# I have no clue how to do this automagically :-/


git push origin master;
```


## Release lychee.js Bundles

The bundles have to be created on an up-to-date Ubuntu machine.
The `package.sh` inside the root folder creates all bundles. In between
different bundle iterations, the `clean.sh` script has to be executed.

```bash
sudo apt-get install curl git hfsprogs advancecomp mktorrent;

cd /opt/lycheejs-bundle;

sudo ./clean.sh;
sudo ./package.sh --release "2016-Q1";
sudo ./package.sh --preview "2016-Q2";
```

Now everything needs to be uploaded to the [lycheeJS-website](https://github.com/Artificial-Engineering/lycheeJS-website)'s
`/download/bundle` folder, including the `release.json` and the optional
`preview.json`. After that everything is integrated with the website.

Note that the files are too large to be hosted on github, that's why the
server for the `lycheeJS-website` still exists and is served via `nginx`.

