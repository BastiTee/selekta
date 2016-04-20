const ipc = require('electron').ipcRenderer;
const imgTool = require('image-size');
const c = console;
const $ = require('jQuery');
const walk = require('walk');
const dialog = require('electron').remote.dialog;
const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg)$', 'i');
const animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

var selekta = function initBackend() {

    var imagePaths = [];
    var currImageIdx = 0;
    var currImagePath = '';
    var helpOpen = false;
    var windowSize = undefined;

    function init() {
        registerKeys();
    }

    // register size
    ipc.on('current-size', function(event, message) {
        c.log('new window size: ' + message[0] + 'x' + message[1]);
        windowSize = message;
    });
    // register size
    ipc.on('open-folder', function(event, rootDir) {
        if (rootDir == undefined)
            setFolder();
        else
            setFolder(rootDir + '/sample-images');
    });

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

        $('#load-hover').show();
        imgTool(currImagePath, function(e, dimensions) {
            $('#main-image').load(function(){
              $('#load-hover').hide();
            })
            getAspectRatio(dimensions.width, dimensions.height);
        });

        $('#main-image').attr("src", currImagePath);


        // TODO Make sure image fits into container

    }

    function getAspectRatio(picHeight, picWidth) {
        var picRatio = picWidth / picHeight;
        var screenRatio = windowSize[0] / windowSize[1];

        if (picRatio < screenRatio) {
            $('#main-image').css({
                width: '100%',
                height: 'auto',
                opacity: '1'
            });
        } else {
            $('#main-image').css({
                width: 'auto',
                height: '100%',
                opacity: '1'
            });
        }


    }

    function setFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory', 'multiSelections']
            }, function(imageDir) {
                obtainFilePaths(imageDir);
            });
        } else {
            obtainFilePaths([explicitFolder]);
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
        c.log('walking in directory ' + rootDir);
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

    return {
        init: init
    }
}();

$(document).ready(function() {
    selekta.init();
});
