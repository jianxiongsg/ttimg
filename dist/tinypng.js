var URL = 'http://gswl.lovigame.com:7885';
var fs = require('fs');
var pathsys = require('path');
var md5 = require('md5');
var ttimg = require('ttimg');
const mkdirp = require('mkdirp');
var client = new ttimg.ImgUtilClient(URL);
var md5Ignore = '';
class PromiseQueue {
    constructor() {
        this.funcs = [];
    }
    add(func) {
        return new Promise(resolve => {
            const needStart = this.funcs.length === 0;
            const pfunc = () => {
                func(resolve);
                if (this.funcs.length > 0) {
                    this.funcs.shift();
                }
                this.next();
            };
            this.funcs.push(pfunc);
            if (needStart) {
                this.next();
            }
        });
    }
    next() {
        if (this.funcs.length === 0) {
            return;
        }
        const pfunc = this.funcs[0];
        pfunc();
    }
}
const queue = new PromiseQueue();
var allpath = 'dist/imgsname';
var TinyPng = function (content, path, cb) {
    if (path.endsWith('.png') || path.endsWith('.jpg')) {
        if (md5Ignore === md5(fs.readFileSync(path))) {
            cb(content);
            return;
        }
        client.tinypng(path).then(ret => {
            if (ret.err) {
                console.log('ret err', ret.err);
                cb(content);
            }
            else {
                cb(ret.file);
            }
        }, err => {
            console.log('err', err);
            cb(content);
        });
    }
    else {
        cb(content);
    }
};
module.exports = TinyPng;
