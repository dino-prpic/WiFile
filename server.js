const os = require('os')
const express = require('express')
const path = require('path')

const app = express()
let server

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/*', (req, res) => {
    if (!global.project) {
        return res.sendStatus(404)
    }
    let projectPath = req.params[0]

    let mode
    for (const key of ['json', 'download']) {
        if (projectPath.endsWith('@' + key)) {
            mode = key
            projectPath = projectPath.slice(0, -1 - key.length)
            break
        }
    }

    const pathArray = projectPath.split('/')
    const item = global.project.search(pathArray)

    if (!item) return res.sendStatus(404)
    if (mode === 'json') return res.json(item.toJSON(global.project.path))
    if (item.isFile && mode === 'download') return res.download(item.path)
    if (item.isFile) return res.sendFile(item.path)
    res.render('folder', { item: item.toJSON(global.project.path) })
})
const api = {
    start: (port) => {
        return new Promise((resolve, reject) => {
            if (!global.project) return reject({ running: false, err: 'Nothing is being shared' })
            if (server) return reject({ running: true, err: 'Server is already running' })
            server = app.listen(port, () => {
                resolve({
                    running: true,
                    port,
                    localIP: getLocalIpAddress()
                })
            })
        })
    },
    stop: () => {
        return new Promise((resolve, reject) => {
            if (!server) return reject({ running: false, err: 'Server is not running' })
            server.close(() => {
                server = null
                resolve({running: false})
            })
        })
    }
}

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces()
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal && alias.mac !== '00:00:00:00:00:00') {
                return alias.address
            }
        }
    }
    return null
}

module.exports = api