const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;
const windowSettings = {
    resizable: true,
    fullscreen: false,
    center: true,
    frame: false,
    kiosk: false,
    title: 'selekta'
};
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var browserWindow = null;

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
    browserWindow = new electron.BrowserWindow(windowSettings);

    browserWindow.setMenu(null); // disable default menu

    // and load the index.html of the app.
    browserWindow.loadURL('file://' + __dirname + '/index.html');

    browserWindow.webContents.on('did-finish-load', function() {
        // send current size
        browserWindow.webContents.send('current-size',
            browserWindow.getSize());
        // register listener to tell render thread about new sizes
        browserWindow.on('resize', function() {
            browserWindow.webContents.send('current-size',
                browserWindow.getSize());
        });
    });

    // Open the DevTools.
    browserWindow.openDevTools({ detach: true} );


    // Emitted when the window is closed.
    browserWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        browserWindow = null;
    });
});
