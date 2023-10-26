const fs = require('fs')
const path = require('path')

class Folder extends Array {
    path
    constructor(folderPath) {
        super()
        if (!folderPath) return 
        if (!fs.existsSync(folderPath)) throw new Error(`Folder does not exist: ${folderPath}`)
        this.path = folderPath
        // this.read()
    }
    read() {
        console.log('reading', this.path)
        this.length = 0
        const files = fs.readdirSync(this.path)
        files.forEach(name => {
            const stats = fs.statSync(path.join(this.path, name))
            if (stats.isDirectory()) {
                this.push(new Folder(path.join(this.path, name)))
            } else {
                this.push(new File(path.join(this.path, name)))
            }
        })
        this.sort((a, b) => {
            const aNum = parseInt((a.name.match(/\d+/) || ['0'])[0], 10)
            const bNum = parseInt((b.name.match(/\d+/) || ['0'])[0], 10)
            return aNum - bNum;
        });
        this.sort((a, b) => {
            if (a instanceof Folder && b instanceof File) return -1
            if (a instanceof File && b instanceof Folder) return 1
            return 0
        })
    }
    getFile(fileName) {
        this.read()
        return this.find(file => {
            return file.name === fileName
                && file instanceof File
        })
    }
    getFolder(folderName) {
        this.read()
        return this.find(folder => {
            return folder.name === folderName
                && folder instanceof Folder
        })
    }
    getFiles(...extensions) {
        this.read()
        if (extensions.length === 0) return this.filter(item => item instanceof File)
        return this.filter(item => {
            return item instanceof File
                && extensions.includes(item.extension)
        })
    }
    getFolders() {
        this.read()
        return this.filter(item => item instanceof Folder)
    }
    getAny(name) {
        this.read()
        return this.find(item => item.name === name)
    }
    search(pathArray) {
        const name = pathArray.shift()
        if (!name) return this
        const item = this.getAny(name)
        if (!item) return null
        return item.search(pathArray)
    }
    get pathArray() {
        return this.path.split(path.sep)
    }
    get name() {
        return this.pathArray.pop()
    }
    get isFile() {return false}
    get exists() {return fs.existsSync(this.path)}
    toJSON(projectPath, recursive = true) {
        if (!projectPath) projectPath = this.path
        const relPath = path.relative(projectPath, this.path)
        const urlPath = relPath.split(path.sep).join('/')
        const items = []
        if (recursive) {
            this.read()
            this.forEach(item => {
                items.push(item.toJSON(projectPath, false))
            })
        }
        return {
            type: 'folder',
            name: this.name,
            path: urlPath,
            items
        }
    }
}

class File {
    path
    constructor(filePath) {
        if (!filePath) throw new Error('File path is required')
        this.path = filePath
    }

    read() {
        try {
            const buffer = fs.readFileSync(this.path)
            if (this.extension === 'json') return JSON.parse(buffer.toString())
            return buffer
        } catch (error) {
            if (this.extension === 'json') return {}
            return null
        }
    }
    write(data) {
        if (typeof data === 'object') data = JSON.stringify(data, null, 2)
        fs.writeFileSync(this.path, data)
    }
    search(pathArray) {
        if (pathArray.length === 0 || (
            pathArray.length === 1 && pathArray[0] === ''
        )) return this
        return null
    }
    get pathArray() {
        return this.path.split(path.sep)
    }
    get name() {
        return this.pathArray.pop()
    }
    get extension() {
        return this.name.split('.').pop()
    }
    get size() {
        const stats = fs.statSync(this.path)
        return stats.size
    }
    get sizeString() {
        let size = this.size
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
        let unit = 0
        while (size > 1024 && unit < units.length - 1) {
            size /= 1024
            unit++
        }
        return size.toFixed(1) + ' ' + units[unit]
    }
    get isFile() {return true}
    get exists() {return fs.existsSync(this.path)}
    toJSON(projectPath) {
        const relPath = path.relative(projectPath, this.path)
        const urlPath = relPath.split(path.sep).join('/')
        return {
            type: 'file',
            name: this.name,
            path: urlPath,
            size: this.sizeString
        }
    }
}

module.exports = {Folder, File}