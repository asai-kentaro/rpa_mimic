const robot = require("robotjs");

const fileUtil = remote.require('./src/lib/file_util');
const imageUtil = remote.require('./src/lib/image_util');

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
  saveScreen: (name, x, y, w, h, cb = () => {}) => {
    const window_size = [document.documentElement.clientWidth,document.documentElement.clientHeight];
    imageUtil.getScreenImage(x,y,w,h,window_size, (bitmap) => {
      fileUtil.saveImage("./data/img/" + name + ".png", bitmap, {x:x,y:y,w:w,h:h}).then(cb);
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
    const image_name = "capture_" + getDateString();
    const x = mouse.x, y = mouse.y, w = 200, h = 200;
    ManipulationLogger.saveScreen(image_name, x, y, w, h);
    ManipulationLogger.captureImage(image_name, x, y, w, h);
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
  captureImage: (image_name, x, y, w, h) => {
    ManipulationLogger.cursorLogs.push({type: "capture_image", image_name, x, y, w, h});
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
