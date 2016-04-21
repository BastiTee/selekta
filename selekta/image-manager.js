selektaImageManager = function() {
    const imsize = require('image-size');
    const walk = require('walk');
    const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg)$', 'i');

    var imagePaths = [];
    var currImageIdx = 0;
    var currImagePath = '';
    var notify = undefined;
    var buckets = [];

    var init = function(notifyCallback) {
        notify = notifyCallback;
        resetBuckets();
    };

    var resetBuckets = function() {
        for (i = 0; i < 4; i++) {
            buckets[i] = [];
        }
    };

    var setRootFolder = function(rootFolder, windowSize, cb) {
        if (rootFolder == undefined) {
            return;
        }
        imagePaths = [];
        var walker = walk.walk(rootFolder, {
            followLinks: false
        });

        walker.on('file', function(root, stat, next) {
            if (stat.name.match(supportedFileSuffixes)) {
                imagePaths.push(root + '/' + stat.name);
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
        setImage(imagePaths.length, windowSize);
    };

    var setImage = function(newImageIdx, windowSize) {

        currImageIdx = newImageIdx;
        if (currImageIdx < 0) {
            showNotification('Reached first image');
        } else if (currImageIdx >= imagePaths.length) {
            showNotification('Reached last image');
        }
        currImageIdx = currImageIdx > 0 ? currImageIdx < imagePaths.length - 1 ?
            currImageIdx : imagePaths.length - 1 : 0;

        currImagePath = imagePaths[currImageIdx];

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

        console.log('BUCKET EVAL: ID=' + bucketId + ' IMG=' + currImagePath.split(/[\\/]/).pop() + ' INBUCKET=' + foundInBucket);

        if (foundInBucket === undefined) {
            buckets[bucketId].push(currImagePath);
        } else {
            buckets[foundInBucket[0]].splice(foundInBucket[1], 1);
            if (foundInBucket[0] != bucketId)
                buckets[bucketId].push(currImagePath);
        }

        // print for debugging
        for (i = 0; i < buckets.length; i++) {
            console.log('  [' + (i + 1) + ']');
            for (j = 0; j < buckets[i].length; j++) {
                console.log('      [' + j + '] ' + buckets[i][j]);
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
        return imagePaths.length;
    }

    function showNotification(message) {
        if (notify == undefined) return;
        if (message == undefined) return;
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
        getTotalImages: getTotalImages,
        getBucketForCurrentImage: getBucketForCurrentImage,
        init: init
    };

}();
