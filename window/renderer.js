// const { ipcMain } = require("electron")

if(window.myAPI) {
    createWindowActions()
    createServerActions()
    createFileActions()
    myAPI.send('finished-loading')
}


function createWindowActions() {

    const minimizeBtn = document.getElementById('minimize')
    minimizeBtn.onclick = () => myAPI.send('window-minimize')

    const maximizeBtn = document.getElementById('maximize')
    maximizeBtn.onclick = () => myAPI.send('window-maximize')

    const closeBtn = document.getElementById('close')
    closeBtn.onclick = () => myAPI.send('window-close')

}

function createServerActions() {

    const portInput = document.getElementById('port-input')
    const serverOnBtn = document.getElementById('server-on')
    const serverOffBtn = document.getElementById('server-off')
    const serverInfo = document.getElementById('server-info')

    serverOnBtn.onclick = () => {
        myAPI.send('server-start', parseInt(portInput.value))
        portInput.disabled = true
        serverOnBtn.disabled = true
        serverOffBtn.disabled = false
    }
    serverOffBtn.onclick = () => {
        myAPI.send('server-stop')
        portInput.disabled = false
        serverOnBtn.disabled = false
        serverOffBtn.disabled = true
    }

    myAPI.receive('server-info', (data) => {
        serverInfo.innerHTML = data
    })
    myAPI.receive('port', (data) => {
        portInput.value = data
    })

}

function createFileActions() {
    
    const fileActions = document.getElementById('file-actions')

    const folderPicker = document.getElementById('folder-picker')
    folderPicker.addEventListener('click', async () => {
        myAPI.send('project-open', { type: 'folder' })
    })

    const filePicker = document.getElementById('file-picker')
    filePicker.addEventListener('click', async () => {
        myAPI.send('project-open', { type: 'file' })
    })

    const projectInfo = document.getElementById('project-info')
    myAPI.receive('project-info', (data) => {
        projectInfo.innerHTML = 'Selected: ' + data
    })

    const dropArea = document.getElementById('drop-area')

    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault()
        const path = event.dataTransfer.files[0].path
        myAPI.send('project-open', { path })
        fileActions.classList.remove('dragover')
    })
    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault()
        fileActions.classList.add('dragover')
    })
    dropArea.addEventListener('dragenter', (event) => {
        event.preventDefault()
        fileActions.classList.add('dragover')
    })
    dropArea.addEventListener('dragleave', (event) => {
        event.preventDefault()
        fileActions.classList.remove('dragover')
    })
}

