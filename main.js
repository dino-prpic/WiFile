const fs = require('fs')
const path = require('node:path')
const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron')

const prefs = require('./preferences')
const server = require('./server')
const {Folder, File} = require('./utils/fs')


function createWindow() {
    console.log('createWindow')

    const window = new BrowserWindow({
        frame: false,
        // transparent: true,
        width: 400,
        height: 300,
        minWidth: 400,
        minHeight: 300,
        x: 1000,
        y: 120,
        // alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    window.setMenu(null)
    // window.maximize()
    // window.webContents.openDevTools()

    addWindowHandlers(window)
    addServerHandlers(window)
    addFileHandlers(window)

    window.loadFile('window/index.html')

    ipcMain.on('finished-loading', () => {
        console.log('did-finish-load')
        openProject(window, prefs.path)
        window.webContents.send('port', prefs.port || 3000)
    })
    

}

function addWindowHandlers(window) {
    ipcMain.on('window-minimize', () => {
        window.minimize()
    })
    ipcMain.on('window-maximize', () => {
        if (window.isMaximized()) {
            window.unmaximize()
        } else {
            window.maximize()
        }
    })
    ipcMain.on('window-close', () => {
        window.close()
    })
}
function addServerHandlers(window) {
    ipcMain.on('server-start', (event, port) => {
        prefs.port = port
        server.start(port).then((msg) => {
            window.webContents.send('server-info', msg)
        }).catch(err => {
            console.log(err)
            window.webContents.send('server-info', 'ERROR: ' + err)
        })
    })
    ipcMain.on('server-stop', () => {
        server.stop().then((msg) => {
            window.webContents.send('server-info', msg)
        }).catch(err => {
            console.log(err)
            window.webContents.send('server-info', 'ERROR: ' + err)
        })
    })
}
function addFileHandlers(window) {
    ipcMain.on('project-open', async (event, {path, type}) => {
        if (!path) {
            const picker = await dialog.showOpenDialog({ 
                properties: [type === 'folder' ? 'openDirectory' : 'openFile'] 
            })
            if (picker.canceled) return
            path = picker.filePaths[0]
        }
        prefs.path = path
        openProject(window, path, type)
    })
}

function openProject(window, path, type) {
    console.log('openProject', path)
    if (!path) return
    if (!type) type = fs.statSync(path).isDirectory() ? 'folder' : 'file'
    if (type === 'folder') {
        global.project = new Folder(path)
    } else {
        global.project = new File(path)
    }
    window.webContents.send('project-info', global.project.path)
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// disable keyboard shortcuts
app.on('browser-window-focus', () => {
    globalShortcut.register('CommandOrControl+R', () => { })
    globalShortcut.register('CommandOrControl+=', () => { })
    globalShortcut.register('CommandOrControl+-', () => { })
})
app.on('browser-window-blur', () => {
    globalShortcut.unregister('CommandOrControl+R')
    globalShortcut.unregister('CommandOrControl+=')
    globalShortcut.unregister('CommandOrControl+-')
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})