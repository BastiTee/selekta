selektaImageManager = function() {
    const imsize = require('image-size');
    const walk = require('walk');
    const path = require('path');
    const fs = require('fs');
    const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg|png|gif)$', 'i');
    const maxBuckets = 9;

    var image = [];
    var buckets = [];
    var currImagePath = '';
    var currImageIdx = 0;
    var currBucketIdx = 0;
    var bucketFilter = undefined;
    var notify = undefined;
    var currWindowSize = undefined;


    var init = function(notifyCallback) {
        notify = notifyCallback;
        resetBuckets();
    };

    var resetBuckets = function() {
        buckets = [];
        currBucketIdx = 0;
        printBuckets();
    };

    var clearBucket = function(bucketId) {
        if (bucketId == undefined)
            return;
        buckets[bucketId] = [];
        printBuckets();
    }

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
    }

    var setRootFolder = function(rootFolder, windowSize, cb) {
        currWindowSize = windowSize;
        if (rootFolder == undefined) {
            return;
        }
        image = [];
        var walker = walk.walk(rootFolder, {
            followLinks: false
        });

        walker.on('file', function(root, stat, next) {
            if (stat.name.match(supportedFileSuffixes)) {
                image.push(root + '/' + stat.name);
            }
            next();
        });
        walker.on('end', function() {
            setImage(0);
            resetBuckets();
            cb();
        });
    };

    var setNextImage = function(windowSize) {
        currWindowSize = windowSize;
        setImage(currImageIdx + 1);
    };

    var setPreviousImage = function(windowSize) {
        currWindowSize = windowSize;
        setImage(currImageIdx - 1);
    };

    var setFirstImage = function(windowSize) {
        currWindowSize = windowSize;
        setImage(-1);
    };

    var setLastImage = function(windowSize) {
        currWindowSize = windowSize;
        setImage(image.length);
    };

    var setImage = function(newImageIdx) {

        searchScope = image;
        if (bucketFilter != undefined)
            searchScope = buckets[bucketFilter];
        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            showNotification('Reached first image');
        } else if (currImageIdx >= searchScope.length) {
            showNotification('Reached last image');
        }
        currImageIdx = currImageIdx > 0 ? currImageIdx < searchScope.length - 1 ?
            currImageIdx : searchScope.length - 1 : 0;

        currImagePath = searchScope[currImageIdx];

        $('#load-hover').show();
        imsize(currImagePath, function(e, dimensions) {
            $('#main-image').load(function() {
                $('#load-hover').hide();
            })
            getAspectRatio(dimensions.width, dimensions.height);
        });

        $('#main-image').attr("src", currImagePath);
    };

    function getAspectRatio(picHeight, picWidth) {
        var picRatio = picWidth / picHeight;
        var screenRatio = currWindowSize[0] / currWindowSize[1];

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

    function evaluateBucketCall(bucketId) {

        if (bucketId >= buckets.length)
            return;

        // check if the image is contained in any of the buckets and remove if yes
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

    function printBuckets() {
        console.log('- BUCKETS ----------------------------');
        for (i = 0; i < buckets.length; i++) {
            console.log('  [B#' + (i + 1) + ']');
            for (j = 0; j < buckets[i].length; j++) {
                console.log('      [I#' + j + '] ' + buckets[i][j].split(/[\\/]/).pop());
            }
        }
    };

    function filterBucket(bucketId) {
        console.log("received filter call for #" + bucketId);
        if (bucketId >= buckets.length) {
            notify("Bucket not created yet");
            return bucketFilter;
        }
        if (bucketFilter == bucketId) {
            notify("Bucket filter disabled");
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

    function getBucketQuantities() {
        lengths = [];
        for (i = 0; i < buckets.length; i++) {
            lengths.push(buckets[i].length);
        }
        return lengths;
    };

    function saveBuckets(targetFolder, callback) {
        console.log(targetFolder);

        for (i = 0; i < buckets.length; i++) {
            if (buckets[i].length == 0)
                continue;

            for (j = 0; j < buckets[i].length; j++) {
                var srcFile = buckets[i][j];
                var filename = srcFile.split(/[\\/]/).pop();
                var targetDir = path.join(targetFolder, i.toString());
                fs.mkdir(targetDir, function(srcFile) {
                    var targetPath = path.join(targetDir, filename);
                    fs.createReadStream(srcFile).pipe(
                        fs.createWriteStream(targetPath));
                    console.log(">>> " + targetPath);
                });

            }

//


        }
    };

    function getTotalImages() {
        return image.length;
    }

    function showNotification(message) {
        if (message == undefined) return;
        if (typeof notify === 'function')
            notify(message);
    };

    return {
        setRootFolder: setRootFolder,
        setNextImage: setNextImage,
        setPreviousImage: setPreviousImage,
        setFirstImage: setFirstImage,
        setLastImage: setLastImage,
        evaluateBucketCall: evaluateBucketCall,
        getBucketQuantities: getBucketQuantities,
        getBucketForCurrentImage: getBucketForCurrentImage,
        clearBucket: clearBucket,
        getTotalImages: getTotalImages,
        getNextBucketIdx: getNextBucketIdx,
        getCurrentBucketIdx: getCurrentBucketIdx,
        filterBucket: filterBucket,
        saveBuckets: saveBuckets,
        init: init
    };

}();
