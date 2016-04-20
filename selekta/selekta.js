const $ = require('jQuery');

var selekta = function() {
    const ipc = require('electron').ipcRenderer;
    const dialog = require('electron').remote.dialog;
    var helpOpen = false;
    var windowSize = undefined;
    const animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

    function init() {
        $('#load-hover').hide();
        registerKeys();
        require('./image-manager.js');
        selektaImageManager.init(notify);
    }

    // register size listener
    ipc.on('current-size', function(event, newWindowSize) {
        console.log('current-size event received: ' + newWindowSize);
        windowSize = newWindowSize;
    });

    // register open-folder request from main thread
    ipc.on('open-folder', function(event, rootDir) {
        console.log('open-folder event received');
        if (rootDir == undefined)
            setFolder();
        else
            setFolder(rootDir + '/sample-images');
    });

    function registerKeys() {
        document.body.addEventListener("keydown", keyDown);

        function keyDown(event) {
            if (event.which == 39) { // Right arrow key
                selektaImageManager.setNextImage(windowSize);
            } else if (event.which == 37) { // Left arrow key
                selektaImageManager.setPreviousImage(windowSize);
            } else if (event.which == 72) { // h key
                toggleHelpWindow();
            } else if (event.which == 27) { // ESC key
                if (!helpOpen) return;
                toggleHelpWindow();
            } else if (event.which == 79) {
                setFolder();
            } else if (event.which == 82) { // r key
                selektaImageManager.setFirstImage(windowSize);
            } else if (event.which == 70) { // f key
                selektaImageManager.setLastImage(windowSize);
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
            $(this).addClass('animated ' + animationName).one(animationEnd,
                function() {
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

    function setFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory', 'multiSelections']
            }, function(imageDir) {
                selektaImageManager.setRootFolder(imageDir[0], windowSize);
            });
        } else {
            selektaImageManager.setRootFolder(explicitFolder, windowSize);
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

    return {
        init: init
    }
}();

$(document).ready(function() {
    selekta.init();
});
