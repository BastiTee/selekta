selektaImageManager = function() {
    "use strict";

    require("./im-wrapper.js");

    const imsize = require("image-size");
    const imload = require("imagesloaded");
    const walk = require("walk");
    const path = require("path");
    const fs = require("fs");
    const os = require("os");

    const supportedFileSuffixes = new RegExp(".*\\.(jpg|jpeg|png|gif)$", "i");
    const maxBuckets = 9;

    var images = [];
    var buckets = [];
    var currRootFolder = undefined;
    var currImagePath = undefined;
    var currImageDivId = undefined;
    var currImageOrientation = undefined;
    var currImageIdx = 0;
    var currBucketIdx = 0;
    var bucketFilter = undefined;
    var currWindowSize = undefined;
    var tmpFolder = undefined;


    /***************************************************************
     * PUBLIC                                                      *
     ***************************************************************/

    var init = function() {
        resetBuckets();
    };

    var setWindowSize = function(windowSize) {
        currWindowSize = windowSize;
        var widHei = getImageWidthHeight(currImagePath, currImageDivId,
            currImageOrientation);
        $("#"+currImageDivId).css({width:widHei[0], height:widHei[1]});
    };

    var setImageFolder = function(rootFolder, recursive, cb) {
        if (rootFolder == undefined)
            return;
        // normalize folder string
        rootFolder = normalize(rootFolder) + "/";
        if (rootFolder.endsWith("/"))
            rootFolder = rootFolder.substring(0, rootFolder.length - 1);
        // store folder depth
        currRootFolder = rootFolder;
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
                    images.push(normalize(root) + "/" + stat.name);
            }
            next();
        });
        walker.on("end", function() {
            if (images.length > 0) {
                var tmpSubdir = currRootFolder.replace(/[^a-zA-Z0-9]+/g, "_");
                tmpFolder = path.join(os.tmpDir(), "selekta_tmp", tmpSubdir);
                generateThumbnails();
                resetBuckets();
                setImage(0);
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
            for (var j = 0; j < buckets[i].length; j++) {
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
        var currImageBucketId = getBucketForCurrentImage();
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
            var targetBucketFolder = path.join(targetFolder,
                "selekta_0" + (bucketId + 1).toString())
            fs.mkdir(targetBucketFolder, function() {
                for (var i = 0; i < bucket.length; i++) {
                    var srcFilename = bucket[i].split(/[\\/]/).pop();
                    var targetPath = path.join(
                        targetBucketFolder, srcFilename);
                    console.log(bucket[i] + " >> " + targetPath);
                    fs.createReadStream(bucket[i]).pipe(
                        fs.createWriteStream(targetPath))
                }
            });
        }
        for (var i = 0; i < buckets.length; i++) {
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

        $("#load-hover").show(0);

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
        currImageIdx = ( currImageIdx > 0 ?
            currImageIdx < searchScope.length - 1 ?
            currImageIdx : searchScope.length - 1 : 0 );
        currImagePath = searchScope[currImageIdx];

        var imageName = currImagePath.split(/[\\/]/).pop();
        $("#image-name").text(imageName);

        currImageOrientation = selektaImageMagickWrapper.getOrientation(
            currImagePath);

        var currThumbPath = checkForThumbnail(currImagePath);
        if (currThumbPath === undefined) {
            console.log("[IMG] " + currImagePath);
            // if no thumbnail available, then load full image immediately
            addImageDiv(currImagePath, function() {
                $("#load-hover").hide();
            });
        } else {
            console.log("[THU] " + currThumbPath);
            // if thumbnail available, load it before loading full image
            addImageDiv(currThumbPath, function() {
                console.log("[IMG] " + currImagePath);
                addImageDiv(currImagePath, function() {
                    $("#load-hover").hide();
                });
            });
        };
        return imagePos;
    };

    function addImageDiv(imagePath, cb) {

        var img = selektaImageProcessor.makeThumb(imagePath);

        cb = (typeof cb === "function" ) ? cb : function() {};
        var lastImageDivId = currImageDivId;
        currImageDivId = "mi-" + (new Date).getTime();
        var imSize = getImageWidthHeight(imagePath, currImageDivId,
            currImageOrientation);
        var style = ( imSize == undefined ? "" :
            "style=\"width:" + imSize[0] + ";height:"+imSize[1]+";\"" );
        $("#image-container").append(
            "<img id=\""+currImageDivId+"\" class=\"main-image\" src=\""
            + imagePath + "\" "+style+" />");
        imload($("#"+currImageDivId), function() {
            if (lastImageDivId !== undefined) {
                $("#"+lastImageDivId).remove();
            };
            if (currImageOrientation !== undefined) {
                var degrees = selektaImageMagickWrapper.getDegreesForOrientation(
                                        currImageOrientation);
                console.log("rotating image >> ori=" + currImageOrientation
                    + " deg=" + degrees);
            };
            $("#" + currImageDivId).css({opacity: "1"});
            cb();
        });
    };

    function getImageWidthHeight(imagePath, imageDivId, orientation) {
        if (imagePath == undefined)
            return [ "100%", "auto" ];
        var dim = imsize(imagePath);
        var picRatio = dim.width / dim.height;
        var screenRatio = currWindowSize[0] / currWindowSize[1];
        if (picRatio > screenRatio) {
            return [ "100%", "auto" ];
        } else {
            return [ "auto", "100%" ];
        }
    };

    function checkForThumbnail(imagePath) {
        var thumbPath = getThumbnailPathForImage(imagePath);
        try {
            fs.accessSync(thumbPath, fs.F_OK | fs.R_OK);
            // make sure we don't run in 0-byte files
            var stat = fs.statSync(thumbPath);
            if (stat["size"] !== undefined && stat["size"] === 0)
                return undefined;
            return thumbPath;
        } catch (err) {
            return undefined;
        }
    };

    function generateThumbnails() {
        for (var i = 0; i < images.length; i++) {
            var imageSrc = images[i];
            var imageTrg = getThumbnailPathForImage(imageSrc);
            try {
                fs.accessSync(imageTrg, fs.F_OK | fs.R_OK);
                // make sure we don't run in 0-byte files
                var stat = fs.statSync(imageTrg);
                if (stat["size"] === 0)
                    selektaImageMagickWrapper.createThumbnail(
                        imageSrc, imageTrg);
            } catch (err) {
                // console.log("[THU] [NEW] " + imageTrg);
                selektaImageMagickWrapper.createThumbnail(
                    imageSrc, imageTrg);
            }
        }
    };

    function getThumbnailPathForImage ( imageSrc ) {
        var imageSrcRel = imageSrc.replace(currRootFolder, "");
        var imageTrg = path.join(tmpFolder, imageSrcRel);
        return imageTrg;
    };

    function showNotification(message) {
        if (message == undefined) return;
        notify(message);
    };

    function normalize(path) {
        if (path == undefined)
            return path;
        return path.split(/[\\/]/).join("/");
    };

    function printBuckets() {
        return; // comment for development
        console.log("- BUCKETS ----------------------------");
        for (var i = 0; i < buckets.length; i++) {
            console.log("  [B#" + (i + 1) + "]");
            for (var j = 0; j < buckets[i].length; j++) {
                console.log("      [I#" + j + "] " +
                    buckets[i][j].split(/[\\/]/).pop());
            }
        }
    };

}();
