const os = require('os')
const express = require('express')

const app = express()
let server

app.set('view engine', 'ejs')

app.get('/*', (req, res) => {
    if (!global.project) {
        console.log('No project loaded')
        return res.sendStatus(404)
    }
    // const mode = req.params[0].match(/@json|@download$/)?.[0]?.replace('@', '')
    // console.log('mode', mode)
    // const projectPath = req.params[0].replace(/@json|@download$/, '')
    let projectPath = req.params[0]

    let mode
    for (const key of ['json', 'download']) {
        if (projectPath.endsWith('@' + key)) {
            mode = key
            // remove char + key
            projectPath = projectPath.slice(0, -1 - key.length)
            break
        }
    }
    console.log('mode', mode)
    console.log('projectPath', projectPath)

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
        console.log('Starting server...')
        return new Promise((resolve, reject) => {
            if (server) return reject('Server is already running')
            server = app.listen(port, () => {
                const msg = `Server ON @ http://${getLocalIpAddress()}:${port}`
                console.log(msg)
                resolve(msg)
            })
        })
    },
    stop: () => {
        return new Promise((resolve, reject) => {
            if (!server) return reject('Server is not running')
            server.close(() => {
                server = null
                const msg = 'Server OFF'
                console.log(msg)
                resolve(msg)
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