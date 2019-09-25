#!/usr/bin/env node

let fs = require("fs");
let path = require('path');
let cv = require('./convert');
let src = '.scalecfg';



// let defCfg= {
//     srcFolder:"./cdn",
//     types:[
//         {type:"normal",folder:"./src/assets/normal"},
//         {type:"mid",folder:"./src/assets/mid"},
//         {type:"low",folder:"./src/assets/low"},
//     ],
//     files:[
//         {
//             name:"img-fdf-1.png",
//             type:"图片" | "龙骨" | "帧动画" |
//             src:{

//             },
//             scale:{
//                 normal:1,
//                 mid:0.5,
//                 low:0.1,
//             },
//             tinypng:false,
//         },
//         {
//             name:"fdf2",
//             file:"img/1.png",
//             scale:{
//                 normal:1,
//                 mid:0.5,
//                 low:0.2,
//             }
//         }
//     ],
// };



async function start(){
    let oldcfg = await createScaleCfgFile();
    fs.writeFile(src,JSON.stringify(oldcfg,null,2),function(err){
        if(!err){
            console.log("修改文件",src);
            cv.convertRes(src)
        }
    });
    // if (!fs.existsSync(src)) {
    //     console.log("file not found with",src);
    //     let newobj = {
    //         srcFolder:"./cdn",
    //         params:[
    //             {
    //                 scale:0.25,
    //                 toFolder:"./src/assets/025"
    //             },
    //             {
    //                 scale:0.75,
    //                 toFolder:"./src/assets/075"
    //             },
    //             {
    //                 scale:1,
    //                 toFolder:"./src/assets/100"
    //             }
    //         ]
    //     }
    //     fs.writeFile(src,JSON.stringify(newobj),function(err){
    //         if(!err){
    //             console.log("创建文件",src);
    //         }
    //     });
    //     return;
    // }
    
    // fs.readFile(src,'utf-8', function(err,objstr){
    //     let scalecfg = JSON.parse(objstr);
    //     cv.convertRes(scalecfg.srcFolder,scalecfg.params);
    // })
}

async function createScaleCfgFile(){
    return new Promise((resove)=>{
        let FileType = cv.FileType;
        let fileObj = {imgs:[],jsons:[]};
        let oldDefCfg;
        let defCfg = {
            srcFolder:"./cdn",
            types:[
                {type:"normal",folder:"./src/assets/normal"},
                {type:"mid",folder:"./src/assets/mid"},
                {type:"low",folder:"./src/assets/low"},
            ],
            files:[]
        }
        if (fs.existsSync(src)) {
            oldDefCfg = JSON.parse(fs.readFileSync(src,'utf-8'));
            defCfg.srcFolder = oldDefCfg.srcFolder;
            defCfg.types = oldDefCfg.types;
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
                    let filename = cv.getFileName(fPath);
                    let extname = path.extname(filename);
                    if(extname === ".png"){
                        fileObj.imgs.push({
                            path:fPath,
                            name:cv.convertFileName(path.resolve(fPath).slice(path.resolve(defCfg.srcFolder).length),"-")
                        });
                    }
                    if(extname === ".json"){
                        fileObj.jsons.push({
                            path:fPath,
                            name:cv.convertFileName(path.resolve(fPath).slice(path.resolve(defCfg.srcFolder).length),"-")
                        });
                    }
                };
            });
    
        }
        finder(defCfg.srcFolder);
        // console.log(fileObj);
        for(let i=0;i<fileObj.imgs.length;++i){
            let imgobj = fileObj.imgs[i];
            let jsonSrc = getJsonSrc(fileObj.jsons,imgobj.path);
            let type;
            let filesrc = {};
            filesrc.image = cv.convertFileName(path.resolve(imgobj.path).slice(path.resolve(defCfg.srcFolder).length),"/")
            if(jsonSrc.texpath && jsonSrc.skepath){
                type = FileType.DRAGONBONE;
                filesrc.ske=cv.convertFileName(path.resolve(jsonSrc.skepath).slice(path.resolve(defCfg.srcFolder).length),"/")
                filesrc.tex=cv.convertFileName(path.resolve(jsonSrc.texpath).slice(path.resolve(defCfg.srcFolder).length),"/")
            }else if(jsonSrc.texpath){
                type = FileType.SPRITE_ANIMATION;
                filesrc.json=cv.convertFileName(path.resolve(jsonSrc.texpath).slice(path.resolve(defCfg.srcFolder).length),"/")
            }else{
                type = FileType.IMAGE
            }
            // console.log(filesrc)
            defCfg.files.push({
                name:cv.getfileNameNoSuffix(imgobj.name),
                type:type,
                src:filesrc,
                scale:{
                    normal:1,
                    mid:0.5,
                    low:0.1,
                },
                tinypng:true,
            })
        }

        if (oldDefCfg) {
            for(let i=0;i<oldDefCfg.files.length;++i){
                let oldcfg = oldDefCfg.files[i];
                let cfg = defCfg.files.find((v)=>{
                    if(v.name === oldcfg.name){
                        return v;
                    }
                });
                if(cfg){
                    cfg.scale = oldcfg.scale;
                    cfg.tinypng = oldcfg.tinypng;
                }
            }
        }
        
        resove(defCfg);

        
        
        
    })
   
}

function getJsonSrc(jsonArr,imgpath){
    
    let imgname = cv.getfileNameNoSuffix(imgpath);
    let obj = {};
    let skename;
    if(imgname.indexOf('tex') != -1){
        skename = imgname.replace("tex","ske");

    }
    for(let i=0;i<jsonArr.length;++i){
        let jsonname = cv.getfileNameNoSuffix(jsonArr[i].path);
        if(jsonname === imgname){
            obj.texpath= jsonArr[i].path;
        }
        if(skename && jsonname === skename){
            obj.skepath = jsonArr[i].path;
        }
    }
    return obj;
}







start();



