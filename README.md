# selekta
> A tiny tool to browse and bucketize images - for keyboard ninjas only

![build](https://img.shields.io/badge/build-probably%20broken-orange.svg)
![version](https://img.shields.io/badge/version-*-lightgrey.svg)

Selekta is yet another image browser. Its only purpose is to quickly skim through an image folder and put the images into buckets, e.g., _pictures-of-me/pictures-of-bob/pictures-of-john_ or _awesome/mediocre/trash_ or _people/animals/none_ - you name it! Navigation is keyboard-only and features a very small command-set to get the job done quickly.

Selekta is a self-educational project to get the hang of  [JavaScript](http://s2.quickmeme.com/img/c2/c27aa8c34c875f015ed015e075a703ffa6e5f7063186a8573d82931ba4928c76.jpg) and  [Electron](http://electron.atom.io). 

![Screenshot 1](https://raw.githubusercontent.com/BastiTee/selekta/master/screenshots/001_a.png)
![Screenshot 2](https://raw.githubusercontent.com/BastiTee/selekta/master/screenshots/001_b.png)

## Startup
- Install dependencies with `npm install`
- Start application with `npm start`
- Start application in development mode with `npm run start -- dev` or `go` on windows

## To-Dos

*Tasks*

 - [ ] Optimize image loading speed by somehow preloading a reduced-size image version
 - [x] Write images to subfolders based on buckets
 - [x] Allow filtering images by bucket number
 - [x] Allow for dynamically creating the number of buckets
 - [x] Beautify notification bar (round edges, centered text, etc)
 - [x] Add the bucket engine to put images into containers
 - [x] Visualize the bucket engine

*Bugs*

 - [ ] Resizing fails on squared images
 - [ ] Resizing breaks when repedately changing the window size 
 - [ ] Progess icon shows up delayed after key was pressed
 - [ ] Progress icon hangs on startup sometimes
 - [ ] When hammering on h-key for help, help breaks
 - [ ] Shift/Ctrl keys are not always reset correctly

*Packaging*

 - [ ] Create a native container build for windows/mac/linux
 - [ ] Create or find an awesome icon

*Other*

 - [ ] Learn more about JavaScript's best practices and design patterns and beautify/refactor the s*t out of the code
 - [ ] Try to appear on electron.atom.io once this project is shiny, clean and fast as a lightning

## Licence
Code is licensed under GPLv3.
