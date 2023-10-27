const {File} = require('./files')
const { app } = require('electron');
const path = require('path')
const file = new File(
    path.join(app.getPath('userData'), 'preferences.json')
)
const preferences = {}

for (const key of ['path', 'port']) {
    Object.defineProperty(preferences, key, {
        get: () => file.read()[key],
        set: (value) => {
            const data = file.read()
            data[key] = value
            file.write(data)
        }
    })
}

module.exports = preferences
