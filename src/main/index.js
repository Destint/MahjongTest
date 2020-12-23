import { app, BrowserWindow, Menu, ipcMain } from 'electron'
global.JStorage = require('electron-json-storage')
global.i18n = new (require('../language/i18n'))
const Path = require('path')
import * as Func from './include/funciton'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = Path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}
global.__langPath = process.env.NODE_ENV === 'development'
    ? Path.join(__dirname, "../language")
    : Path.join(process.resourcesPath, "src/language")
global.__assetsPath = process.env.NODE_ENV === 'development'
    ? Path.join(__dirname, "../assets")
    : Path.join(process.resourcesPath, "src/assets")

/**
 * Globals
 */
global.Func = Func
global._AppConfigFile = "/gmmconfig.json"
global._AppConfigReady = false
global._AppConfig = {
    Locale: "zh-CN",
    Theme: "",
    CurDeveloper: "",
    Developer: [],
    Repo: {}
}

/**
 * App
 */
let mainWindow = null
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow() {
    if (!mainWindow) {
        mainWindow = new BrowserWindow({
            width: 1300,
            height: 750,
            minWidth: 785,
            minHeight: 450,
            useContentSize: true,
            show: false,
            title: ""
        })

        mainWindow.loadURL(winURL)

        mainWindow.on('closed', () => {
            mainWindow = null
        })

        mainWindow.on('page-title-updated', (event) => {
            event.preventDefault()
        })

        mainWindow.on('focus', () => {
            mainWindow.webContents.send('mainWindow-onFocus')
        })
    }

    if (global._AppConfigReady) {
        menuInit()
        mainWindow.setTitle(i18n.__('App Name'))
        mainWindow.show()
    }
}

function startApp() {
    /**
     * Config
     */
    Func.initConfig(createWindow)
}

app.on('ready', startApp)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

/**
 * Menu
 */
