"use strict";

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const mainWindow = remote.getCurrentWindow();

const robot = require("robotjs");
robot.setMouseDelay(30);
robot.setKeyboardDelay(8);

const $ = require("jquery");

const fileUtil = remote.require('./src/lib/file_util');

const ManipulationSequencer = require('./manipulation_sequencer');
const ManipulationLogger = require('./manipulation_logger');


const seqConForm = document.getElementById("filename-seqcon-form");
const seqConBtn = document.getElementById("btn-seqcon");
const loadSeqBtn = document.getElementById("btn-loadseq");


const writeLog = (text) => {
  const cursorlogElm = document.getElementById("mouse_cursor_log");
  cursorlogElm.insertAdjacentHTML("beforeend", "<div>" + text + "</div>");
}

const setWindowTransparent = () => {
  // set window transparent
  mainWindow.setOpacity(0.0);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
}
const setWindowSolid = () => {
  // set window solid
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setOpacity(1.0);
}

const setImageList = () => {
  fileUtil.listFiles("img/", (img_files) => {
    let img_list_html = "";
    img_files.forEach((filename) => {
      img_list_html += '<div><h5>' + filename + '</h5><img src="../../' + filename + '" /></div>'
    })
    $("#images_container").html(img_list_html);
  });
};
const loadSequence = () => {
  const getStepColor = (type) => {
    if(type == "mouse") return "#FAA";
    if(type == "keyboard") return "#AFA";
    if(type == "click") return "#AAF";
    if(type == "capture_image") return "#FAF";
    return "#DDD";
  };
  const filename = document.getElementById("filename_form").value;
  ManipulationLogger.loadSequenceFile(filename, () => {
    let seq_list_html = "";
    for(let i=0;i<ManipulationLogger.cursorLogs.length;i++) {
      let type = ManipulationLogger.cursorLogs[i].type;
      seq_list_html += '<li class="seq-step-elm" style="background:' + getStepColor(type) + '">' + type + '</li>';
    }
    $("#seq_container").html(seq_list_html);
  });
}


$(document).ready(setImageList);

// mouse left-click => save left-click
document.onclick = () => {
  if(ManipulationLogger.mousePosGetFlg) {
    ManipulationLogger.clickMouse();
    writeLog("[click]");
  }
}
// mouse right-click => save keyboard input
document.oncontextmenu = () => {
  const text_value = document.getElementById("keyboard_input_form").value;
  ManipulationLogger.typeKeyboard(text_value);
  writeLog("[keyboard]");
}

document.addEventListener('keydown', (event) => {
  let keyName = event.key;
  if(keyName == "ArrowRight") {
    ManipulationLogger.mousePosGetFlg = !ManipulationLogger.mousePosGetFlg;
    if(ManipulationLogger.mousePosGetFlg) {
      mainWindow.setOpacity(0.01);
      const filename = document.getElementById("filename_form").value;
      setTimeout(() => { ManipulationLogger.startMouseCursorPos(filename); },100);
    } else {
      mainWindow.setOpacity(1.0);
      ManipulationLogger.endMouseCursorPos();
    }
  }
  if(keyName == "ArrowLeft") {
    const filename = document.getElementById("filename_form").value;
    ManipulationLogger.loadSequenceFile(filename, () => { ManipulationSequencer.startSequenceMouseCursor(ManipulationLogger.cursorLogs, setWindowTransparent, setWindowSolid) });
  }
  if(keyName == "ArrowUp") {
    ManipulationLogger.captureScreen();
  }
  if(keyName == "ArrowDown") {
    mainWindow.close();
  }
});

seqConBtn.addEventListener('click', () => {});

loadSeqBtn.addEventListener('click', loadSequence);

ManipulationLogger.listSequenceFiles();
