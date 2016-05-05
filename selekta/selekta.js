const $ = require("jQuery");

var selektaCore = function() {
    "use strict"; // e.g., don"t use undeclared variables

    require("./image-manager.js");
    require("./image-processor.js");

    const ipc = require("electron").ipcRenderer;
    const dialog = require("electron").remote.dialog;

    var helpOpen = false;
    var imageNameOpen = false;
    var shiftPressed = false;
    var ctrlPressed = false;
    var activeFilter = undefined;
    var lastImagePos = undefined;

    var init = function () {
         // register size listener
         ipc.on("current-size", function(event, windowSize) {
            selektaImageManager.setWindowSize(windowSize);
        });

        // register open-folder request from main thread
        ipc.on("open-folder", function(event, rootDir) {
            if (rootDir == undefined)
                openFolder(true);
            else
                openFolder(true, rootDir + "/sample-images");
        });
        registerKeyboardAndMouseEvents();
        selektaImageManager.init();
        selektaImageProcessor.init();
    };

    function registerKeyboardAndMouseEvents() {

        $("#help-hover").click(toggleHelpWindow);
        $("#help-window").click(toggleHelpWindow);

        document.body.addEventListener("keydown", keyDown);
        document.body.addEventListener("keyup", keyUp);

        function keyDown(event) {
            var imagePos = undefined;
            if (event.which == 39) { // Right arrow key
                imagePos = selektaImageManager.setNextImage();
            } else if (event.which == 37) { // Left arrow key
                imagePos = selektaImageManager.setPreviousImage();
            } else if (event.which == 72 || event.which == 112) { // h/F1 key
                toggleHelpWindow();
            } else if (event.which == 83) { // h/F1 key
                toggleImageName();
            } else if (event.which == 79 && shiftPressed) { // o key
                openFolder(true);
            } else if (event.which == 79 && !shiftPressed) { // shift+o key
                openFolder(false);
            } else if (event.which == 82) { // r key
                imagePos = selektaImageManager.setFirstImage();
            } else if (event.which == 70) { // f key
                imagePos = selektaImageManager.setLastImage();
            } else if (event.which >= 49 && event.which <= 57) { // 1-9 keys
                handleOnBucket(event.which - 49);
            } else if (event.which == 65 ) { // a key
                handleAddBucket();
            } else if (event.which == 83 && ctrlPressed ) { // Ctrl+S key
                handleSaveBuckets();
            } else if (event.which == 16 && !shiftPressed) { // Shift key
                shiftPressed = true;
                console.log("shift pressed");
            } else if (event.which == 17 && !ctrlPressed) { // Ctrl key
                ctrlPressed = true;
                console.log("ctrl pressed");
            } else {
                console.log(event.which + " not supported.");
            }
            if (imagePos === "FIRST" && lastImagePos !== imagePos)
                notify("Reached first image");
            else if (imagePos === "LAST" && lastImagePos !== imagePos)
                notify("Reached last image");
            lastImagePos = imagePos; // make sure we don"t repeat
            refreshView();
        };

        function keyUp(event) {
            if (event.which == 16) {
                console.log("shift released");
                shiftPressed = false;
            } else if (event.which == 17) {
                console.log("ctrl released");
                ctrlPressed = false;
            }
        };
    };

    function handleAddBucket() {
        var nextId = selektaImageManager.getNextBucketIdx();
        var shownId = nextId + 1;
        if (nextId == undefined) {
            notify("No more new buckets allowed");
            return;
        }
        $("#bucket-container").append(
            "<div id=\"bucket-" + nextId + "\" class=\"bucket\" >" +
            "<span class=\"folder-numeration\">" + shownId + "</span>" +
            "<i class=\"fa fa-folder\">"+"</i>" +
            "<div class=\"bucket-quantity\">0</div></div>");
    };

    function handleSaveBuckets() {
        var bucketSizes = selektaImageManager.getBucketQuantities();
        var totalBucketized = 0;
        for (var i = 0; i < bucketSizes.length; i++)
            totalBucketized += bucketSizes[i];
        if (totalBucketized == 0) {
            notify("No images in buckets");
            return;
        }
        ctrlPressed = false;
        dialog.showOpenDialog({
            properties: ["openDirectory"],
            title: "Select target folder for images"
        }, function(imageDir) {
            if (imageDir === undefined)
                return;
            selektaImageManager.saveBuckets(imageDir[0], function() {
                refreshView();
            });
        });
    };

    function handleOnBucket(bucketId) {
        bounceElement("#bucket-" + bucketId + ".bucket");
        var bucketSizes = selektaImageManager.getBucketQuantities();
        var currBucketIdx = selektaImageManager.getCurrentBucketIdx();
        if (shiftPressed || ctrlPressed ) {
            if ( currBucketIdx < bucketId ) {
                notify("Bucket does not exist");
                return;
            }
            if (bucketSizes[bucketId] == 0) {
                notify("Bucket is empty");
                return;
            }
        }
        if (shiftPressed) {
            activeFilter = selektaImageManager.filterBucket(bucketId);
            if (activeFilter == undefined)
                notify("Bucket filter disabled");
            else
                notify("Filter set to bucket #" + (activeFilter+1));
        } else if (ctrlPressed) {
            ctrlPressed = false;
            var buttons = ["Yes", "No"];
            dialog.showMessageBox({ type: "question", buttons: buttons,
                message: "Do you really want to empty bucket "
                + (bucketId+1) + "?",
                noLink: true },
                function (buttonIndex) {
                    if ( buttons[buttonIndex] == "Yes" ) {
                        selektaImageManager.clearBucket(bucketId);
                        refreshView();
                    }
            });
        } else {
            selektaImageManager.addCurrentImageToBucket(bucketId);
            var newBucketSize =
            selektaImageManager.getBucketQuantities()[bucketId];
            // when in filter and no more images left, reset filter
            if (activeFilter != undefined && newBucketSize == 0)
                activeFilter = selektaImageManager.filterBucket(bucketId);
        }
        refreshView();
    };

    function refreshView(reset) {
        if (reset == true) {
            $("#bucket-container").empty();
        }
        var bucketSizes = selektaImageManager.getBucketQuantities();
        var totalImages = selektaImageManager.getTotalImages();
        var totalBucketized = 0;
        for (var i = 0; i < bucketSizes.length; i++) {
            $("#bucket-" + i + " .bucket-quantity").empty();
            if (activeFilter == undefined) {
                $("#bucket-" + i).css("color", "white");
            } else if (activeFilter == i) {
                $("#bucket-" + i).css("color", "white");
            } else {
                $("#bucket-" + i).css("color", "#222");
            }
            $("#bucket-" + i + " .bucket-quantity").append(bucketSizes[i]);
            totalBucketized += bucketSizes[i];
        }
        var bucketForImage = selektaImageManager.getBucketForCurrentImage();
        if (bucketForImage != undefined) {
            $("#bucket-" + bucketForImage[0]).css("color", "lightblue");
        }
        $("#total-images .bucket-quantity").empty();
        $("#total-images .bucket-quantity").append(totalBucketized + "/"
            + totalImages);
    };

    function bounceElement( elementId ) {
        $(elementId).addClass("animated bounce").one("webkitAnimationEnd",
            function() {
                $(elementId).removeClass("animated bounce");
            });
    };

    function toggleHelpWindow() {
        if (helpOpen) {
            bounceElement("#help-hover");
            $("#help-window").addClass("animated slideOutDown").one(
            "webkitAnimationEnd",
            function() {
                $("#help-window").removeClass("animated slideOutDown");
                $("#help-window").hide();
                helpOpen = false;
            });
        } else {
            bounceElement("#help-hover");
            $("#help-window").show();
            $("#help-window").addClass("animated slideInUp").one(
            "webkitAnimationEnd",
            function() {
                $("#help-window").removeClass("animated slideInUp");
                helpOpen = true;
            });
        }
    };

    function toggleImageName() {
        if (imageNameOpen) {
            $("#footer").addClass("animated slideOutDown").one(
                "webkitAnimationEnd",
                function() {
                    $("#footer").removeClass("animated slideOutDown");
                    $("#footer").hide();
                    imageNameOpen = false;
                });
        } else {
            $("#footer").show();
            $("#footer").addClass("animated slideInUp").one(
                "webkitAnimationEnd",
                function() {
                    $("#footer").removeClass("animated slideInUp");
                    imageNameOpen = true;
                });
        }
    };

    function openFolder(recursive, explicitFolder) {
        if (explicitFolder === undefined) {
            shiftPressed = false;
            dialog.showOpenDialog({
                properties: ["openDirectory"],
                title: "Select new image folder"
            }, function(imageDir) {
                if (imageDir === undefined)
                    return;
                selektaImageManager.setImageFolder(imageDir[0], recursive,
                    function(imageCount) {
                        if (imageCount <= 0)
                            notify("Folder does not contain any images");
                        else
                            refreshView(true);
                    });
            });
        } else {
            selektaImageManager.setImageFolder(
                explicitFolder, recursive, function(imageCount) {
                    if (imageCount <= 0)
                        notify("Folder does not contain any images");
                    else
                        refreshView(true);
                });
        }
    };

    function notify(message) {
        var pId = "notification-" + Date.now();
        $("#notification-box").prepend(
            "<p id=\""+pId+"\" class=\"notification animated zoomIn\">"
            + message+"</p>");
        $("#"+pId).one(
            "webkitAnimationEnd",
            function() {
                setTimeout(function() {
                    $("#"+pId).removeClass("zoomIn").
                    addClass("zoomOut").one("webkitAnimationEnd",
                        function() {
                            $("#"+pId).remove();
                        });
                }, 500);
            });
    };

    return {
        init: init
    };
}();

$(document).ready(function() {
    selektaCore.init();
});
