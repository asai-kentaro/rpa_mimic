const robot = require("robotjs");
robot.setMouseDelay(30);
robot.setKeyboardDelay(8);

//
// 操作を再生する
//
// input: manipulation_json_ary
//
const ManipulationSequencer = {
  startCbFunc: () => {},
  endCbFunc: () => {},
  startSequenceMouseCursor: (manipulationLogs, start_cb, end_cb) => {
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
    if(nextOrder.type == "mouse") {
      robot.moveMouseSmooth(nextOrder.pos.x,nextOrder.pos.y);
    }
    if(nextOrder.type == "click") {
      robot.mouseClick();
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
    }
    ManipulationSequencer.sequenceMouseCursor(manipulationLogs);
  },
}

module.exports = ManipulationSequencer;
