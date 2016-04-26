# selekta
> An image browser written in JavaScript / Electron for self-educational purposes

## Startup
- Install dependencies with `npm install`
- Start application with `npm start`
- Start application in development mode with `npm run start -- dev` or `go` on windows

## To-Dos
- Tasks
  - Optimize image loading speed by somehow preloading a reduced-size image version
  - ~~Write images to subfolders based on buckets~~
  - ~~Allow filtering images by bucket number~~
  - ~~Allow for dynamically creating the number of buckets~~
  - ~~Beautify notification bar (round edges, centered text, etc)~~
  - ~~Add the bucket engine to put images into containers~~
  - ~~Visualize the bucket engine~~

- Bugs
  - Resizing fails on squared images
  - Progess icon shows up delayed after key was pressed
  - Progress icon hangs on startup sometimes
  - When hammering on h-key for help, help breaks
  - Shift/Ctrl keys are not always reset correctly

- Packaging
  - Create a native container build for windows

## Licence
Code is licensed under GPLv3.
