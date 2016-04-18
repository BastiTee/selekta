function initBackend() {

    var walk = require('walk');
    const dialog = require('electron').remote.dialog;
    var imagePaths = [];
    var currImageIdx = 0;
    var currImagePath = '';
    var helpOpen = false;
    var supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg)$', 'i');

    registerKeys();
    // setFolder();
    setFolder('C:/development/data/testdaten/sample-images');

    function registerKeys() {
        document.body.addEventListener("keydown", keyDown);

        function keyDown(event) {
            if (event.which == 39) { // Right arrow key
                setNextImage(1);
            } else if (event.which == 37) { // Left arrow key
                setNextImage(-1);
            } else if (event.which == 72) { // h key
                setHelp();
            } else if (event.which == 27) { // ESC key
                if (!helpOpen) return;
                setHelp();
            } else if (event.which == 79) {
                setFolder();

            } else {
                console.log(event.which + ' not supported.');
            }
        }

        function setHelp() {
            if (helpOpen) {
                $('#help-window').hide();
            } else {
                $('#help-window').show();
            }
            helpOpen = !helpOpen;
        }

        $('#help-hover').click(setHelp);
        $('#help-window').click(setHelp);
    }

    function setNextImage(shift) {
        currImageIdx = currImageIdx + shift
        currImageIdx = currImageIdx > 0 ? currImageIdx < imagePaths.length - 1 ?
            currImageIdx : imagePaths.length - 1 : 0;
        currImagePath = imagePaths[currImageIdx];
        $('#main-image').attr("src", currImagePath);
        console.log(currImageIdx + ' >>> ' + currImagePath);
    }

    function setFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            imageDir = dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory', 'multiSelections']
            });
        } else {
            imageDir = [explicitFolder];
        }
        obtainFilePaths(imageDir[0]);
    }

    function obtainFilePaths(rootDir) {
        imagePaths = [];
        var walker = walk.walk(rootDir, {
            followLinks: false
        });

        walker.on('file', function(root, stat, next) {
            if (stat.name.match(supportedFileSuffixes)) {
                imagePaths.push(root + '/' + stat.name);
            }
            next();
        });
        walker.on('end', function() {
            setNextImage(0);
        });
    }
}
