const {File} = require('./utils/fs')
const path = require('path')
const file = new File(path.join(__dirname, 'preferences.json'))
// const preferences = file.read()
const preferences = {}

for (const key of ['path', 'port']) {
    Object.defineProperty(preferences, key, {
        get: () => file.read()[key],
        set: (value) => {
            console.log('set', key, value)
            const data = file.read()
            data[key] = value
            file.write(data)
        }
    })
}

if (!preferences.port) preferences.port = 80

module.exports = preferences
