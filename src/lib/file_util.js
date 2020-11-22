const fs = require('fs');
const jimp = require("jimp");

let base_dir = "./data/"

const fileUtil = {
  saveFile: (file_name, content, cb) => {
    fs.writeFileSync(base_dir + file_name, content);
  },
  loadFile: (file_name, cb) => {
    fs.readFile(base_dir + file_name, 'utf8', (err, data) => {
      if(!err) {
        cb(data);
      }
    });
  },
  listFiles: (dir, cb) => {
    fs.readdir(base_dir + dir, (err, files) => {
      if(err) throw err;
      let fileList = [];
      files.filter((file) => {
        let filename = base_dir + dir + file;
        return fs.statSync(filename).isFile();
      }).forEach((file) => {
        let filename = base_dir + dir + file;
        fileList.push(filename);
      })
      cb(fileList);
    })
  },
  listJsonFiles: (dir, cb) => {
    fs.readdir(base_dir + dir, (err, files) => {
      if(err) throw err;
      let fileList = [];
      files.filter((file) => {
        let filename = base_dir + dir + file;
        return fs.statSync(filename).isFile() && /.*\.json/.test(filename);
      }).forEach((file) => {
        let filename = base_dir + dir + file;
        fileList.push(filename);
      })
      cb(fileList);
    })
  },
  loadImage: (filename, cb, err) => {
    jimp.read(filename).then(image => {
      cb(image)
    }).catch(e => {
      console.log("[Error] Image load");
      err(e);
    })
  },
  saveImage: async (file_name, bitmap, meta) => {
    let image = await jimp.read(bitmap);
    image.crop(meta.x,meta.y,meta.w,meta.h).write(file_name);
    return image;
  },
}

module.exports = fileUtil;
