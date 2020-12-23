<template>
    <mu-flex class="header-item header-dark">
        <mu-list class="menu">
            <mu-list-item button :ripple=false ref="btnProj" @click="showProjMenu = !showProjMenu">
                <mu-list-item-action class="menu-icon">
                    <svg-icon name="mark-github" scale="150"></svg-icon>
                </mu-list-item-action>
                <mu-list-item-content>
                    <mu-list-item-title class="title">{{lang['Project']}}</mu-list-item-title>
                </mu-list-item-content>
                <mu-list-item-action style="min-width: 30px;">
                    <svg-icon class="toggle-icon" :class="{'toggle-open': showProjMenu}" name="chevron-down" scale="100"></svg-icon>
                </mu-list-item-action>
            </mu-list-item>
        </mu-list>
        <mu-popover placement="bottom-end" :open.sync="showProjMenu" :trigger="trigger_proj">
            <mu-list dense>
                <mu-list-item :class="{'menu-disabled': projLocked}" :button="!projLocked" @click="getProjLock">
                    <mu-icon class="proj-icon" value="lock"></mu-icon>
                    <mu-list-item-title>{{lang['Project Lock']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="releaseProjLock">
                    <mu-icon class="proj-icon" value="lock_open"></mu-icon>
                    <mu-list-item-title>{{lang['Project Unlock']}}</mu-list-item-title>
                </mu-list-item>
                <mu-divider></mu-divider>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="projFetched = true">
                    <mu-icon class="proj-icon" value="autorenew"></mu-icon>
                    <mu-list-item-title>{{lang['Project Fetch']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': !projLocked || !projFetched}" :button="projLocked && projFetched" @click="onProjPull">
                    <mu-icon class="proj-icon" value="assignment_returned"></mu-icon>
                    <mu-list-item-title>{{lang['Project Pull']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': true || !projLocked || !projFetched}" :button="false && projLocked && projFetched" @click="onProjPush">
                    <mu-icon class="proj-icon" value="backup"></mu-icon>
                    <mu-list-item-title>{{lang['Project Push']}}</mu-list-item-title>
                </mu-list-item>
                <mu-divider></mu-divider>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="showModalProjSetting">
                    <mu-icon class="proj-icon" value="settings"></mu-icon>
                    <mu-list-item-title>{{lang['Project Module Setting']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="showModalPlatformSetting('dev')">
                    <mu-icon class="proj-icon" value="bug_report"></mu-icon>
                    <mu-list-item-title>{{lang['Project Develop']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="showModalPlatformSetting('rel')">
                    <mu-icon class="proj-icon" value="launch"></mu-icon>
                    <mu-list-item-title>{{lang['Project Release']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item :class="{'menu-disabled': !projLocked}" :button="projLocked" @click="modifyPlatform()">
                    <mu-icon class="proj-icon" value="build"></mu-icon>
                    <mu-list-item-title>{{lang['Platform Modify']}}</mu-list-item-title>
                </mu-list-item>
            </mu-list>
        </mu-popover>
        <!-- -------------------------------- Proj Operation Modal -------------------------------- -->
        <modal-proj-setting :lang="lang" :langMsg="langMsg" :data="modalProjSettingData" @closeModal="showProjSetting = false"></modal-proj-setting>
        <modal-platform-setting :lang="lang" :langMsg="langMsg" :data="modalPlatformSettingData" @closeModal="showPlatformSetting = false"></modal-platform-setting>
        <!-- -------------------------------- Proj Operation End -------------------------------- -->
        <!-- ---------------------------- Proj Operation Process Modal ---------------------------- -->
        <mu-dialog :title="curOperation" :open="curOperation.length > 0" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-flex>{{operationProgress + "%"}}</mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="operationProgress" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-button slot="actions" flat color="primary" @click="curOperation = ''">{{lang['Close']}}</mu-button>
        </mu-dialog>
        <!-- ---------------------------- Proj Operation Process Modal End ---------------------------- -->
    </mu-flex>
</template>

<script>
    const fs = require('fs')
    const pathMod = require("path")

    // 项目级操作
    import ModalProjSetting from "./ProjOperation/ModalProjSetting.vue"
    import ModalPlatformSetting from "./ProjOperation/ModalPlatformSetting.vue"

    export default {
        props: ['lang', 'langMsg', 'data'],
        components: {
            ModalProjSetting,
            ModalPlatformSetting
        },
        data () {
            return {
                showProjMenu: false,
                showProjSetting: false,
                showPlatformSetting: false,
                trigger_proj: null,
                projLocked: false,
                projFetched: false,
                platformType: null,
                curOperation: "",
                operationProgress: 0
            }
        },
        computed: {
            modalProjSettingData () {
                return {
                    showProjSetting: this.showProjSetting,
                    repo: this.data.repo
                }
            },
            modalPlatformSettingData () {
                return {
                    showPlatformSetting: this.showPlatformSetting,
                    repoName: this.data.repoOpened,
                    repo: this.data.repo,
                    branch: this.data.branchSelected,
                    type: this.platformType
                }
            },
            repoPath () {
                return this.data.repo.path
            }
        },
        mounted () {
            let that = this
            this.trigger_proj = this.$refs.btnProj.$el

            // 修改平台文件，比如bin/index和AppMacros
            this.gmm.$on("modifyPlatform", (branchName, loading) => {
                branchName = branchName || that.data.branchSelected

                // 获取平台配置
                that.JStorage.setDataPath(that.data.repo.path)
                that.JStorage.get(that._GmmConfigFilePlatform, function (error, data) {
                    if (error) throw error
                    if (data) {
                        let platformConfig = that.deepCopyObj(data)
                        // 获取项目配置
                        that.Git(that.data.repo.path).show(["master:" + that._GmmConfigFileOrigin], (err, result) => {
                            if (err) throw err
                            let moduleConfig = JSON.parse(result)
                            let mods = that.getPlatformRequiredModules(platformConfig.dependencies, moduleConfig)
                            
                            // 修改 bin/index.html
                            let fileIndex = pathMod.join(that.data.repo.path, "bin/index.html")
                            if (fs.existsSync(fileIndex)) {
                                let content = fs.readFileSync(fileIndex).toString().split("\n")
                                let newContent = []
                                let isModContent = true
                                for (var line of content) {
                                    if (line.indexOf("<!--") > -1 && line.indexOf("Mod:") > -1) { // 模块标签
                                        let index = line.indexOf("Mod:")
                                        if (isModContent) {
                                            if (line.indexOf(":start", index + 4) > -1) { // 判断平台依赖模块开头
                                                let index2 = line.indexOf(":start", index + 4)
                                                let mod = line.substring(index + 4, index2).trim()
                                                if (mods.indexOf(mod) == -1) isModContent = false // 不是平台依赖模块
                                                else newContent.push(line) // 是平台依赖模块
                                            }
                                            else if (line.indexOf(":end", index + 4) > -1) { // 平台依赖模块结尾
                                                newContent.push(line)
                                            }
                                            else newContent.push(line) // 普通注释
                                        }
                                        else if (!isModContent && line.indexOf(":end", index + 4) > -1) { // 非平台依赖模块结尾
                                            isModContent = true
                                        }
                                    }
                                    else if (isModContent) newContent.push(line) // 非模块标签内容
                                }
                                newContent = newContent.join("\n")
                                fs.writeFileSync(fileIndex, newContent)
                            }

                            // 修改 AppMacros
                            let fileAppMacros = pathMod.join(that.data.repo.path, "src/AppMacros.js")
                            if (fs.existsSync(fileAppMacros)) {
                                let content = fs.readFileSync(fileAppMacros).toString()
                                let platformName = branchName.substr(platformConfig.type.length + 1) // 去除dev_或rel_前缀
                                let mode = "var PreRunMode = RunMode." + platformName
                                mode += platformConfig.config.suffix ? "." + platformConfig.config.suffix : ""
                                mode += ";"
                                let newContent = content.replace(/var PreRunMode = RunMode\.[^;]+;/, mode)
                                fs.writeFileSync(fileAppMacros, newContent)
                            }
                            
                            if (loading) loading.close()
                            that.$toast.success({message: that.lang['Success'], time: 1000})
                        })
                    }
                })
            })
        },
        methods: {
            getProjLock: function() {
                this.projLocked = true
            },
            releaseProjLock: function() {
                this.projLocked = false
                this.projFetched = false
            },
            showModalProjSetting: function() {
                this.showProjSetting = true
                this.showProjMenu = false
            },
            showModalPlatformSetting: function(type) {
                this.platformType = type
                this.showPlatformSetting = true
                this.showProjMenu = false
            },
            onProjPull: function(event) {
                let that = this
                this.$confirm(this.lang['Comfirm Proj Pull'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.curOperation = that.lang['Project Pull']
                        that.operationProgress = 0
                        
                        let platformBranch = that.data.branchSelected
                        let platformMergeBranch = platformBranch + "@merge"
                        let masterMergeBranch = "master@" + platformBranch
                        // 获取平台配置
                        that.JStorage.setDataPath(that.repoPath)
                        that.JStorage.has(that._GmmConfigFilePlatform, function (error, hasKey) {
                            if (error) throw error
                            if (hasKey) {
                                that.JStorage.get(that._GmmConfigFilePlatform, function (error, config) {
                                    if (error) throw error
                                    if (config) {
                                        that.operationProgress = 5
                                        // 获取平台所有路径
                                        that.getPlatformPaths(config.dependencies)
                                            .then((paths) => {
                                                that.operationProgress = 10
                                                that.Git(that.repoPath)
                                                    // 更新各分支
                                                    .checkout('master')
                                                    .pull(() => {that.operationProgress = 20})
                                                    .checkout(masterMergeBranch)
                                                    .pull()
                                                    .merge(["master"])
                                                    .push(() => {that.operationProgress = 30})
                                                    .checkout(platformMergeBranch)
                                                    .pull()
                                                    // 检查上次跟master同步之后master是否又有更新
                                                    .diff([config.config.masterLastCommitId, "master"], (err, res) => {
                                                        if (res && res.length > 0) {
                                                            that.operationProgress = 45
                                                            let updateList = []
                                                            let removeList = []
                                                            // 处理删除及更新文件列表
                                                            res = res.split("\n")
                                                            for(var index = 0; index < res.length; index++) {
                                                                if (res[index].indexOf("deleted file mode") == 0) { // master里删除的文件
                                                                    let line = res[index - 1]
                                                                    if (that.isGitCheckoutFile(line)) {
                                                                        let first = line.indexOf(" b/")
                                                                        let last = line.lastIndexOf(" b/")
                                                                        while(first != last) { // 避免文件夹名字有" b"
                                                                            first = line.indexOf(" b/", first + 1)
                                                                            last = line.lastIndexOf(" b/", last - 1)
                                                                        }
                                                                        let file = line.substr(first + 3).trim() // 格式： b/a.txt，去掉 b/
                                                                        let path = pathMod.join(that.repoPath, file)
                                                                        if (removeList.indexOf(file) == -1 && fs.existsSync(path)) {
                                                                            removeList.push(file)
                                                                        }
                                                                    }
                                                                }
                                                                else if (res[index].indexOf("+++ /dev/null") == 0) { // master里删除的文件
                                                                    let line = res[index - 1]
                                                                    if (line.indexOf("---") == 0 && that.isGitCheckoutFile(line)) {
                                                                        let file = line.substr(6).trim() // 格式：--- a/a.txt，去掉--- a/
                                                                        let path = pathMod.join(that.repoPath, file)
                                                                        if (removeList.indexOf(file) == -1 && fs.existsSync(path)) {
                                                                            removeList.push(file)
                                                                        }
                                                                    }
                                                                }
                                                                else if (res[index].indexOf("+++ b/") == 0) { // master里更新的文件
                                                                    if (that.isGitCheckoutFile(res[index])) {
                                                                        let file = res[index].substr(6).trim()
                                                                        if (that.checkFileInPaths(paths, pathMod.join(that.repoPath, file))) {
                                                                            updateList.push(file)
                                                                        }
                                                                    }
                                                                }
                                                                else if (res[index].indexOf("rename to ") == 0) { // master新添加的文件（多为空白文件）
                                                                    if (that.isGitCheckoutFile(res[index])) {
                                                                        let file = res[index].substr(10).trim()
                                                                        if (that.checkFileInPaths(paths, pathMod.join(that.repoPath, file))) {
                                                                            updateList.push(file)
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            that.operationProgress = 50

                                                            if (removeList.length > 0) { // 删除文件
                                                                that.Git(that.repoPath).rm(removeList, () => {
                                                                    that.operationProgress = 60
                                                                })
                                                            }
                                                            
                                                            if (updateList.length > 0) { // 更新文件
                                                                that.Git(that.repoPath).checkout(["master", ...updateList], () => {
                                                                    that.operationProgress = 70
                                                                })
                                                            }

                                                            that.Git(that.repoPath)
                                                                .checkout(platformBranch)
                                                                .merge([platformMergeBranch], () => {that.operationProgress = 80})
                                                                // 获取master最新commit id
                                                                .revparse(['master'], (err, res) => {
                                                                    that.operationProgress = 90
                                                                    // 平台配置里记录拉取后的master commit id
                                                                    config.config.masterLastCommitId = res.trim()
                                                                    config = JSON.parse(JSON.stringify(config))
                                                                    that.JStorage.set(that._GmmConfigFilePlatform, config, function (error) {
                                                                        if (error) throw error

                                                                        that.Git(that.repoPath)
                                                                            .add(['.'])
                                                                            .commit("@Project Pull Ver")
                                                                            .push()
                                                                            // 单独拉取要修改的平台文件
                                                                            .checkout(["master", "bin/index.html", "src/AppMacros.js"], () => {
                                                                                that.operationProgress = 100
                                                                                that.gmm.$emit("updateRepo", that.data.repoOpened)
                                                                                that.gmm.$emit("modifyPlatform")
                                                                            })
                                                                    })
                                                                })
                                                        }
                                                        else {
                                                            that.operationProgress = 100
                                                            that.$toast.info(that.lang['Msg Platform Already Update-to-date'])
                                                        }
                                                    })
                                            })
                                            .catch((err) => {
                                                that.$toast.error(that.lang['Error cannot get platform paths'])
                                            })
                                    }
                                })
                            }
                            else {
                                that.$toast.error(that.lang['Error platform config not found'])
                            }
                        })
                    }
                })
            },
            onProjPush: function() {
                let that = this
                this.$confirm(this.lang['Comfirm Proj Push'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.curOperation = that.lang['Project Push']
                        that.operationProgress = 0
                        
                        let platformBranch = that.data.branchSelected
                        let platformMergeBranch = platformBranch + "@merge"
                        let masterMergeBranch = "master@" + platformBranch
                        // 获取平台配置
                        that.JStorage.setDataPath(that.repoPath)
                        that.JStorage.has(that._GmmConfigFilePlatform, function (error, hasKey) {
                            if (error) throw error
                            if (hasKey) {
                                that.JStorage.get(that._GmmConfigFilePlatform, function (error, config) {
                                    if (error) throw error
                                    if (config) {
                                        that.operationProgress = 10
                                        that.Git(that.repoPath)
                                            // 更新各分支
                                            .checkout(masterMergeBranch)
                                            .pull(() => {that.operationProgress = 30})
                                            // 检查上次跟master同步之后平台是否又有更新
                                            .diff([config.config.platformLastCommitId, platformBranch], (err, res) => {
                                                if (res && res.length > 0) {
                                                    that.operationProgress = 45
                                                    let updateList = []
                                                    let removeList = []
                                                    // 处理删除及更新文件列表
                                                    res = res.split("\n")
                                                    for(var index = 0; index < res.length; index++) {
                                                        if (res[index].indexOf("deleted file mode") == 0) { // 平台里删除的文件
                                                            let line = res[index - 1]
                                                            if (that.isGitCheckoutFile(line)) {
                                                                let first = line.indexOf(" b/")
                                                                let last = line.lastIndexOf(" b/")
                                                                while(first != last) { // 避免文件夹名字有" b"
                                                                    first = line.indexOf(" b/", first + 1)
                                                                    last = line.lastIndexOf(" b/", last - 1)
                                                                }
                                                                let file = line.substr(first + 3).trim() // 格式： b/a.txt，去掉 b/
                                                                let path = pathMod.join(that.repoPath, file)
                                                                if (removeList.indexOf(file) == -1 && fs.existsSync(path)) {
                                                                    removeList.push(file)
                                                                }
                                                            }
                                                        }
                                                        else if (res[index].indexOf("+++ /dev/null") == 0) { // 平台里删除的文件
                                                            let line = res[index - 1]
                                                            if (line.indexOf("---") == 0 && that.isGitCheckoutFile(line)) {
                                                                let file = line.substr(6).trim() // 格式：--- a/a.txt，去掉--- a/
                                                                let path = pathMod.join(that.repoPath, file)
                                                                if (removeList.indexOf(file) == -1 && fs.existsSync(path)) {
                                                                    removeList.push(file)
                                                                }
                                                            }
                                                        }
                                                        else if (res[index].indexOf("+++ b/") == 0) { // 平台里更新的文件
                                                            if (that.isGitCheckoutFile(res[index])) {
                                                                let file = res[index].substr(6).trim()
                                                                updateList.push(file)
                                                            }
                                                        }
                                                        else if (res[index].indexOf("rename to ") == 0) { // 平台新添加的文件（多为空白文件）
                                                            if (that.isGitCheckoutFile(res[index])) {
                                                                let file = res[index].substr(10).trim()
                                                                updateList.push(file)
                                                            }
                                                        }
                                                    }

                                                    that.operationProgress = 50

                                                    if (removeList.length > 0) { // 删除文件
                                                        that.Git(that.repoPath).rm(removeList, () => {
                                                            that.operationProgress = 60
                                                        })
                                                    }
                                                    if (updateList.length > 0) { // 更新文件
                                                        that.Git(that.repoPath).checkout([platformBranch, ...updateList], () => {
                                                            that.operationProgress = 70
                                                        })
                                                    }

                                                    that.Git(that.repoPath)
                                                        .checkout("master")
                                                        .merge([masterMergeBranch])
                                                        .push(() => {that.operationProgress = 80})
                                                        // 获取平台最新commit id
                                                        .checkout(platformBranch)
                                                        .revparse([platformBranch], (err, res) => {
                                                            that.operationProgress = 90
                                                            // 平台配置里记录拉取后的master commit id
                                                            config.config.platformLastCommitId = res.trim()
                                                            config = JSON.parse(JSON.stringify(config))
                                                            that.JStorage.set(that._GmmConfigFilePlatform, config, function (error) {
                                                                if (error) throw error

                                                                that.Git(that.repoPath)
                                                                    .add(["."])
                                                                    .commit("@Project Push Ver")
                                                                    .push(() => {that.operationProgress = 95})
                                                                    .checkout(platformMergeBranch)
                                                                    .merge([platformBranch])
                                                                    .push(() => {
                                                                        that.operationProgress = 100
                                                                        that.$toast.success({message: that.lang['Success'], time: 1000})
                                                                        that.gmm.$emit("updateRepo", that.data.repoOpened)
                                                                    })
                                                            })
                                                        })
                                                }
                                                else {
                                                    that.operationProgress = 100
                                                    that.$toast.info(that.lang['Msg Master Already Update-to-date'])
                                                }
                                            })
                                    }
                                })
                            }
                            else {
                                that.$toast.error(that.lang['Error platform config not found'])
                            }
                        })
                    }
                })
            },
            getPlatformPaths: function(mods) {
                let that = this
                let p = new Promise((resolve, reject) => {
                    if (!mods || mods.length == 0) {
                        reject(mods)
                        return
                    }
                    
                    that.Git(that.repoPath).show(["master:" + that._GmmConfigFileOrigin], (err, result) => {
                        if (err) throw err

                        // 获取平台所有需要的模块
                        let modules = JSON.parse(result)
                        mods = [...mods] // 防止改变原参数
                        for (var index = 0; index < mods.length; index++) {
                            let dependencies = modules[mods[0]].dependencies
                            if (dependencies.length > 0) {
                                for (var modName of dependencies) {
                                    if (mods.indexOf(modName) < 0) mods.push(modName)
                                }
                            }
                        }

                        let paths = []
                        for (var modName of mods) {
                            for (var path of modules[modName].paths) {
                                if (path.subpath) path = path.path + that._PathSeperater + "*" // 有子文件夹
                                else path = path.path + that._PathSeperater + "*.*" // 没有子文件夹
                                paths.push(path)
                            }
                        }
                        
                        resolve(paths)
                    })
                })
                return p
            },
            checkFileInPaths: function(paths, filePath) { // 参数：绝对路径
                // path格式：
                // 包含子目录：...\*
                // 不包含子目录：...\*.*
                if ("/" != this._PathSeperater) filePath = filePath.replace("/", this._PathSeperater)
                for(var path of paths) {
                    if (path.lastIndexOf("*.*") == path.length - 3) { // 不包含子目录
                        path = path.substr(0, path.length - 3)
                        if (filePath.indexOf(path) == 0) { // 绝对路径肯定从索引0开始匹配
                            let file = filePath.substr(path.length)
                            if (file.indexOf(this._PathSeperater) == -1) {
                                return true
                            }
                        }
                    }
                    else if (path.lastIndexOf("*") == path.length - 1) { // 包含子目录
                        path = path.substr(0, path.length - 1)
                        if (filePath.indexOf(path) == 0) { // 绝对路径肯定从索引0开始匹配
                            return true
                        }
                    }
                    else {
                        // 指定文件，待扩充
                    }
                }
                return false
            },
            getPlatformRequiredModules: function(dependencies, allmods) {
                let mods = []
                for (var modName of dependencies) { // 选中的模块
                    if (mods.indexOf(modName) < 0) mods.push(modName)
                }
                for (var modName of mods) { // 选中模块的依赖
                    for (var parentName of allmods[modName].dependencies) {
                        if (mods.indexOf(parentName) < 0) mods.push(parentName)
                    }
                }
                return mods
            },
            isGitCheckoutFile: function(line) { // 是否是项目级操作时可以拉取推送的文件
                return line.indexOf(this._GmmConfigFileOrigin) < 0
                    && line.indexOf(this._GmmConfigFilePlatform) < 0
                    && line.indexOf("bin/index.html") < 0
                    && line.indexOf("src/AppMacros.js") < 0
            },
            modifyPlatform: function() {
                this.gmm.$emit("modifyPlatform")
            }
        }
    }
</script>

<style>
    .menu-disabled .mu-item {
        color: grey;
    }
</style>
