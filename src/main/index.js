"use strict";

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const mainWindow = remote.getCurrentWindow();
const fileUtil = remote.require('./src/lib/file_util');

const robot = require("robotjs");
robot.setMouseDelay(30);
robot.setKeyboardDelay(8);

const seqConForm = document.getElementById("filename-seqcon-form");
const seqConBtn = document.getElementById("btn-seqcon");

let cursorLogs = [];

let mousePos = [-1,-1];
let screenRectAlt = [-1, -1];

let screen_capture_no = 0;

let is_aborted = false;

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

const writeLog = (text) => {
  const cursorlogElm = document.getElementById("mouse_cursor_log");
  cursorlogElm.insertAdjacentHTML("beforeend", "<div>" + text + "</div>");
}

const pressBacks = (count) => {
  for(let i=0;i<count;i++) {
    robot.keyTap("backspace");
    robot.keyTap("delete");
  }
}

const bitmapChecker = (bitmap1, bitmap2) => {
  if(bitmap1.width != bitmap2.width) return false;
  if(bitmap1.height != bitmap2.height) return false;

  for(let w = 0; w < bitmap1.width; w++) {
    for(let h = 0; h < bitmap1.height; h++) {
      if(Math.abs(bitmap1.data[w + h * bitmap1.width] - bitmap2.data[w + h * bitmap2.width]) > 5) return false;
    }
  }
  return true;
}

const sequenceMouseCursor = () => {
  if(cursorLogs.length < 2 || is_aborted) {
    // set window solid
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setOpacity(1.0);
    return;
  };
  let nextOrder = cursorLogs[1];
  cursorLogs.shift();
  if(nextOrder.type == "mouse") {
    robot.moveMouseSmooth(nextOrder.pos.x,nextOrder.pos.y);
  }
  if(nextOrder.type == "click") {
    robot.mouseClick();
  }
  if(nextOrder.type == "keyboard") {
    pressBacks(10);
    robot.typeString(nextOrder.string);
    robot.keyTap("enter");
  }
  if(nextOrder.type == "capture") {
    const filename = nextOrder.filename + "_check";
    const pos = nextOrder.pos;
    const size = nextOrder.size;
    let capturedImage = null;
    captureScreen(filename, pos[0], pos[1], size[0], size[1], (image) => { capturedImage = image; });
    fileUtil.loadImage("data/img/" + nextOrder.filename + ".png", (loadedImage) => {
      let cloop_count = 0;
      const capture_loop_func = () => {
        if(bitmapChecker(capturedImage.bitmap, loadedImage.bitmap)) {
          sequenceMouseCursor();
        } else {
          if(cloop_count > 5) {
            // abort
            console.log("[ABORT]")
            is_aborted = true;
            sequenceMouseCursor();
            return;
          }
          cloop_count += 1;
          captureScreen(filename, pos[0], pos[1], size[0], size[1], (image) => { capturedImage = image; });
          setTimeout(capture_loop_func, 1000);
        }
      };
      capture_loop_func();
    }, (err) => {
      // image load error
      console.log("[ERR ABORT]")
      is_aborted = true;
      sequenceMouseCursor();
    });
  }
  if(nextOrder.type == "capture_info") {
    const filename = nextOrder.filename + "_infopic_" + getDateString();
    const pos = nextOrder.pos;
    const size = nextOrder.size;
    captureScreen(filename, pos[0], pos[1], size[0], size[1]);
  }
  if(nextOrder.type == "wait") {
    const wait_time = Number(nextOrder.wait_time);
    setTimeout(() => {
      sequenceMouseCursor();
    }, wait_time);
  }

  if(nextOrder.type != "capture" && nextOrder.type != "wait") {
    sequenceMouseCursor();
  }
}

const startSequenceMouseCursor = () => {
  // set window transparent
  mainWindow.setOpacity(0.0);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  is_aborted = false;
  sequenceMouseCursor();
}

let mousePosGetFlg = false;
const startMouseCursorPos = () => {
  mainWindow.setOpacity(0.01);
  const mouseCursorPosLoop = () => {
    const mouse = robot.getMousePos();
    cursorLogs.push({type: "mouse", pos: mouse});
    writeLog("[mouse](" + mouse.x + "," + mouse.y + ")");
    if(mousePosGetFlg) {
      setTimeout(mouseCursorPosLoop, 200);
    }
  }
  mouseCursorPosLoop();
}

const endMouseCursorPos = () => {
  mainWindow.setOpacity(1.0);
  const filename = document.getElementById("filename_form").value;
  saveSequenceFile(filename);
  cursorLogs = [];
}

