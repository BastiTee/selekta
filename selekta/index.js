const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;
const path = require('path');
const windowSettings = {
    resizable: true,
    fullscreen: false,
    center: true,
    frame: true,
    kiosk: false,
    title: 'selekta'
};
const devMode = process.argv[2] == "dev" ? true : false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var bw = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    bw = new electron.BrowserWindow(windowSettings);

    // disable default menu
    bw.setMenu(null);

    // and load the index.html of the app.
    bw.loadURL('file://' + __dirname + '/index.html');

    bw.webContents.on('did-finish-load', function() {
        // send current size
        bw.webContents.send('current-size', bw.getSize());
        if (devMode) {
            bw.webContents.send('open-folder',
                path.resolve(__dirname, '..'));
        } else {
            bw.webContents.send('open-folder');
        }
        // register listener to tell render thread about new sizes
        bw.on('resize', function() {
            bw.webContents.send('current-size',
                bw.getSize());
        });
    });

    if (devMode) {
        bw.openDevTools({
            detach: true
        });
    }

    // Emitted when the window is closed.
    bw.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        bw = null;
    });
});
