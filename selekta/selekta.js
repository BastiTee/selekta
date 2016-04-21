const $ = require('jQuery');

var selekta = function() {
    const ipc = require('electron').ipcRenderer;
    const dialog = require('electron').remote.dialog;
    var helpOpen = false;
    var shiftPressed = false;
    var currentFilter = undefined;
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
        document.body.addEventListener("keyup", keyUp);

        function keyDown(event) {
            if (event.which == 39) {
                // Right arrow key
                selektaImageManager.setNextImage(windowSize);
            } else if (event.which == 37) {
                // Left arrow key
                selektaImageManager.setPreviousImage(windowSize);
            } else if (event.which == 72) {
                // h key
                toggleHelpWindow();
            } else if (event.which == 79) {
                // o key
                setFolder();
            } else if (event.which == 82) {
                // r key
                selektaImageManager.setFirstImage(windowSize);
            } else if (event.which == 70) {
                // f key
                selektaImageManager.setLastImage(windowSize);
            } else if (event.which == 49) {
                // 1 key
                handleBucketKey(0);
            } else if (event.which == 50) {
                // 2 key
                handleBucketKey(1);
            } else if (event.which == 51) {
                // 3 key
                handleBucketKey(2);
            } else if (event.which == 52) {
                // 4 key
                handleBucketKey(3);
            } else if (event.which == 16 && !shiftPressed) {
                // Shift key
                shiftPressed = true;
                console.log('shift pressed');
            } else {
                //   console.log(event.which + ' not supported.');
            }
            updateData();
        }

        function keyUp(event) {
            if (event.which == 16) {
                console.log('shift released');
                shiftPressed = false;
            }
        }

        $('#help-hover').click(toggleHelpWindow);
        $('#help-window').click(toggleHelpWindow);
    };

    function handleBucketKey(bucketId) {
        $('#bucket-hover-' + bucketId + ' i').animateCss('bounce');
        if (shiftPressed) {
            quantities = selektaImageManager.getBucketQuantities();
            if (quantities[bucketId] == 0) {
                notify('Cannot filter empty bucket');
                return;
            }

            console.log('filtering ' + bucketId);
        } else {
            selektaImageManager.evaluateBucketCall(bucketId);
        }
        updateData();

    };

    function updateData() {
        quantities = selektaImageManager.getBucketQuantities();
        totalBucketized = 0;
        totalImages = selektaImageManager.getTotalImages();
        for (i = 0; i < quantities.length; i++) {
            $('#bucket-hover-' + i + ' .bucket-quantity').empty();
            $('#bucket-hover-' + i).css('color', 'white');
            $('#bucket-hover-' + i + ' .bucket-quantity').append(quantities[i]);
            totalBucketized += quantities[i];
        }
        bucketForImage = selektaImageManager.getBucketForCurrentImage();
        if (bucketForImage != undefined) {
            $('#bucket-hover-' + bucketForImage[0]).css('color', 'lightblue');
        }
        $('#total-images .bucket-quantity').empty();
        $('#total-images .bucket-quantity').append(totalBucketized + '/' + totalImages);
    };

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
            $('#help-hover').animateCss('bounce');
            $('#help-window').animateCss('slideOutDown', true);
        } else {
            $('#help-hover').animateCss('bounce');
            $('#help-window').animateCss('slideInUp', false);
        }
        helpOpen = !helpOpen;
    };

    function setFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory', 'multiSelections']
            }, function(imageDir) {
                selektaImageManager.setRootFolder(imageDir[0], windowSize, function() {
                    updateData();
                });

            });
        } else {
            selektaImageManager.setRootFolder(explicitFolder, windowSize, function() {
                updateData();
            });

        }
    };

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
    };

    return {
        init: init
    };
}();

$(document).ready(function() {
    selekta.init();
});
