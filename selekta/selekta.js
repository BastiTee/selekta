var walk = require('walk');
var imagePaths = [];
var currImageIdx = 0;
var currImagePath = '';
var helpOpen = false;
const dialog = require('electron').remote.dialog;

function initBackend() {

    registerKeys();
    // var imageDir = dialog.showOpenDialog(  { properties: [ 'openFile', 'openDirectory', 'multiSelections' ]});
    var imageDir = ['C:/development/data/testdaten/sample-images'];

    obtainFilePaths(imageDir[0]);

    function registerKeys() {
        document.body.addEventListener("keydown", keyDown);

        function keyDown(event) {
            if (event.which == 39) { // Right arrow key
                setNextImage(1);
            } else if (event.which == 37) { // Left arrow key
                setNextImage(-1);
            } else if (event.which == 72) { // h key
                openHelpMenu();
            } else if (event.which == 27) { // ESC key
                closeHelpMenu();
            } else {
                console.log(event.which + ' not supported.');
            }
        }

        function openHelpMenu() {
            console.log('open help');
            $('#help-window').show();
        }

        function closeHelpMenu() {
            console.log('close help');

            $('#help-window').hide();
        }

        $('#help-hover').click(openHelpMenu);
        $('#help-window').click(closeHelpMenu);
    }

    function setNextImage(shift) {
        currImageIdx = currImageIdx + shift
        currImageIdx = currImageIdx > 0 ? currImageIdx < imagePaths.length - 1 ?
            currImageIdx : imagePaths.length - 1 : 0;
        currImagePath = imagePaths[currImageIdx];
        $('#main-image').attr("src", currImagePath);
        console.log(currImageIdx + ' >>> ' + currImagePath);
    }

    function obtainFilePaths(rootDir) {
        var walker = walk.walk(rootDir, {
            followLinks: false
        });
        walker.on('file', function(root, stat, next) {
            imagePaths.push(root + '/' + stat.name);
            next();
        });
        walker.on('end', function() {
            setNextImage(0);
        });
    }
}
