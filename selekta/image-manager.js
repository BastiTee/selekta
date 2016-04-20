selektaImageManager = function() {
    const imsize = require('image-size');
    const walk = require('walk');
    const supportedFileSuffixes = new RegExp('.*\\.(jpg|jpeg)$', 'i');

    var imagePaths = [];
    var currImageIdx = 0;
    var currImagePath = '';
    var notify = undefined;

    var init = function(notifyCallback) {
        notify = notifyCallback;
    };

    var setRootFolder = function(rootFolder, windowSize) {
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
    }

    function showNotification(message) {
        if (notify == undefined) return;
        if (message == undefined) return;
        notify(message);
    };

    return {
        init: init,
        setRootFolder: setRootFolder,
        setNextImage: setNextImage,
        setPreviousImage: setPreviousImage,
        setFirstImage: setFirstImage,
        setLastImage: setLastImage
    };

}();
