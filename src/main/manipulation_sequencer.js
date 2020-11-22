const robot = require("robotjs");

const fileUtil = remote.require('./src/lib/file_util');
const imageUtil = remote.require('./src/lib/image_util');

//
// 操作を再生する
//
const ManipulationSequencer = {
  startCbFunc: () => {},
  endCbFunc: () => {},
  startSequenceMouseCursor: (manipulationLogs, start_cb = () => {}, end_cb = () => {}) => {
    ManipulationSequencer.startCbFunc = start_cb;
    ManipulationSequencer.endCbFunc = end_cb;

    ManipulationSequencer.startCbFunc();
    ManipulationSequencer.sequenceMouseCursor(manipulationLogs);
  },
  endSequenceMouseCursor: () => {
    ManipulationSequencer.endCbFunc();
  },
  sequenceMouseCursor: (manipulationLogs) => {
    if(manipulationLogs.length < 2) {
      ManipulationSequencer.endSequenceMouseCursor();
      return;
    };
    let nextOrder = manipulationLogs[1];
    manipulationLogs.shift();

    const nextStep = () => {
      ManipulationSequencer.sequenceMouseCursor(manipulationLogs);
    };
    if(nextOrder.type == "mouse") {
      robot.moveMouseSmooth(nextOrder.pos.x,nextOrder.pos.y);
      nextStep();
    }
    if(nextOrder.type == "click") {
      robot.mouseClick();
      nextStep();
    }
    if(nextOrder.type == "keyboard") {
      const pressBacks = (count) => {
        for(let i=0;i<count;i++) {
          robot.keyTap("backspace");
          robot.keyTap("delete");
        }
      }
      pressBacks(10);
      robot.typeString(nextOrder.string);
      robot.keyTap("enter");
      nextStep();
    }
    if(nextOrder.type == "capture_image") {
      const img_file = "./data/img/" + nextOrder.image_name + ".png";
      const checkimgname = nextOrder.image_name + "_check";
      fileUtil.loadImage(img_file, (loadCapImg) => {
        const mouse = robot.getMousePos();
        const window_size = [document.documentElement.clientWidth,document.documentElement.clientHeight];
        const x = mouse.x, y = mouse.y, w = 200, h = 200;
        imageUtil.getScreenImage(x, y, w, h, window_size, (currentBitmap) => {
          fileUtil.saveImage("./data/img/" + checkimgname + ".png", currentBitmap, {x:x,y:y,w:w,h:h}).then((currentCapImg) => {
            const isSameImg = imageUtil.bitmapChecker(loadCapImg.bitmap, currentCapImg.bitmap);
            console.log(isSameImg);
            nextStep();
          });
        });
      }, (err) => {
        console.log(err);
      })
    }
  },
}

module.exports = ManipulationSequencer;
