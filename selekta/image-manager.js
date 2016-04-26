selektaImageManager = function() {
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

    var notifyCallback = undefined;

    /***************************************************************
     * PUBLIC                                                      *
     ***************************************************************/

    var init = function(cb) {
        notifyCallback = cb;
        resetBuckets();
    };

    var setWindowSize = function(windowSize) {
        currWindowSize = windowSize;
    };

    var setImageFolder = function(rootFolder, cb) {
        if (rootFolder == undefined)
            return;
        images = [];
        var walker = walk.walk(rootFolder, {
            followLinks: false
        });

        walker.on("file", function(root, stat, next) {
            if (stat.name.match(supportedFileSuffixes)) {
                images.push(root + "/" + stat.name);
            }
            next();
        });
        walker.on("end", function() {
            setImage(0);
            resetBuckets();
            if (typeof cb === "function" ) cb();
        });
    };

    var setFirstImage = function() {
        setImage(-1);
    };

    var setLastImage = function() {
        setImage(images.length);
    };

    var setPreviousImage = function() {
        setImage(currImageIdx - 1);
    };

    var setNextImage = function() {
        setImage(currImageIdx + 1);
    };

    function addCurrentImageToBucket (bucketId) {
        if (bucketId == undefined ||
            bucketId < 0 ||
            bucketId >= buckets.length) {
            notifyCallback("Bucket does not exist");
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

    function getBucketForCurrentImage() {
        for (i = 0; i < buckets.length; i++) {
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
            notifyCallback("Bucket does not exist");
            return;
        }
        buckets[bucketId] = [];
        printBuckets();
    }


    function getBucketQuantities() {
        lengths = [];
        for (i = 0; i < buckets.length; i++) {
            lengths.push(buckets[i].length);
        }
        return lengths;
    };

    function getTotalImages() {
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

    function filterBucket(bucketId) {
        if (bucketId == undefined ||
            bucketId < 0 ||
            bucketId >= buckets.length) {
            notifyCallback("Bucket does not exist");
            return;
        }

        if (bucketFilter == bucketId) {
            notifyCallback("Bucket filter disabled");
            bucketFilter = undefined;
            return bucketFilter;
        }
        currImageBucketId = getBucketForCurrentImage()[0];
        bucketFilter = bucketId;
        if (currImageBucketId != bucketId)
            setImage(0);
        console.log("curr image:" + currImageBucketId)
        return bucketFilter;
    }

    function saveBuckets(targetFolder, callback) {

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
        notifyCallback("Writing buckets to folder was successful");
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

        searchScope = images;
        if (bucketFilter != undefined)
            searchScope = buckets[bucketFilter];
        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            showNotification("Reached first image");
        } else if (currImageIdx >= searchScope.length) {
            showNotification("Reached last image");
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
        if (typeof notifyCallback === "function")
            notifyCallback(message);
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
