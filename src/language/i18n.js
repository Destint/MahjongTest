const path = require("path")
const electron = require('electron')
const fs = require('fs')

let loadedLanguage
let app = electron.app ? electron.app : electron.remote.app

module.exports = i18n

function i18n() {
    this.setLocale()
}

i18n.prototype.__ = function (key, subkey, subkey2) {
    let translation = loadedLanguage[key]
    if (subkey !== undefined) translation = translation[subkey]
    if (subkey2 !== undefined) translation = translation[subkey2]
    if (translation === undefined) {
        translation = ""
    }
    return translation
}

i18n.prototype.setLocale = function (lang) {
    if (typeof(global.__langPath) == 'undefined') return
    lang = lang || "en"
    if (!fs.existsSync(path.join(global.__langPath, lang + '.json'))) {
        lang = "en"
    }
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(global.__langPath, lang + '.json'), 'utf8'))
}