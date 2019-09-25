

var imgsize =require("image-size");
var sharp =require("sharp");
var fs = require("fs");
var path = require('path');
var TinyPng = require("./tinypng");

let FileType = {
    IMAGE:"IMAGE",
    DRAGONBONE:"DRAGONBONE",
    SPRITE_ANIMATION:"SPRITE_ANIMATION"
}
//params:Array<{scale:number,toFolder:string}> | {scale:number,toFolder:string};

function convertRes(src){
    if (!fs.existsSync(src)) {
        return;
    }
    let obj = JSON.parse(fs.readFileSync(src,'utf-8'));
    let files = obj.files;
    let toPath;
    obj.types.map((tp)=>{
        deleteFolder(tp.folder);
        files.map((file)=>{
            let imagename = convertFileName(file.src.image,"-");
            if(file.type === FileType.DRAGONBONE){
                let texname = convertFileName(file.src.tex,"-");
                let skename = convertFileName(file.src.ske,"-");
                resizeImg(path.resolve(obj.srcFolder,file.src.image),path.resolve(tp.folder),file.scale[tp.type],imagename,file.tinypng);
                resizeTexJson(path.resolve(obj.srcFolder,file.src.tex),path.resolve(tp.folder),file.scale[tp.type],texname,imagename);
                resizeSkeJson(path.resolve(obj.srcFolder,file.src.ske),path.resolve(tp.folder),file.scale[tp.type],skename);
            }else if(file.type === FileType.SPRITE_ANIMATION){
                let jsonname = convertFileName(file.src.json,"-");
                resizeImg(path.resolve(obj.srcFolder,file.src.image),path.resolve(tp.folder),file.scale[tp.type],imagename,file.tinypng);
                resizeJson(path.resolve(obj.srcFolder,file.src.json),path.resolve(tp.folder),file.scale[tp.type],jsonname,imagename);
            }else if(file.type === FileType.IMAGE){
                resizeImg(path.resolve(obj.srcFolder,file.src.image),path.resolve(tp.folder),file.scale[tp.type],imagename,file.tinypng);
            }
        })    
    })
    
}

function tinyImgWithPath(srcFolder){
    if (!fs.existsSync(srcFolder)) {
        return;
    }
    function finder(filepath) {
        let files=fs.readdirSync(filepath);
        
        files.forEach((val,index) => {
            var fPath=path.join(filepath,val);
            var stats=fs.statSync(fPath);
            
            if(stats.isDirectory()){
                finder(fPath);
            };
            if(stats.isFile()){
                let extname = path.extname(val);
                if(extname === ".png" || extname === ".jpg"){
                    tinyImg(fPath);
                }
            };
        });

    }
    finder(srcFolder);
}

