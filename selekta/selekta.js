const $ = require('jQuery');

var selekta = function() {
    const ipc = require('electron').ipcRenderer;
    const dialog = require('electron').remote.dialog;
    var helpOpen = false;
    var shiftPressed = false;
    var ctrlPressed = false;
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
            } else if (event.which >= 49 && event.which <= 57) {
                // 1-9 keys
                handleBucketKey(event.which - 49);
            } else if (event.which == 65 ) {
                // a key 
                addBucket();
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
            updateData();
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
            notify("No more new buckets allowed.");
            return;
        }

        $("#bucket-container").append(
            "<div id=\"bucket-" + nextId + "\" class=\"bucket\" >" +
            "<i class=\"fa fa-folder\"></i>" +
            "<div class=\"bucket-quantity\">0</div></div>");
    }

    function handleBucketKey(bucketId) {
        $('#bucket-' + bucketId + '.bucket i').animateCss('bounce');
        if (shiftPressed) {
            shiftPressed = false;
            quantities = selektaImageManager.getBucketQuantities();
            if (quantities[bucketId] == 0) {
                notify('Cannot filter empty bucket');
                return;
            }
            console.log('filtering ' + bucketId);
        } else if (ctrlPressed) {
            ctrlPressed = false;
            if ( selektaImageManager.getCurrentBucketIdx() < bucketId ) {
                notify("Bucket not created yet.");
                return;
            }
            buttons = ['Yes', 'No'];
            dialog.showMessageBox({ type: 'question', buttons: buttons, 
                message: 'Do you really want to empty bucket ' + (bucketId+1) + '?',
                noLink: true }, 
                function (buttonIndex) {
                    if ( buttons[buttonIndex] == "Yes" ) {
                        selektaImageManager.clearBucket(bucketId);
                        updateData();
                    }
            });
            
        } else {
            selektaImageManager.evaluateBucketCall(bucketId);
        }
        updateData();

    };

    function updateData(reset) {
        if (reset === true) {
            $('#bucket-container').empty();
        }
        quantities = selektaImageManager.getBucketQuantities();
        totalBucketized = 0;
        totalImages = selektaImageManager.getTotalImages();
        for (i = 0; i < quantities.length; i++) {
            $('#bucket-' + i + ' .bucket-quantity').empty();
            $('#bucket-' + i).css('color', 'white');
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
                    updateData(true);
                });

            });
        } else {
            selektaImageManager.setRootFolder(explicitFolder, windowSize, function() {
                updateData(true);
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
