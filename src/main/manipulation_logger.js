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
  startMouseCursorPos: (savefileName) => {
    ManipulationLogger.savefileName = savefileName;
    const mouseCursorPosLoop = () => {
      if(ManipulationLogger.mousePosGetFlg) {
        const mouse = robot.getMousePos();
        ManipulationLogger.posMouse(mouse.x, mouse.y)
        writeLog("[mouse](" + mouse.x + "," + mouse.y + ")");
        setTimeout(mouseCursorPosLoop, 200);
      }
    }
    mouseCursorPosLoop();
  },
  endMouseCursorPos: () => {
    ManipulationLogger.saveSequenceFile(ManipulationLogger.savefileName);
    ManipulationLogger.cursorLogs = [];
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
