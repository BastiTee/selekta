# selekta
> A tiny tool to browse and bucketize images - for keyboard ninjas only

Selekta is yet another image browser. Its only purpose is to quickly skim through an image folder and put the images into buckets, e.g., pictures of me/pictures of bob/pictures of john or awesome/mediocre/trash or people/animals/none - you name it! Navigation is keyboard-only and features a very small command set to get the job done quickly.  

Selekta is written in JavaScript and based upon [Electron](electron.atom.io) for self-educational purposes. 
 
## Startup
- Install dependencies with `npm install`
- Start application with `npm start`
- Start application in development mode with `npm run start -- dev` or `go` on windows

## To-Dos

*Tasks*

  - Optimize image loading speed by somehow preloading a reduced-size image version
  - ~~Write images to subfolders based on buckets~~
  - ~~Allow filtering images by bucket number~~
  - ~~Allow for dynamically creating the number of buckets~~
  - ~~Beautify notification bar (round edges, centered text, etc)~~
  - ~~Add the bucket engine to put images into containers~~
  - ~~Visualize the bucket engine~~

*Bugs*

  - Resizing fails on squared images
  - Progess icon shows up delayed after key was pressed
  - Progress icon hangs on startup sometimes
  - When hammering on h-key for help, help breaks
  - Shift/Ctrl keys are not always reset correctly

*Packaging*

  - Create a native container build for windows/mac/linux
  - Create or find an awesome icon

*Other*

  - Learn more about JavaScript's best practices and design patterns and beautify/refactor the s*t out of the code
  - Try to appear on electron.atom.io once this project is shiny and clean

## Licence
Code is licensed under GPLv3.
