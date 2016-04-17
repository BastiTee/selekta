var walk = require('walk');
var imagePaths = [];
var currImageIdx = 0;
var currImagePath = '';
const dialog = require('electron').remote.dialog;

function initBackend() {

    registerKeys();
    var imageDir = dialog.showOpenDialog(
      { properties: [ 'openFile', 'openDirectory', 'multiSelections' ]});

    console.log(imageDir[0]);
    obtainFilePaths(imageDir[0]);

    function registerKeys() {
        document.body.addEventListener("keydown", keyDown);

        function keyDown(event) {
            if (event.which == 39) {
                setNextImage(1);
            } else if (event.which == 37) {
                setNextImage(-1);
            }
        }
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
