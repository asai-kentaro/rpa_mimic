const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const screen = electron.screen
const BrowserWindow = electron.BrowserWindow

let mainWindow = null

app.allowRendererProcessReuse = false

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

const openMain = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: true,
    },
    alwaysOnTop: true,
    frame: false,
    opacity: 1.0,
  })
  mainWindow.loadURL('file://' + __dirname + '/src/main/index.html')
  mainWindow.on('closed', () => {
    mainWindow = null;
  })
}

app.on('ready', () => {
  openMain()
})
