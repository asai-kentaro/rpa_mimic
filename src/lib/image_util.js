const robot = require("robotjs");

const imageUtil = {
  getScreenImage: (x, y, w, h, window_size, cb = () => {}) => {
    const bitmap = robot.screen.capture();
    let img_data = bitmap.image;
    let img_size = [bitmap.width,bitmap.height];
    let screen_y_offset = 0;
    x = x * (img_size[0] / window_size[0]);
    y = y * (img_size[1] / window_size[1]) + screen_y_offset;
    w = w * (img_size[0] / window_size[0]);
    h = h * (img_size[0] / window_size[0]);
    for(let i=0;i<img_data.length;i += 4) {
      let tmp = img_data[i];
      img_data[i] = img_data[i+2];
      img_data[i+2] = tmp;
    }
    bitmap.data = img_data;
    cb(bitmap);
  },
  bitmapChecker: (bitmap1, bitmap2) => {
    if(bitmap1.width != bitmap2.width) return false;
    if(bitmap1.height != bitmap2.height) return false;

    for(let w = 0; w < bitmap1.width; w++) {
      for(let h = 0; h < bitmap1.height; h++) {
        if(Math.abs(bitmap1.data[w + h * bitmap1.width] - bitmap2.data[w + h * bitmap2.width]) > 5) return false;
      }
    }
    return true;
  },
};

module.exports = imageUtil;
