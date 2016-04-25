selektaImageManager = function() {
    const imsize = require('image-size');
    const walk = require('walk');
    const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg|png|gif)$', 'i');
    const maxBuckets = 9;

    var image = [];
    var buckets = [];
    var currImagePath = '';
    var currImageIdx = 0;
    var currBucketIdx = 0;
    var notify = undefined;

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
            setImage(0, windowSize);
            resetBuckets();
            cb();
        });
    };

    var setNextImage = function(windowSize) {
        setImage(currImageIdx + 1, windowSize);
    };

    var setPreviousImage = function(windowSize) {
        setImage(currImageIdx - 1, windowSize);
    };

    var setFirstImage = function(windowSize) {
        setImage(-1, windowSize);
    };

    var setLastImage = function(windowSize) {
        setImage(image.length, windowSize);
    };

    var setImage = function(newImageIdx, windowSize) {

        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            showNotification('Reached first image');
        } else if (currImageIdx >= image.length) {
            showNotification('Reached last image');
        }
        currImageIdx = currImageIdx > 0 ? currImageIdx < image.length - 1 ?
            currImageIdx : image.length - 1 : 0;

        currImagePath = image[currImageIdx];

        $('#load-hover').show();
        imsize(currImagePath, function(e, dimensions) {
            $('#main-image').load(function() {
                $('#load-hover').hide();
            })
            getAspectRatio(dimensions.width, dimensions.height, windowSize);
        });

        $('#main-image').attr("src", currImagePath);
    };

    function getAspectRatio(picHeight, picWidth, windowSize) {
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

    function getBucketQuantities() {
        lengths = [];
        for (i = 0; i < buckets.length; i++) {
            lengths.push(buckets[i].length);
        }
        return lengths;
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
        init: init
    };

}();
