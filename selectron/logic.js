var walk = require('walk');
var files = [];
var cur_image_pt = 0;
var cur_image = '';

function init() {

    console.log(' will start walking ');
    // Walker options
    var walker = walk.walk('./images', {
        followLinks: false
    });

    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        files.push(root + '/' + stat.name);
        next();
    });

    walker.on('end', function() {
        console.log(files);
        next_image(0);
    });



    document.body.addEventListener("keydown", keyDown);

    function next_image (shift) {
      cur_image_pt = cur_image_pt + shift
      cur_image_pt = cur_image_pt > 0 ? cur_image_pt < files.length-1 ? cur_image_pt : files.length-1 : 0;
      cur_image = files[cur_image_pt];
      $('#main-image').attr("src", "." + cur_image);
      console.log(cur_image_pt + ' >>> ' + cur_image);

    }

    function keyDown(event) { // Stoping at SPACE pressed
        if (event.which == 39) {
            next_image(1);
        } else if (event.which == 37) {
            next_image(-1);
        }
    }

}