const loadSequenceFile = (filenames, cb, meta = {}) => {
  let filename_ary = filenames.split(",");
  cursorLogs = [];
  let fcount = 0;
  for(let fidx=0;fidx<filename_ary.length;fidx++) {
    fileUtil.loadFile(filename_ary[fidx], (json_str) => {
      if(meta.keyword) {
        const replaceAll = (str, beforeStr, afterStr) => {
          let res = "";
          let str_ary = str.split(beforeStr);
          for(let sidx=0;sidx<str_ary.length-1;sidx++) {
            res += str_ary[sidx] + afterStr;
          }
          res += str_ary[str_ary.length-1];
          return res;
        };
        json_str = replaceAll(json_str, "[keyword]", meta.keyword)
      }
      cursorLogs = cursorLogs.concat(JSON.parse(json_str));
      fcount += 1;
      if(fcount == filename_ary.length) {
        cb();
      }
    });
  }
}

const listSequenceFiles = () => {
  const seq_files = fileUtil.listJsonFiles("", (files) => {
    for(let fidx=0;fidx<files.length;fidx++) {
      writeLog("[filename] " + files[fidx])
    }
  })
}

const saveSequenceFile = (filename) => {
  fileUtil.saveFile(filename, JSON.stringify(cursorLogs), () => {});
}

const captureScreen = (name, x, y, w, h, cb = () => {}) => {
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
  fileUtil.saveImage("data/img/" + name + ".png", bitmap, {x:x,y:y,w:w,h:h}, (image) => {
    cb(image)
  });
}

const event_key_ArrowUp = () => {
  const filename = getDateString() + "_" + screen_capture_no;
  const imgSize = [20,20];
  captureScreen(filename, mousePos[0], mousePos[1], imgSize[0], imgSize[1]);
  cursorLogs.push({type: "capture", filename: filename, pos: [mousePos[0],mousePos[1]], size: imgSize});
  writeLog("[screen capture]");
  screen_capture_no += 1;
}

const event_key_Alt = () => {
  if(screenRectAlt[0] == -1) {
    screenRectAlt = [mousePos[0], mousePos[1]];
  } else {
    const filename = getDateString() + "_info" + screen_capture_no;
    let scrnPos = [screenRectAlt[0], screenRectAlt[1]];
    let scrnSize = [screenRectAlt[0] - mousePos[0], screenRectAlt[1] - mousePos[1]];
    if(scrnPos[0] > mousePos[0]) scrnPos[0] = mousePos[0];
    if(scrnPos[1] > mousePos[1]) scrnPos[1] = mousePos[1];
    if(scrnSize[0] < 0) scrnSize[0] = -scrnSize[0];
    if(scrnSize[1] < 0) scrnSize[1] = -scrnSize[1];
    captureScreen(filename, scrnPos[0],scrnPos[1],scrnSize[0],scrnSize[1]);
    cursorLogs.push({type: "capture_info", filename: filename, pos: [scrnPos[0],scrnPos[1]], size: [scrnSize[0],scrnSize[1]]});
    writeLog("[info screen capture]");
    screen_capture_no += 1;
    screenRectAlt = [-1, -1];
  }
}

document.onclick = () => {
  if(mousePosGetFlg) {
    cursorLogs.push({type: "click"});
    writeLog("[click]");
  }
}
document.oncontextmenu = () => {
  const text_value = document.getElementById("keyboard_input_form").value;
  cursorLogs.push({type: "keyboard", string: text_value});
  writeLog("[keyboard]");
}

document.addEventListener('keydown', (event) => {
  let keyName = event.key;
  if(keyName == "Alt") {
    event_key_Alt();
  }
  if(keyName == "ArrowUp") {
    event_key_ArrowUp();
  }
  if(keyName == "ArrowRight") {
    mousePosGetFlg = !mousePosGetFlg;
    if(mousePosGetFlg) {
      setTimeout(startMouseCursorPos,100);
    } else {
      endMouseCursorPos();
    }
  }
  if(keyName == "ArrowLeft") {
    const filename = document.getElementById("filename_form").value;
    loadSequenceFile(filename, startSequenceMouseCursor);
  }
  if(keyName == "ArrowDown") {
    mainWindow.close();
  }
})

document.addEventListener("mousemove", (event) => {
  mousePos[0] = event.pageX;
  mousePos[1] = event.pageY;
})

// Sequence UI
let target_seq_rect = null;
let target_seq_rect_x = null;
let target_seq_rect_y = null;
const moveSeqRect = (e) => {
  const currentXY = [e.offsetX, e.offsetY];
  let prevXY = [target_seq_rect_x,target_seq_rect_y];
  const moveXY = [currentXY[0] - prevXY[0], currentXY[1] - prevXY[1]];
  target_seq_rect.style.left = currentXY[0] + "px";
}

seqConBtn.addEventListener("click", () => {
  const filename = document.getElementById("filename_form").value;
  loadSequenceFile(filename, () => {
    const concatfilename = document.getElementById("filename-seqcon-form").value;
    saveSequenceFile(concatfilename);
  });
})

ipcRenderer.on("automan", (event, arg) => {
  let send_data = JSON.parse(arg);
  let filename = send_data.name + ".json";
  let meta = {};
  if(send_data.keyword) {
    meta.keyword = send_data.keyword;
  }
  writeLog("Seq Load:" + filename);
  loadSequenceFile(filename, startSequenceMouseCursor, meta);
});

listSequenceFiles()
