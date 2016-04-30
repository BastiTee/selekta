const electron = require("electron");
const app = electron.app;
const ipc = electron.ipcMain;
const path = require("path");
const windowSettings = {
    fullscreen: false,
    fullscreenable: false,
    center: true,
    resizable: true,
    movable: true,
    frame: true,
    icon: __dirname + "/icon.png",
    title: "selekta"
};
const devMode = process.argv[2] == "dev" ? true : false;
var bw = null;
console.log(windowSettings.icon)
app.on("window-all-closed", function() {
    if (process.platform != "darwin") {
        app.quit();
    }
});

app.on("ready", function() {
    bw = new electron.BrowserWindow(windowSettings);
    bw.setMenu(null);  // disable default menu
    bw.loadURL("file://" + __dirname + "/index.html");

    bw.webContents.on("did-finish-load", function() {
        // send current size
        bw.webContents.send("current-size", bw.getSize());
        if (devMode) {
            bw.webContents.send("open-folder",
                path.resolve(__dirname, ".."));
        } else {
            bw.webContents.send("open-folder");
        }
        // register listener to tell render thread about new sizes
        bw.on("resize", function() {
            bw.webContents.send("current-size",
                bw.getSize());
        });
        bw.on("move", function() {
            bw.webContents.send("current-size",
                bw.getSize());
        });
    });

    if (devMode)
        bw.openDevTools({ detach: true });

    bw.on("closed", function() {
        bw = null;
    });
});
