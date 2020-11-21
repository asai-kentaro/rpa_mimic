# RPA Mimic

RPA Mimic is for RPA with mouse and keyboard direct automated manipulation.

## Demo

## Features

You can easily automate sequential mouse and keyboard manipulation with below lines.
This library is based on robot.js.

```
# load manipulation sequencer
const ManipulationSequencer = require('./manipulation_sequencer');
# move mouse cursor and click instructions
const man_insts = [
  {
    "type": "mouse",
    "pos": {
      "x": 100,
      "y": 150
    }
  },
  {
    "type": "mouse",
    "pos": {
      "x": 200,
      "y": 300
    }
  },
  {
    "type": "click"
  },
];

# start manipulation
ManipulationSequencer.startSequenceMouseCursor(man_insts);
```

Also you can save manipulation with demonstration on the UI in our library.

## Start Using

## Functions

### Manipulation Load

With Manipulation load function, you can move mouse cursor, click and type keys automatically with json instruction files.
You can make json instruction files with manipulation simulator (next section).

```
const ManipulationSequencer = require('./manipulation_sequencer');

ManipulationSequencer.startSequenceMouseCursor(manipulation_instructions);
```

### Manipulation Save

Manipulation simulator is used for saving sequential instructions.
You can save instructions with demonstration on the UI such as moving mouse, click buttons and type keys.

```
const ManipulationLogger = require('./manipulation_logger');

# save mouse cursor
ManipulationLogger.posMouse(pos_x, pos_y);
# save click
ManipulationLogger.clickMouse();
# type keys
ManipulationLogger.typeKeyboard("hello.");
```

## Json Instruction File

Json instruction file consists of sequential instructions.
You can specify below instruction types.

* move mouse cursor

```
{
  "type": "mouse",
  "pos": {
    "x": pos_x,
    "y": pos_y
  }
}
```

* click

```
{
  "type": "click"
}
```

* type keys

```
{
  "type": "keyboard",
  "string": "hello."
}
```

## Development

1. install python 2(2.7.10)
2. install electron
3. npm run rebuild
4. electron .
