
# Release Guide for lychee.js

1. [Update lychee.js Engine](#update-lychee)
  - [Fix Info.plist files](#fix-infoplist-files)
2. [Release Runtimes](#release-runtimes)
3. [Release lychee.js](#release-lycheejs)
4. [Release lychee.js Bundles](#release-lycheejs-bundles)


## Update lychee.js Engine

First, the `development` branch is the branch that is
the newest HEAD and gets merged back to `master` with
a single squashed release commit.

To make sure everything is up-to-date, execute the update tool:

```bash
cd /opt/lycheejs;

./bin/maintenance/do-update.sh;
```


### (TODO for automation) Fix Info.plist files

All OSX Info.plist files contain a `<string>...</string>` tag.
This tag currently is not fixed by the `update.sh` script,
so you have to make sure that every occurance of the name value
is replaced with `__NAME__`.

The two different occurances in the `./bin/runtime/html-nwjs/osx/x86_64/nwjs.app/Contents/Info.plist`
are listed below:

```html
<key>CFBundleDisplayName</key>
<string>__NAME__</string>

<key>CFBundleName</key>
<string>__NAME__</string>
```


## Release lychee.js Engine

```bash
cd /opt/lycheejs;

./bin/maintenance/do-release.sh;
```

