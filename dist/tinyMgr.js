let fs = require("fs");
let path = require('path');
let cv = require('./convert');
let srcFolder = 'C:/Users/admin/Desktop/2019天猫11/test';
function start() {
    var args = process.argv.splice(2);
    cv.tinyImgWithPath(args[0]);
}
start();
