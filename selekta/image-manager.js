selektaImageManager = function() {
    "use strict";

    const imsize = require("image-size");
    const walk = require("walk");
    const path = require("path");
    const fs = require("fs");

    const supportedFileSuffixes = new RegExp(".*\\.(jpg|jpeg|png|gif)$", "i");
    const maxBuckets = 9;

    var images = [];
    var buckets = [];
    var currImagePath = undefined;
    var currImageIdx = 0;
    var currBucketIdx = 0;
    var bucketFilter = undefined;
    var currWindowSize = undefined;

    /***************************************************************
     * PUBLIC                                                      *
     ***************************************************************/

    var init = function() {
        resetBuckets();
    };

    var setWindowSize = function(windowSize) {
        currWindowSize = windowSize;
    };

    var setImageFolder = function(rootFolder, recursive, cb) {
        if (rootFolder == undefined)
            return;
        // normalize folder string
        rootFolder = rootFolder.split(/[\\/]/).join("/") + "/";
        if (rootFolder.endsWith("/"))
            rootFolder = rootFolder.substring(0, rootFolder.length - 1);
        // store folder depth
        var rootSubDirs = rootFolder.split(/[\\/]/).length;

        images = [];
        var walker = walk.walk(rootFolder, {
            followLinks: false
        });
        walker.on("file", function(root, stat, next) {
            var rootd = root.split(/[\\/]/).length;
            var depth = rootd - rootSubDirs;
            if (stat.name.match(supportedFileSuffixes)) {
                if (recursive || depth === 0)
                    images.push(root + "/" + stat.name);
            }
            next();
        });
        walker.on("end", function() {
            if (images.length > 0) {
                setImage(0);
                resetBuckets();
            }
            if (typeof cb === "function") cb(images.length);
        });
    };

    var setFirstImage = function() {
        return setImage(-1);
    };

    var setLastImage = function() {
        return setImage(images.length);
    };

    var setPreviousImage = function() {
        return setImage(currImageIdx - 1);
    };

    var setNextImage = function() {
        return setImage(currImageIdx + 1);
    };

    var addCurrentImageToBucket = function(bucketId) {
        if (bucketId == undefined ||
            bucketId < 0 ||
            bucketId >= buckets.length) {
            return;
        }
        var foundInBucket = getBucketForCurrentImage();

        if (foundInBucket === undefined) {
            buckets[bucketId].push(currImagePath);
        } else {
            buckets[foundInBucket[0]].splice(foundInBucket[1], 1);
            if (foundInBucket[0] != bucketId)
                buckets[bucketId].push(currImagePath);
        }
        printBuckets();
    };

    var getBucketForCurrentImage = function() {
        for (var i = 0; i < buckets.length; i++) {
            for (j = 0; j < buckets[i].length; j++) {
                if (buckets[i][j] === currImagePath) {
                    return [i, j];
                }
            }
        }
        return undefined;
    };

    var clearBucket = function(bucketId) {
        if (bucketId == undefined ||
            bucketId < 0 ||
            bucketId >= buckets.length) {
            return;
        }
        buckets[bucketId] = [];
        printBuckets();
    };

    var getBucketQuantities = function() {
        var lengths = [];
        for (var i = 0; i < buckets.length; i++) {
            lengths.push(buckets[i].length);
        }
        return lengths;
    };

    var getTotalImages = function() {
        return images.length;
    };

    var getNextBucketIdx = function () {
        if (currBucketIdx == maxBuckets)
            return undefined;
        buckets[currBucketIdx] = [];
        currBucketIdx++;
        printBuckets();
        return currBucketIdx - 1;
    };

    var getCurrentBucketIdx = function () {
        return currBucketIdx - 1;
    };

    var filterBucket = function(bucketId) {
        if (bucketId == undefined ||
            bucketId < 0 ||
            bucketId >= buckets.length) {
            return;
        }

        if (bucketFilter == bucketId) {
            bucketFilter = undefined;
            return bucketFilter;
        }
        currImageBucketId = getBucketForCurrentImage();
        if (currImageBucketId !== undefined )
            currImageBucketId = currImageBucketId[0];

        bucketFilter = bucketId;
        if (currImageBucketId != bucketId)
            setImage(0);
        return bucketFilter;
    };

    var saveBuckets = function(targetFolder) {

        function handleBucket( bucket, bucketId ) {
            if (bucket.length == 0)
                return;
            var targetBucketFolder = path.join(targetFolder, bucketId.toString())
            fs.mkdir(targetBucketFolder, function() {
                for (i = 0; i < bucket.length; i++) {
                    var srcFilename = bucket[i].split(/[\\/]/).pop();
                    var targetPath = path.join(targetBucketFolder, srcFilename);
                    console.log(bucket[i] + " >> " + targetPath);
                    fs.createReadStream(bucket[i]).pipe(fs.createWriteStream(targetPath))
                }
            });
        }

        for (i = 0; i < buckets.length; i++) {
            handleBucket( buckets[i], i );
        }
    };

    return {
        init: init,
        setWindowSize: setWindowSize,
        setImageFolder: setImageFolder,
        setFirstImage: setFirstImage,
        setLastImage: setLastImage,
        setPreviousImage: setPreviousImage,
        setNextImage: setNextImage,
        addCurrentImageToBucket : addCurrentImageToBucket ,
        getBucketForCurrentImage: getBucketForCurrentImage,
        clearBucket: clearBucket,
        getBucketQuantities: getBucketQuantities,
        getTotalImages: getTotalImages,
        getNextBucketIdx: getNextBucketIdx,
        getCurrentBucketIdx: getCurrentBucketIdx,
        filterBucket: filterBucket,
        saveBuckets: saveBuckets
    };

    /***************************************************************
     * PRIVATE
     * Note to self: These functions need to be defined as
     * function <name> () { ... }
     * so that the signatures are available to all previous
     * functions due to hoisting. When using var <name> = function ..
     * this will not happen.
     ***************************************************************/

    function resetBuckets() {
        buckets = [];
        currBucketIdx = 0;
        bucketFilter = undefined;
        printBuckets();
    };

    function setImage(newImageIdx) {

        var imagePos = "ANY";
        var searchScope = images;
        if (bucketFilter != undefined)
            searchScope = buckets[bucketFilter];
        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            imagePos = "FIRST";
        } else if (currImageIdx >= searchScope.length) {
            imagePos = "LAST";
        }
        currImageIdx = currImageIdx > 0 ? currImageIdx < searchScope.length - 1 ?
            currImageIdx : searchScope.length - 1 : 0;
        currImagePath = searchScope[currImageIdx];

        $("#load-hover").show();
        imsize(currImagePath, function(e, dimensions) {
            $("#main-image").load(function() {
                $("#load-hover").hide();
            })
            getAspectRatio(dimensions.width, dimensions.height);
        });

        $("#main-image").attr("src", currImagePath);
        return imagePos;
    };

    function getAspectRatio(picHeight, picWidth) {
        var picRatio = picWidth / picHeight;
        var screenRatio = currWindowSize[0] / currWindowSize[1];

        if (picRatio < screenRatio) {
            $("#main-image").css({
                width: "100%",
                height: "auto",
                opacity: "1"
            });
        } else {
            $("#main-image").css({
                width: "auto",
                height: "100%",
                opacity: "1"
            });
        }
    };

    function showNotification(message) {
        if (message == undefined) return;
        notify(message);
    };

    function printBuckets() {
        return; // comment for development
        console.log("- BUCKETS ----------------------------");
        for (i = 0; i < buckets.length; i++) {
            console.log("  [B#" + (i + 1) + "]");
            for (j = 0; j < buckets[i].length; j++) {
                console.log("      [I#" + j + "] " +
                    buckets[i][j].split(/[\\/]/).pop());
            }
        }
    };

}();
