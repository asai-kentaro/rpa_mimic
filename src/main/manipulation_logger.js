const robot = require("robotjs");
robot.setMouseDelay(30);
robot.setKeyboardDelay(8);

const fileUtil = remote.require('./src/lib/file_util');

//
// 操作を記録、読み込み、保存する
//
const ManipulationLogger = {
  cursorLogs: [],
  mousePosGetFlg: false,
  savefileName: "",
  initialize: (savefileName) => {
    ManipulationLogger.cursorLogs = [];
    ManipulationLogger.savefileName = savefileName;
  },
  finalize: () => {
    ManipulationLogger.saveSequenceFile(ManipulationLogger.savefileName);
    ManipulationLogger.cursorLogs = [];
  },
  startMouseCursorPos: (savefileName) => {
    ManipulationLogger.initialize(savefileName);
    const mouseCursorPosLoop = () => {
      if(ManipulationLogger.mousePosGetFlg) {
        const mouse = robot.getMousePos();
        ManipulationLogger.posMouse(mouse.x, mouse.y);
        writeLog("[mouse](" + mouse.x + "," + mouse.y + ")");
        setTimeout(mouseCursorPosLoop, 200);
      }
    }
    mouseCursorPosLoop();
  },
  endMouseCursorPos: () => {
    ManipulationLogger.finalize();
  },
  posMouse: (x, y) => {
    ManipulationLogger.cursorLogs.push({type: "mouse", pos: {x,y}});
  },
  clickMouse: () => {
    ManipulationLogger.cursorLogs.push({type: "click"});
  },
  typeKeyboard: (text_value) => {
    ManipulationLogger.cursorLogs.push({type: "keyboard", string: text_value});
  },
  saveScreen: (name, x, y, w, h, cb = () => {}) => {
    const bitmap = robot.screen.capture();
    let img_data = bitmap.image;
    let window_size = [document.documentElement.clientWidth,document.documentElement.clientHeight];
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
    fileUtil.saveImage("./data/img/" + name + ".png", bitmap, {x:x,y:y,w:w,h:h}, (image) => {
      cb(image)
    });
  },
  captureScreen: () => {
    const getDateString = () => {
      const date = new Date();
      let date_str = "";
      date_str += date.getFullYear();
      date_str += (date.getMonth() + 1);
      date_str += date.getDate();
      date_str += date.getHours();
      date_str += date.getMinutes();
      date_str += date.getSeconds();
      return date_str;
    }

    const mouse = robot.getMousePos();
    ManipulationLogger.saveScreen("capture_" + getDateString(), mouse.x, mouse.y, 200,200);
  },

  loadSequenceFile: (filenames, cb, meta = {}) => {
    let filename_ary = filenames.split(",");
    ManipulationLogger.cursorLogs = [];
    let fcount = 0;
    for(let fidx=0;fidx<filename_ary.length;fidx++) {
      fileUtil.loadFile(filename_ary[fidx], (json_str) => {
        ManipulationLogger.cursorLogs = ManipulationLogger.cursorLogs.concat(JSON.parse(json_str));
        fcount += 1;
        if(fcount == filename_ary.length) {
          cb();
        }
      });
    }
  },
  saveSequenceFile: (filename) => {
    fileUtil.saveFile(filename, JSON.stringify(ManipulationLogger.cursorLogs), () => {});
  },
  listSequenceFiles: () => {
    const seq_files = fileUtil.listJsonFiles("", (files) => {
      for(let fidx=0;fidx<files.length;fidx++) {
        writeLog("[filename] " + files[fidx])
      }
    })
  },
}

module.exports = ManipulationLogger;