function getMenuTemplate() {
    let curLang = Func.getLocale()

    let developers = _AppConfig.Developer
    let developerMenu = [
        {
            label: i18n.__('Menu', 'Developer Manager'),
            accelerator: 'CmdOrCtrl+D',
            click: manageDeveloper
        },
        { type: 'separator' }
    ]
    for(var index = 0; index < developers.length; index++) {
        developerMenu.push({
            label: developers[index],
            type: "radio",
            checked: developers[index] == _AppConfig.CurDeveloper,
            click: changeDeveloper
        })
    }

    let template = [
        {
            label: i18n.__('Menu', 'Developer') + (_AppConfig.CurDeveloper == "" ? "" : "(" + _AppConfig.CurDeveloper + ")"),
            submenu: developerMenu
        },
        {
            label: i18n.__('Menu', 'Manager'),
            submenu: [
                {
                    label: i18n.__('Menu', 'Git'),
                    accelerator: 'CmdOrCtrl+Q',
                    click: changeApp
                },
                {
                    label: i18n.__('Menu', 'Img'),
                    accelerator: 'CmdOrCtrl+W',
                    click: changeApp
                },
                {
                    label: i18n.__('Menu', 'Laya'),
                    accelerator: 'CmdOrCtrl+E',
                    click: changeApp
                },
                {
                    label: i18n.__('Menu', 'Server'),
                    accelerator: 'CmdOrCtrl+T',
                    click: changeApp
                },
                { type: 'separator' },
                { role: 'quit', label: i18n.__('Menu', 'Quit') }
            ]
        },
        {
            label: i18n.__('Menu', 'Edit'),
            submenu: [
                { label: i18n.__('Menu', 'Cut'), accelerator: "CmdOrCtrl+X", role: "cut" },
                { label: i18n.__('Menu', 'Copy'), accelerator: "CmdOrCtrl+C", role: "copy" },
                { label: i18n.__('Menu', 'Paste'), accelerator: "CmdOrCtrl+V", role: "paste" },
                { label: i18n.__('Menu', 'Select all'), accelerator: "CmdOrCtrl+A", role: "selectAll" }
            ]
        },
        {
            label: i18n.__('Menu', 'View'),
            submenu: [
                { role: 'zoomin', label: i18n.__('Menu', 'Zoom in'), accelerator: 'CmdOrCtrl+=' },
                { role: 'zoomout', label: i18n.__('Menu', 'Zoom out') },
                { role: 'resetzoom', label: i18n.__('Menu', 'Zoom reset') },
                { type: 'separator' },
                { role: 'toggleFullScreen', label: i18n.__('Menu', 'Toggle fullscreen') }
            ]
        },
        {
            label: i18n.__('Menu', 'Help'),
            submenu: [
                { role: 'toggledevtools', label: i18n.__('Menu', 'Toggle devtools') },
                { type: 'separator' },
                {
                    label: i18n.__('Menu', 'About'),
                    click() { }
                }
            ]
        },
        {
            label: i18n.__('Menu', 'Language'),
            submenu: [
                {
                    id: "zh-CN",
                    label: i18n.__('Menu', "Simplified Chinese"),
                    type: "radio",
                    enabled: true,
                    checked: curLang == "zh-CN",
                    icon: __assetsPath + "/locale/china@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "zh-TW",
                    label: i18n.__('Menu', "Traditional Chinese"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "zh-TW",
                    icon: __assetsPath + "/locale/hongkong@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "en",
                    label: i18n.__('Menu', "English"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "en",
                    icon: __assetsPath + "/locale/uk@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "ja",
                    label: i18n.__('Menu', "Japanese"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "ja",
                    icon: __assetsPath + "/locale/japan@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "ko",
                    label: i18n.__('Menu', "Korean"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "ko",
                    icon: __assetsPath + "/locale/korea@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "fr",
                    label: i18n.__('Menu', "Franch"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "ft",
                    icon: __assetsPath + "/locale/france@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "de",
                    label: i18n.__('Menu', "German"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "de",
                    icon: __assetsPath + "/locale/germany@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "it",
                    label: i18n.__('Menu', "Italian"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "it",
                    icon: __assetsPath + "/locale/italy@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "pt",
                    label: i18n.__('Menu', "Portuguese"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "pt",
                    icon: __assetsPath + "/locale/portugal@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "es",
                    label: i18n.__('Menu', "Spanish"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "es",
                    icon: __assetsPath + "/locale/spain@16x16.png",
                    click: changeLanguage
                },
                {
                    id: "ru",
                    label: i18n.__('Menu', "Russian"),
                    type: "radio",
                    enabled: false,
                    checked: curLang == "ru",
                    icon: __assetsPath + "/locale/russia@16x16.png",
                    click: changeLanguage
                },
            ]
        }
    ]

    return template
}

/**
 * Menu Operation
 */
function menuInit() {
    const menu = Menu.buildFromTemplate(getMenuTemplate())
    Menu.setApplicationMenu(menu)
}

function changeLanguage(menuItem, browserWindow, event) {
    if (menuItem.id != _AppConfig.Locale) {
        Func.setLocale(menuItem.id)
        menuInit()
    }
}

function changeDeveloper(menuItem, browserWindow, event) {
    if (menuItem.label != _AppConfig.CurDeveloper) {
        Func.developerSelect(menuItem.label)
        menuInit()
    }
}

function manageDeveloper(menuItem, browserWindow, event) {
    mainWindow.webContents.send('developer-manager-onShow', {developers: _AppConfig.Developer})
}

function changeApp(menuItem, browserWindow, event) {
    mainWindow.webContents.send('manager-onChangeApp', {app: menuItem.label})
}

/**
 * ipcMain
 */
ipcMain.on("repo-save", (event, repo, path) => {
    Func.repoSave(repo, path)
    event.returnValue = _AppConfig.Repo
})

ipcMain.on("repo-remove", (event, repo) => {
    Func.repoRemove(repo)
    event.returnValue = _AppConfig.Repo
})

ipcMain.on("repo-select", (event, repo) => {
    Func.repoSelect(repo)
    event.returnValue = _AppConfig.Repo
})

ipcMain.on("developer-add", (event, developer) => {
    Func.developerAdd(developer)
    menuInit()
    event.returnValue = _AppConfig.Developer
})

ipcMain.on("developer-remove", (event, developer) => {
    Func.developerRemove(developer)
    menuInit()
    event.returnValue = _AppConfig.Developer
})