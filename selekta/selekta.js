const $ = require('jQuery');

var selektaCore = function() {
    const ipc = require('electron').ipcRenderer;
    const dialog = require('electron').remote.dialog;
    const animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

    var helpOpen = false;
    var shiftPressed = false;
    var ctrlPressed = false;
    var windowSize = undefined;
    var activeFilter = undefined;


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
            openFolder();
        else
            openFolder(rootDir + '/sample-images');
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
                openFolder();
            } else if (event.which == 82) {
                // r key
                selektaImageManager.setFirstImage(windowSize);
            } else if (event.which == 70) {
                // f key
                selektaImageManager.setLastImage(windowSize);
            } else if (event.which >= 49 && event.which <= 57) {
                // 1-9 keys
                evaluateBucketCall(event.which - 49);
            } else if (event.which == 65 ) {
                // a key
                addBucket();
            } else if (event.which == 83 && ctrlPressed ) {
                // Ctrl+s key
                saveBuckets();
            } else if (event.which == 16 && !shiftPressed) {
                // Shift key
                shiftPressed = true;
                console.log('shift pressed');
            } else if (event.which == 17 && !ctrlPressed) {
                // CTRL key
                ctrlPressed = true;
                console.log('ctrl pressed');
            } else {
                console.log(event.which + ' not supported.');
            }
            updateView();
        }

        function keyUp(event) {
            if (event.which == 16) {
                console.log('shift released');
                shiftPressed = false;
            } else if (event.which == 17) {
                console.log('CTRL released');
                ctrlPressed = false;
            }
        }

        $('#help-hover').click(toggleHelpWindow);
        $('#help-window').click(toggleHelpWindow);
    };

    function addBucket() {
        var nextId = selektaImageManager.getNextBucketIdx();
        if (nextId == undefined) {
            notify("No more new buckets allowed");
            return;
        }
        $("#bucket-container").append(
            "<div id=\"bucket-" + nextId + "\" class=\"bucket\" >" +
            "<i class=\"fa fa-folder\"></i>" +
            "<div class=\"bucket-quantity\">0</div></div>");
    }

    function saveBuckets() {
        quantities = selektaImageManager.getBucketQuantities();
        totalBucketized = 0;
        for (i = 0; i < quantities.length; i++)
            totalBucketized += quantities[i];
        if (totalBucketized == 0) {
            notify("No images in buckets");
            return;
        }
        ctrlPressed = false;
        dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select target folder for images'
        }, function(imageDir) {
            if (imageDir === undefined)
                return;
            selektaImageManager.saveBuckets(imageDir[0], function() {
                updateView();
            });
        });
    }

    function evaluateBucketCall(bucketId) {
        animateCss('#bucket-' + bucketId + '.bucket i', 'bounce');
        if (shiftPressed) {
            quantities = selektaImageManager.getBucketQuantities();
            if (quantities[bucketId] == 0) {
                notify('Cannot filter empty bucket');
                return;
            }
            activeFilter = selektaImageManager.filterBucket(bucketId);
        } else if (ctrlPressed) {
            if ( selektaImageManager.getCurrentBucketIdx() < bucketId ) {
                notify("Bucket not created yet");
                return;
            }
            buttons = ['Yes', 'No'];
            dialog.showMessageBox({ type: 'question', buttons: buttons,
                message: 'Do you really want to empty bucket ' + (bucketId+1) + '?',
                noLink: true },
                function (buttonIndex) {
                    if ( buttons[buttonIndex] == "Yes" ) {
                        selektaImageManager.clearBucket(bucketId);
                        updateView();
                    }
            });

        } else {
            selektaImageManager.addCurrentImageToBucket(bucketId);
        }
        updateView();

    };

    function updateView(reset) {
        if (reset === true) {
            $('#bucket-container').empty();
        }
        quantities = selektaImageManager.getBucketQuantities();
        totalBucketized = 0;
        totalImages = selektaImageManager.getTotalImages();
        for (i = 0; i < quantities.length; i++) {
            $('#bucket-' + i + ' .bucket-quantity').empty();
            if (activeFilter == undefined) {
                $('#bucket-' + i).css('color', 'white');
            } else if (activeFilter == i) {
                $('#bucket-' + i).css('color', 'white');
            } else {!
                $('#bucket-' + i).css('color', '#222');
            }
            $('#bucket-' + i + ' .bucket-quantity').append(quantities[i]);
            totalBucketized += quantities[i];
        }
        bucketForImage = selektaImageManager.getBucketForCurrentImage();
        if (bucketForImage != undefined) {
            $('#bucket-' + bucketForImage[0]).css('color', 'lightblue');
        }
        $('#total-images .bucket-quantity').empty();
        $('#total-images .bucket-quantity').append(totalBucketized + '/' + totalImages);
    };

    function animateCss( elementId, animationName, hide) {
        if (!hide)
            $(elementId).show();
        $(elementId).addClass('animated ' + animationName).one(animationEnd,
            function() {
                $(elementId).removeClass('animated ' + animationName);
                if (hide)
                    $(elementId).hide();
            });
    };

    function toggleHelpWindow() {
        if (helpOpen) {
            animateCss('#help-hover','bounce');
            animateCss('#help-window','slideOutDown', true);
        } else {
            animateCss('#help-hover','bounce');
            animateCss('#help-window','slideInUp', false);
        }
        helpOpen = !helpOpen;
    };

    function openFolder(explicitFolder) {
        if (explicitFolder === undefined) {
            dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: 'Select new image folder'
            }, function(imageDir) {
                if (imageDir === undefined)
                    return;
                selektaImageManager.setImageFolder(imageDir[0], function() {
                    updateView(true);
                });
            });
        } else {
            selektaImageManager.setImageFolder(explicitFolder, function() {
                updateView(true);
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
    selektaCore.init();
});
