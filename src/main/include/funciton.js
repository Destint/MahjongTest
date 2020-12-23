export function initConfig(callback) {
    // Init config
    // console.log(JStorage.getDefaultDataPath())
    JStorage.setDataPath(JStorage.getDefaultDataPath())
    JStorage.has(_AppConfigFile, function (error, hasKey) {
        if (error) throw error
        if (hasKey) {
            JStorage.get(_AppConfigFile, function (error, data) {
                if (error) throw error
                if (data) {
                    for (var key in data) {
                        _AppConfig[key] = data[key]
                    }
                }
                _AppConfigReady = true
                initLocale()
                callback()
            })
        }
        else {
            JStorage.set(_AppConfigFile, _AppConfig, function (error) {
                if (error) throw error
            })
            _AppConfigReady = true
            initLocale()
            callback()
        }
    })
}

export function saveConfig() {
    // Cannot be called when close window(or quit), the config file will be locked
    JStorage.setDataPath(JStorage.getDefaultDataPath())
    JStorage.set(_AppConfigFile, _AppConfig, function (error) {
        if (error) throw error
    })
}

export function initLocale() {
    i18n.setLocale(_AppConfig.Locale)
}

export function setLocale(lang) {
    if (lang && typeof lang == "string" && lang.length > 0 && _AppConfig.Locale != lang) {
        _AppConfig.Locale = lang
        i18n.setLocale(lang)
        saveConfig()
    }
}

export function getLocale() {
    return _AppConfig.Locale
}

export function repoSave(repo, path) {
    if (typeof(repo) == "undefined" || repo.length == 0) return
    if (!(repo in _AppConfig.Repo)) {
        _AppConfig.Repo[repo] = {
            selected: true,
            path: path
        }
    }
    for (var key in _AppConfig.Repo) {
        _AppConfig.Repo[key].selected = key == repo
    }
    saveConfig()
}

export function repoRemove(repo) {
    if (typeof(repo) == "undefined" || repo.length == 0) return
    delete _AppConfig.Repo[repo]
    saveConfig()
}

export function repoSelect(repo) {
    if (typeof(repo) == "undefined" || repo.length == 0) return
    for (var key in _AppConfig.Repo) {
        _AppConfig.Repo[key].selected = key == repo
    }
    saveConfig()
}

export function developerSelect(developer) {
    if (typeof(developer) == "undefined" || developer.length == 0) return
    _AppConfig.CurDeveloper = developer
    saveConfig()
}

export function developerAdd(developer) {
    if (typeof(developer) == "undefined" || developer.length == 0) return
    _AppConfig.Developer = [developer, ..._AppConfig.Developer]
    if (_AppConfig.Developer.length == 1) _AppConfig.CurDeveloper = developer
    saveConfig()
}

export function developerRemove(developer) {
    if (typeof(developer) == "undefined" || developer.length == 0) return
    let index = _AppConfig.Developer.indexOf(developer)
    if (index == -1) return
    _AppConfig.Developer.splice(index, 1)
    // 修改选中的开发者
    if (_AppConfig.Developer.length > 0) {
        if (developer == _AppConfig.CurDeveloper) _AppConfig.CurDeveloper = _AppConfig.Developer[0]
    }
    else _AppConfig.CurDeveloper = ""
    saveConfig()
}