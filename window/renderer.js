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
    }
    serverOffBtn.onclick = () => {
        myAPI.send('server-stop')
    }

    myAPI.receive('server-info', (data) => {
        if (data.port) portInput.value = data.port
        portInput.disabled = data.running
        serverOnBtn.disabled = data.running
        serverOffBtn.disabled = !data.running
        let msg = 'Server'
        data.running 
          ? msg += ' ON' 
          : msg += ' OFF '
        if (data.localIP && data.port) {
            const url = 'http://' + data.localIP + ':' + data.port
            msg += ' @ ' + url
        }
        if (data.err) {
            msg += ' - Error: ' + data.err
        }
        serverInfo.innerHTML = msg
    })

}
function createFileActions() {

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
        dropArea.classList.remove('dragover')
    })
    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault()
        dropArea.classList.add('dragover')
    })
    dropArea.addEventListener('dragenter', (event) => {
        event.preventDefault()
        dropArea.classList.add('dragover')
    })
    dropArea.addEventListener('dragleave', (event) => {
        event.preventDefault()
        dropArea.classList.remove('dragover')
    })
}

