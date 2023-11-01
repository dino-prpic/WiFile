const fs = require('fs')
const path = require('node:path')
const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron')

const prefs = require('./preferences')
const server = require('./server')
const { Folder, File } = require('./files')

let window

function createWindow() {
    window = new BrowserWindow({
        frame: false,
        width: 400,
        height: 300,
        minWidth: 400,
        minHeight: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    window.setMenu(null)
    // window.maximize()
    // window.webContents.openDevTools()

    addWindowHandlers()
    addServerHandlers()
    addFileHandlers()

    window.loadFile('window/index.html')

    ipcMain.on('finished-loading', () => {
        openProject(prefs.path)
        window.webContents.send('server-info', { running: false, port: prefs.port || 3000 })
    })

}

function addWindowHandlers() {
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
function addServerHandlers() {
    ipcMain.on('server-start', (event, port) => {
        prefs.port = port
        server.start(port).then((msg) => {
            window.webContents.send('server-info', msg)
        }).catch(err => {
            window.webContents.send('server-info', err)
        })
    })
    ipcMain.on('server-stop', () => {
        server.stop().then((msg) => {
            window.webContents.send('server-info', msg)
        }).catch(err => {
            window.webContents.send('server-info', err)
        })
    })
}
function addFileHandlers() {
    ipcMain.on('project-open', async (event, { path, type }) => {
        if (!path) {
            const picker = await dialog.showOpenDialog({
                properties: [type === 'folder' ? 'openDirectory' : 'openFile']
            })
            if (picker.canceled) return
            path = picker.filePaths[0]
        }
        prefs.path = path
        openProject(path, type)
    })
}

function openProject(path, type) {
    if (!path) return
    if (!type) type = fs.statSync(path).isDirectory() ? 'folder' : 'file'
    if (type === 'folder') {
        global.project = new Folder(path)
    } else {
        global.project = new File(path)
    }
    window.webContents.send('project-info', global.project.path)
}



const gotSingleLock = app.requestSingleInstanceLock()
if (!gotSingleLock) {
    app.quit()
} else {
    // create window when app is ready
    app.whenReady().then(() => {
        createWindow()
        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    })

    // disable keyboard shortcuts for reloading and zooming
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

    // prevent multiple instances
    app.on('second-instance', () => {
        if (window) {
            if (window.isMinimized()) window.restore();
            window.focus();
        }
    });

    // quit when all windows are closed
    app.on('window-all-closed', function () {
        if (server.running) server.stop()
        if (process.platform !== 'darwin') app.quit()
    })

}