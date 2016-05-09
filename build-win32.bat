@echo off

rem echo Resolving dependencies...
npm install electron-packager -g
npm install 

echo Preparing build environment...
mkdir build
rmdir /s /q build\selekta-win32-x64

echo Creating package...
electron-packager ./ selekta --platform=win32 --arch=x64 --overwrite --out build --ignore=.*\.bat --ignore=.*sublime.* --ignore=.*\.md --ignore=sample-images --ignore=screenshots --ignore=.gitignore
