selektaImageMagickWrapper = function () {
    "use strict";

    const backendBase = "selekta/ext";
    const path = require("path");
    const exec = require('child_process');
    const os = require("os");
    const imsize = require("image-size");
    const mkdirp = require("mkdirp");
    const StringDecoder = require('string_decoder').StringDecoder;
    const decoder = new StringDecoder('utf8');

    var checkedForBackend = false;
    var backendPath = undefined;
    var convert = undefined;
    var identify = undefined;

    var jobQueue = Promise.resolve();
    var imageOrientations = {};

    /***************************************************************/

    var createThumbnail = function( imageSrc, imageTrg ) {

        checkBackend();
        if (checkedForBackend && backendPath == undefined)
            return;

        var imageDimSrc = imsize(imageSrc);
        var imageDimTrg = {};
        var maxDim = 500; // decide for image thumb size
        var longSide = Math.max(imageDimSrc.width, imageDimSrc.height);
        var longSideWidth = longSide === imageDimSrc.width ? true : false;
        if (longSideWidth) {
            imageDimTrg.width = maxDim;
            imageDimTrg.height = (Math.round((maxDim / imageDimSrc.width)
                * imageDimSrc.height));
        } else {
            imageDimTrg.height = maxDim;
            imageDimTrg.width = (Math.round((maxDim / imageDimSrc.height)
                * imageDimSrc.width));
        }
        var opts = ([imageSrc, "-thumbnail",
        imageDimTrg.width + "x" + imageDimTrg.height, imageTrg]);
        // create new element for job queue
        (function(){
            var _imageSrc = imageSrc;
            var _imageTrg = imageTrg;
            var _opts = opts;
            jobQueue = jobQueue.then(
                function(result) {
                    return newThumbnailCreationJob(
                        _imageSrc, _imageTrg, _opts);
                },
                function(err) {
                    console.log("ERR!!! " + err);
                }
            );
            jobQueue = jobQueue.then(
                function(result) {
                    return newGetOrientationJob(_imageSrc);
                },
                function(err) {
                    console.log("ERR!!! " + err);
                }
            );
        })();
    };

    var getOrientation = function ( imageSrc ) {

        // check cache
        var cachedOrientation = imageOrientations[imageSrc];
        if (cachedOrientation !== undefined) {
            console.log("Returning orientation from cache: "
                + cachedOrientation);
            return cachedOrientation
        }

        checkBackend();
        if (checkedForBackend && backendPath == undefined)
            return;

        var opts = ["-format", "'%[EXIF:Orientation]'", imageSrc];
        var data = exec.execFileSync(identify, opts);
        var orientation = decoder.write(data).split("'").join("");
        if (orientation == undefined ||orientation === "" )
            return 1;
        else
            return orientation;
    };

    var getDegreesForOrientation = function( orientation ) {

        // TODO
        return orientation;
    };

    /***************************************************************/

    return {
        createThumbnail: createThumbnail,
        getOrientation: getOrientation,
        getDegreesForOrientation: getDegreesForOrientation
    };

    /***************************************************************/

    function newThumbnailCreationJob (imageSrc, imageTrg, opts) {
        return new Promise(function(resolve, reject) {
            console.log("[JOB] THUMBN [BEG] :: [IN] "
                + imageSrc + "[OUT] " + imageTrg);
            mkdirp(path.dirname(imageTrg), function(){
                exec.execFile(convert, opts, function() {
                    console.log("[JOB] THUMBN [END] :: [IN] "
                        + imageSrc + "[OUT] " + imageTrg);
                    resolve();
                });
            });
        });
    };

    function newGetOrientationJob (imageSrc) {
        return new Promise(function(resolve, reject) {
            console.log("[JOB] ORIENT [BEG] :: [IN] " + imageSrc);
            var or = getOrientation(imageSrc);
            if (or !== undefined) {
                imageOrientations[imageSrc] = or;
            }
            console.log("[JOB] ORIENT [END] :: [IN] "
                        + imageSrc + " [ORI] " + or);
            resolve();
        });
    };

    function checkBackend () {
        if (!checkedForBackend) {
            console.log("Platform: " + os.platform() + "-" + os.arch());
            if (os.platform() === "win32" &&
                (os.arch() === "x64" || os.arch() === "ia32")) {
                backendPath = path.join(backendBase,
                    "imagemagick-windows");
                convert = path.join(backendPath, "convert.exe");
                identify = path.join(backendPath, "identify.exe");
            } else {
                console.log("No resize backend for this platform present.")
            }
            checkedForBackend = true;
        }
    };

}();