function deleteFolder(filepath) {
    var files = [];
    if(fs.existsSync(filepath) ) {
        files = fs.readdirSync(filepath);
        files.forEach(function(file,index){
            var curPath = filepath + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolder(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(filepath);
    }
}

function convertFileName(file,joinstr){
    
    let filename = file.replace(eval(/[(\/)(\\)]/g),"-");
    let arr = filename.split("-");
    if(arr[0] === "." || arr[0]==="-" || arr[0]===""){
        arr.shift();
    }
    return arr.join(joinstr);
}
// function convertRes(srcFolder,params){
//     if(params instanceof Array){
//         for(let i=0;i < params.length;++i){
//             demote(srcFolder,params[i]);
//         }
//         return;
//     }
//     if(params instanceof Object){
//         demote(srcFolder,params);
//     }
// }

function mkdirsSync(dirname){
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

module.exports = {
    FileType:FileType,
    convertRes:convertRes,
    mkdirsSync:mkdirsSync,
    getFileName:getFileName,
    convertFileName:convertFileName,
    getfileNameNoSuffix:getfileNameNoSuffix,
    tinyImgWithPath:tinyImgWithPath
}


function demote(srcFolder,param){
    console.log(param);
    if(!param.scale || !param.toFolder){
        console.error("请传入正确的参数");
        return;
    }
    let scale = param.scale;
    let toFolder = param.toFolder;
    if (!fs.existsSync(toFolder)) {
        mkdirsSync(toFolder);
    }
    function finder(filepath) {
        let files=fs.readdirSync(filepath);
        let toPath = path.join(toFolder,filepath.slice(srcFolder.length));
        if (!fs.existsSync(toPath)) {
            mkdirsSync(toPath);
        }
        files.forEach((val,index) => {
            var fPath=path.join(filepath,val);
            var stats=fs.statSync(fPath);
            if(stats.isDirectory()){
                finder(fPath);
            };
            if(stats.isFile()){
                let filename = getFileName(fPath);
                let extname = path.extname(filename);
                if(extname === ".png"){
                    resizeImg(fPath,toPath,scale);
                }
                if(extname === ".json"){
                    if(filename.indexOf("tex") !== -1){
                        resizeTexJson(fPath,toPath,scale);
                    }else if(filename.indexOf("ske") !== -1){
                        resizeSkeJson(fPath,toPath,scale);
                    }else{
                        resizeJson(fPath,toPath,scale);
                    }
                }
            };
        });

    }
    finder(srcFolder);
}
   

// convertRes("E:/game_demo/tm11main/src/assets",{scale:0.75,toFolder:"./anim/assets0.75"});

// function getfileNameNoSuffix(filename){
//     var rgExp=/(.*\/)*([^.]+).*/ig;
//     var id=filename.match(rgExp);
//     return id;
// }

function getfileNameNoSuffix(filename){
    let name = getFileName(filename);
    let pos = name.lastIndexOf('.');
    if(pos<0){
        return name
    }
    return name.substring(0,pos);
}

function getFileName(path){
    var pos1 = path.lastIndexOf('/');
    var pos2 = path.lastIndexOf('\\');
    var pos  = Math.max(pos1, pos2)
    if( pos<0 )
    return path;
    else
    return path.substring(pos+1);
}


//压缩帧动画
function convertFrameAnim(jsonpath,imgpath,toPath,scale){
    // console.log(anim);
    if (!fs.existsSync(toPath)) {
        mkdirsSync(toPath);
    }
    resizeImg(imgpath,toPath,scale);
    resizeJson(jsonpath,toPath,scale);
}

//压缩龙骨动画
function convertSkeAnim(skeJsonPath,texJsonPath,texImgPath,toPath,scale){
    if (!fs.existsSync(toPath)) {
        mkdirsSync(toPath);
    }
    resizeImg(texImgPath,toPath,scale);
    resizeSkeJson(skeJsonPath,toPath,scale);
    resizeTexJson(texJsonPath,toPath,scale);
}


 function resizeSkeJson(src, dst, scale,filename){
    if (!fs.existsSync(dst)) {
        mkdirsSync(dst);
    }
        fs.readFile(src,'utf-8', function(err,str){
            obj = JSON.parse(str);
            let armatures= obj.armature;
            for(let i=0;i<armatures.length;++i){
                let aabb = armatures[i].aabb;
                aabb.width *= scale;
                aabb.height *= scale;
                aabb.x *= scale;
                aabb.y *= scale;
                updateSkeAnimaions(armatures[i].animation,scale);
                updateSkeBone(armatures[i].bone,scale);
                updateSkeSkins(armatures[i].skin,scale);
            }

            let objStr = JSON.stringify(obj);
            let toPath = path.resolve(dst,filename || getFileName(src));
            // 写入文件
            fs.writeFile(toPath, objStr,function(err){
                if(!err){
                    console.log("文件写入成功",toPath);
                }else{
                    console.error("文件写入失败",err);
                }
            });
        })
}

function updateSkeBone(bones,scale){
    for(let i=0;i<bones.length;++i){
        let transform = bones[i].transform;
        if(bones[i].name === "root"){
            transform.scX = transform.scX?transform.scX * 1/scale:1/scale;
            transform.scY = transform.scY?transform.scY * 1/scale:1/scale;
        }
            if(bones[i].length){
                bones[i].length =Math.ceil(bones[i].length * scale); 
            }
            if(transform.x){
                transform.x *= scale;
            }
            if(transform.y){
                transform.y *= scale;
            }
        
    }
    return bones;
}

function updateSkeAnimaions(animations,scale){
    // scale = scale;
    for(let i=0;i<animations.length;++i){
        let bones = animations[i].bone;
        for(let j=0;j<bones.length;++j){
            let translateFrame = bones[j].translateFrame;
            translateFrame.forEach((tf)=>{
                if(tf.x) tf.x *= scale;
                if(tf.y) tf.y *= scale;
            })
        }
    }
    return animations;
}

function updateSkeSkins(skins,scale){
    for(let i=0;i<skins.length;++i){
        let slots = skins[i].slot;
        slots.forEach((s)=>{
            let display = s.display;
           display.forEach((d)=>{
            if(d.transform.x){
                d.transform.x *= scale;
            }
            if(d.transform.y){
                d.transform.y *= scale;
            }
           })
        })
    }
    return skins;
}


function resizeTexJson(src, dst, scale,filename,imagename){
    if (!fs.existsSync(dst)) {
        mkdirsSync(dst);
    }
        fs.readFile(src,'utf-8', function(err,str){
            obj=JSON.parse(str);
            obj.width = Math.ceil(obj.width * scale);
            obj.height = Math.ceil(obj.height * scale);
            let subTextures = obj.SubTexture; 
            for(let i=0;i<subTextures.length;++i){
                subTextures[i].width *= scale;
                subTextures[i].height *= scale;
                subTextures[i].x *= scale;
                subTextures[i].y *= scale;
            }
            if(imagename) obj.imagePath = imagename;
            
            var objStr = JSON.stringify(obj);
            let toPath = path.resolve(dst,filename || getFileName(src));
            // 写入文件
            fs.writeFile(toPath, objStr,function(err){
                if(!err){
                    console.log("文件写入成功",toPath);
                }else{
                    console.error("文件写入失败",err);
                }
            });
        })
}

function resizeJson(src, dst, scale,filename,imagename){
    if (!fs.existsSync(dst)) {
        mkdirsSync(dst);
    }
    fs.readFile(src,'utf-8', function(err,str){
        obj=JSON.parse(str);
        let meta = obj.meta;
        let frames = obj.frames; 
        meta.size = {w:meta.size.w * scale,h:meta.size.h*scale}
        for(let n in frames){
            frames[n].frame.x *= scale;
            frames[n].frame.y *= scale;
            frames[n].frame.w *= scale;
            frames[n].frame.h *= scale;

            frames[n].spriteSourceSize.x *= scale;
            frames[n].spriteSourceSize.y *= scale;
            frames[n].spriteSourceSize.w *= scale;
            frames[n].spriteSourceSize.h *= scale;

            frames[n].sourceSize.w *= scale;
            frames[n].sourceSize.h *= scale;
        }
        if(imagename) obj.meta.imagePath = imagename;
        var objStr = JSON.stringify(obj);
        let toPath = path.resolve(dst,filename || getFileName(src));
        // 写入文件
        fs.writeFile(toPath, objStr,function(err){
            if(!err){
                console.log("文件写入成功",toPath);
            }else{
                console.error("文件写入失败",err);
            }
        });
    })
}



function resizeImg(src, dst, scale,filename,isTiny) {
    
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dst)) {
            mkdirsSync(dst);
        }
        imgsize(src, (err, info) => {
            if (err) {
                console.log(err);
                reject();
                return;
            }
            let toPath = path.resolve(dst, filename);
            sharp(src).resize(clampNum(info.width * scale),
                clampNum(info.height * scale)).toFile(toPath, (err2) => {
                    if (err2) {
                        console.error("文件写入失败",err2);
                        reject();
                        return;
                    }
                    console.log("文件写入成功",toPath);
                    if(isTiny){
                        tinyImg(toPath)
                    }
                    resolve();

                });
        });
    });

}

class PromiseQueue {
    constructor() {
      this.funcs = [];
    }
    add(func) {
      return new Promise(resolve => {
        const needStart = this.funcs.length === 0;
        const pfunc = () => {
          func(()=>{
            resolve()
            if (this.funcs.length > 0) {
                this.funcs.shift();
              }
              this.next();
          });
          
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
function tinyImg(imgpath){
    console.log(imgpath)
    queue.add(resolve=>{
        let content = fs.readFileSync(imgpath);
        TinyPng(content,imgpath,(buffer)=>{
            fs.writeFile(imgpath, buffer,function(err){
                if(!err){
                    console.log("图片文件 tiny 成功",imgpath);
                }else{
                    console.error("图片文件 tiny 失败",err);
                }

                resolve();
            })
        });
        
    })
}

function clampNum(v) {
    if (v < 1) {
        return 1;
    }
    return Math.ceil(v);
}





// convertSkeAnim('./anim/zoulu/ren_ske.json','./anim/zoulu/ren_tex.json','./anim/zoulu/ren_tex.png','./anim/sketest',0.1);
// convertSkeAnim('./anim/mao/mao1_ske.json','./anim/mao/mao1_tex.json','./anim/mao/mao1_tex.png','./anim/sketest',0.1);

