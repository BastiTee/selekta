selektaJobProcessor = function () {
    "use strict";

    const path = require("path");
    const fs = require("fs");
    const os = require("os");
    const exec = require('child_process');
    const imsize = require("image-size");
    const mkdirp = require("mkdirp");
    const ExifImage = require('exif').ExifImage;
    const StringDecoder = require('string_decoder').StringDecoder;
    const decoder = new StringDecoder('utf8');

    var checkedForBackend = false;
    const backendBase = "selekta/ext";
    var backendPath = undefined;
    var convert = undefined;

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
            // on non-existing or 0-byte files just continue..
            // console.log(err);
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

        // add to job queue
        (function(){
            var _imageSrc = imageSrc;
            var _imageTrg = imageTrg;
            var _width = imageDimTrg.width;
            var _height = imageDimTrg.height;
            jobQueue = jobQueue.then(
                function(result) {
                    return newConvertToThumbnailPromise(
                        _imageSrc, _imageTrg, _width, _height);
                },
                function(err) {
                    console.log("ERR!!! " + err);
                }
            );
        })();
    };

    var invokeIdentifyOrientationJob = function( imageSrc ) {

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

    var getOrientation = function ( imageSrc, cb ) {
        cb = (typeof cb === "function") ? cb : new function() {};

        // check cache
        var cachedOrientation = imageOrientationCache[imageSrc];
        if (cachedOrientation !== undefined) {
            console.log("Returning orientation from cache: "
                + cachedOrientation);
            cb(cachedOrientation);
            return;
        }

        var exifImage = new ExifImage({ image : imageSrc },
            function (error, exifData) {
                if (error) cb(undefined);
                if (exifData === undefined ||
                    exifData.image === undefined ||
                    exifData.image.Orientation === undefined)
                    return cb(undefined);
                cb(exifData.image.Orientation);
        });
    };

    /***************************************************************/

    return {
        invokeConvertToThumbnailJob: invokeConvertToThumbnailJob,
        invokeIdentifyOrientationJob: invokeIdentifyOrientationJob,
        getOrientation: getOrientation,
    };


    /***************************************************************/

    function newConvertToThumbnailPromise (imageSrc, imageTrg,
        width, height) {
        return new Promise(function(resolve, reject) {
            var opts = ([imageSrc, "-thumbnail",
                width + "x" + height, imageTrg]);
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
            var exifImage = new ExifImage({ image : imageSrc },
                function (error, exifData) {
                    var orientation = undefined;
                    if (exifData === undefined ||
                        exifData.image === undefined ||
                        exifData.image.Orientation === undefined) {
                        orientation === undefined;
                    } else {
                        orientation = exifData.image.Orientation;
                    }
                    console.log("[JOB] ORIENT [END] :: [IN] "
                    + imageSrc + " [ORI] " + orientation );
                    imageOrientationCache[imageSrc] = orientation;
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
        } else {
            console.log("No resize backend for this platform present.")
        }
        checkedForBackend = true;
    }
};

}();
