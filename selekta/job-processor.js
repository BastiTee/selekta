selektaJobProcessor = function () {
    "use strict";

    const backendBase = "selekta/ext";
    const path = require("path");
    const exec = require('child_process');
    const os = require("os");
    const fs = require("fs");
    const imsize = require("image-size");
    const mkdirp = require("mkdirp");
    const StringDecoder = require('string_decoder').StringDecoder;
    const decoder = new StringDecoder('utf8');

    var checkedForBackend = false;
    var backendPath = undefined;
    var convert = undefined;
    var identify = undefined;

    var jobQueue = Promise.resolve();
    var imageOrientationCache = {};

    /***************************************************************/

    var invokeConvertToThumbnailJob = function( imageSrc, imageTrg ) {

        try {
            fs.accessSync(imageTrg, fs.F_OK | fs.R_OK);
            var stat = fs.statSync(imageTrg);
            if (stat["size"] !== 0)
                return;
            console.log("existing thumb w size=" + stat["size"]);
        } catch (err) {
            console.log(err);
            // on non-existing or 0-byte files just continue..
        }

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
                    return newConvertToThumbnailPromise(
                        _imageSrc, _imageTrg, _opts);
                },
                function(err) {
                    console.log("ERR!!! " + err);
                }
            );
        })();
    };

    var invokeIdentifyOrientationJob = function( imageSrc ) {

        checkBackend();
        if (checkedForBackend && backendPath == undefined)
            return;

        (function(){
            var _imageSrc = imageSrc;
            jobQueue = jobQueue.then(
                function(result) {
                    return newIdentifyOrientationPromise(_imageSrc);
                },
                function(err) {
                    console.log("ERR!!! " + err);
                }
            );
        })();
    }

    var getOrientation = function ( imageSrc ) {

        // check cache
        var cachedOrientation = imageOrientationCache[imageSrc];
        if (cachedOrientation !== undefined) {
            // console.log("Returning orientation from cache: "
            // + cachedOrientation);
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

    /***************************************************************/

    return {
        invokeConvertToThumbnailJob: invokeConvertToThumbnailJob,
        invokeIdentifyOrientationJob: invokeIdentifyOrientationJob,
        getOrientation: getOrientation,
    };

    /***************************************************************/

    function newConvertToThumbnailPromise (imageSrc, imageTrg, opts) {
        return new Promise(function(resolve, reject) {
            // console.log("[JOB] THUMBN [BEG] :: [IN] "
                // + imageSrc + " [OUT] " + imageTrg);
            mkdirp(path.dirname(imageTrg), function(){
                exec.execFile(convert, opts, function() {
                    console.log("[JOB] THUMBN [END] :: [IN] "
                        + imageSrc + " [OUT] " + imageTrg);
                    resolve();
                });
            });
        });
    };

    function newIdentifyOrientationPromise (imageSrc) {
        return new Promise(function(resolve, reject) {
            // console.log("[JOB] ORIENT [BEG] :: [IN] " + imageSrc);
            var opts = ["-format", "'%[EXIF:Orientation]'", imageSrc];
            exec.execFile(identify, opts, function(err, data) {
                var orientation = undefined;
                if (data !== undefined) {
                    orientation = decoder.write(data).split("'").join("");
                }
                if (orientation == undefined ||orientation === "" ) {
                    orientation = 1;
                }
                console.log("[JOB] ORIENT [END] :: [IN] "
                    + imageSrc + " [ORI] " + orientation );
                imageOrientationCache[imageSrc] = orientation; // add to cache
                resolve();
            });
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
