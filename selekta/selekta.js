function initBackend() {

    const c = console;
    const $ = require('jQuery');
    const walk = require('walk');
    const dialog = require('electron').remote.dialog;
    const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg)$', 'i');
    const animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    const ipc = require('electron').ipcRenderer;
    var imagePaths = [];
    var currImageIdx = 0;
    var currImagePath = '';
    var helpOpen = false;
    var windowSize = undefined;

    // register size
    ipc.on('current-size', function(event, message) {
        console.log('new window size: ' + message[0] + 'x' + message[1]);
        windowSize = message;
    });
    registerKeys();
    setFolder();

    function registerKeys() {
        document.body.addEventListener("keydown", keyDown);

        function keyDown(event) {
            if (event.which == 39) { // Right arrow key
                setNextImage(currImageIdx + 1);
            } else if (event.which == 37) { // Left arrow key
                setNextImage(currImageIdx - 1);
            } else if (event.which == 72) { // h key
                toggleHelpWindow();
            } else if (event.which == 27) { // ESC key
                if (!helpOpen) return;
                toggleHelpWindow();
            } else if (event.which == 79) {
                setFolder();
            } else if (event.which == 82) { // r key
                setNextImage(-1);
            } else if (event.which == 70) { // f key
                setNextImage(imagePaths.length);
            } else {
                // c.log(event.which + ' not supported.');
            }
        }


        $('#help-hover').click(toggleHelpWindow);
        $('#help-window').click(toggleHelpWindow);
    }

    $.fn.extend({
        animateCss: function(animationName, hide) {
            if (!hide) {
                $(this).show();
            }
            $(this).addClass('animated ' + animationName).one(animationEnd, function() {
                $(this).removeClass('animated ' + animationName);
                if (hide) {
                    $(this).hide();
                }
            });
        }
    });

    function toggleHelpWindow() {

        if (helpOpen) {
            $('#help-hover').animateCss('slideInDown', false);
            $('#help-window').animateCss('slideOutUp', true);
        } else {
            $('#help-hover').animateCss('slideOutUp', true);
            $('#help-window').animateCss('slideInDown', false);
        }
        helpOpen = !helpOpen;
    }

    function setNextImage(newImageIdx) {
        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            notify('Reached first image');
        } else if (currImageIdx >= imagePaths.length) {
            notify('Reached last image');
        }
        currImageIdx = currImageIdx > 0 ? currImageIdx < imagePaths.length - 1 ?
            currImageIdx : imagePaths.length - 1 : 0;

        currImagePath = imagePaths[currImageIdx];

        $('#main-image').attr("src", currImagePath);

        // TODO Make sure image fits into container

    }

    function setFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory', 'multiSelections']
            }, function(imageDir) {
                obtainFilePaths(imageDir);
            });
        } else {
            imageDir = [explicitFolder];
        }

    }

    function notify(message) {
        $('#notification').text(message);
        $('#notification-box').show();
        $('#notification-box').addClass('animated fadeIn').one(
            animationEnd,
            function() {
                $('#notification-box').removeClass('animated fadeIn');
                setTimeout(function() {

                    $('#notification-box').hide();

                }, 1000);
            });
    }

    function obtainFilePaths(rootDir) {
        if (rootDir == undefined) {
            return;
        }
        rootDir = rootDir[0];
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
