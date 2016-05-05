const walk = require("walk");
const path = require("path");
const exec = require('child_process').execFileSync;
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

var ifolder = process.argv[2];
var walker = walk.walk(ifolder, {
    followLinks: false
});
walker.on("file", function(root, stat, next) {
    if (!stat.name.endsWith(".jpg")) {
        next();
        return;
    }
    var imageSrc = path.join(root, stat.name);
    console.log("--- " + imageSrc);
    var opts = ["-format", "'%[EXIF:Orientation]'", imageSrc];

    var data = exec("selekta/ext/imagemagick-windows/identify.exe", opts);
    console.log(decoder.write(data));

    next();
});
