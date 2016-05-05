selektaImageMagickWrapper = function () {
    "use strict";

    const backendBase = "selekta/ext";
    const path = require("path");
    const exec = require('child_process').execFile;
    const os = require("os");
    const imsize = require("image-size");

    var checkedForResizeBackend = false;
    var resizeBackendPath = undefined;

    var resizeImageToCopy = function( imageSrc, imageTrg ) {

        // check if we have a convert backend on this machine once
        if (!checkedForResizeBackend) {
            console.log("Platform: " + os.platform() + "-" + os.arch());
            if (os.platform() === "win32" &&
                (os.arch() === "x64" || os.arch() === "ia32")) {
                resizeBackendPath = path.join(backendBase,
                    "imagemagick-windows/convert.exe");
        } else {
            console.log("No resize backend for this platform present.")
        }
        checkedForResizeBackend = true;
    }

        // no resize backend present?
        if (checkedForResizeBackend && resizeBackendPath == undefined)
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
        var opts = [imageSrc, "-thumbnail",
        imageDimTrg.width + "x" + imageDimTrg.height, imageTrg];
        mkdirp(path.dirname(imageTrg), function() {
            exec(resizeBackendPath, opts, function(err, data) {
                console.log("convert [IN]  " + imageSrc + "[OUT] " + imageTrg);
            })
        });
    };

    return {
        resizeImageToCopy: resizeImageToCopy
    }

}();
