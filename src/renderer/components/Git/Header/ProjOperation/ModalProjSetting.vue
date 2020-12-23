<template>
    <mu-dialog class="modal-proj-setting" :title="modalTitle" :padding="30" :open.sync="data.showProjSetting" :overlay-close=false :esc-press-close=false>
        <mu-tabs :value.sync="tabProjSettingActive" inverse @change="onChangeTab" color="secondary" text-color="rgba(0, 0, 0, .54)" full-width style="margin-bottom: 15px">
            <mu-tab>{{lang["Proj Setting Module"]}}</mu-tab>
            <mu-tab v-show="hasProjConfig">{{lang["Proj Setting Path"]}}</mu-tab>
        </mu-tabs>
        <mu-flex v-if="checkingProjConfig">{{lang['Msg Checking Proj Config']}}</mu-flex>
        <!-- ------------------------------ 创建配置 ------------------------------ -->
        <mu-flex v-else-if="!hasProjConfig" direction="column">
            <mu-button round full-width color="primary" @click="gmmConfigCreateOrigin">
                <mu-icon value="settings" style="margin-right: 5px"></mu-icon>{{lang['Proj Setting Create']}}
            </mu-button>
        </mu-flex>
        <!-- ------------------------------ 模块设置 ------------------------------ -->
        <module-setting v-else-if="tabProjSettingActive == 0" :lang="lang" :moduleConfig="gmmConfigOrigin"
            @onDeleteModule="onDeleteModule" @onModifyModule="onModifyModule" @onSelectModule="onSelectModule"
            @onRemoveModule="onRemoveModule" @handleWrongDependence="handleWrongDependence">
        </module-setting>
        <!-- ------------------------------ 目录设置 ------------------------------ -->
        <path-setting v-else-if="tabProjSettingActive == 1" :lang="lang" :projFullPaths="projFullPaths" :moduleSelected="moduleSelected"
            @onSaveModulePath="onSaveModulePath">
        </path-setting>
        <mu-button slot="actions" flat color="primary" @click="closeModal">{{lang['Close']}}</mu-button>
    </mu-dialog>
</template>

<script>
    const fs = require('fs')
    const pathModule = require('path')

    import ModuleSetting from './ModalProjSetting/ModuleSetting'
    import PathSetting from './ModalProjSetting/PathSetting'

    export default {
        components: {
            ModuleSetting,
            PathSetting
        },
        props: [
            'lang',
            'langMsg',
            'data'
        ],
        data () {
            return {
                tabProjSettingActive: 0,
                checkingProjConfig: false,
                hasProjConfig: false,
                projFullPaths: {},
                gmmConfigOrigin: {},
                moduleSelected: {name: "", paths: []},
                test: 0
            }
        },
        computed: {
            modalTitle: function() {
                let info = this.hasProjConfig ? (this.tabProjSettingActive == 0 ? this.lang['Modal Info Module Setting'] : this.lang['Modal Info Path Setting']) : ""
                return this.lang['Modal Title Proj Setting'] + info
            },
            gitIgnore: function() {
                // 暂时不处理
                // 用于获取项目目录时排除git ignore的目录，该函数返回git ignore列表
            }
        },
        watch: {
            data: {
                deep: true,
                handler(val, oldval) {
                    this.checkingProjConfig = true
                    if (val.showProjSetting && val.repo) {
                        // 模态框弹出时获取项目所有目录
                        this.projFullPaths = {}
                        this.getProjPaths("/", this.projFullPaths)

                        // 模态框弹出时检测Git项目配置文件
                        this.JStorage.setDataPath(val.repo.path)
                        let that = this
                        this.JStorage.has(this._GmmConfigFileOrigin, function (error, hasKey) {
                            if (error) {
                                that.checkingProjConfig = false
                                throw error
                            }
                            if (hasKey) {
                                that.JStorage.get(that._GmmConfigFileOrigin, function (error, data) {
                                    if (error) throw error
                                    if (data) {
                                        that.gmmConfigOrigin = that.deepCopyObj(data)
                                        that.hasProjConfig = true
                                        that.checkingProjConfig = false
                                    }
                                })
                            }
                            else {
                                that.hasProjConfig = false
                                that.checkingProjConfig = false
                            }
                        })
                    }
                }
            }
        },
        methods: {
            closeModal: function() {
                this.tabProjSettingActive = 0
                this.$emit('closeModal')
            },
            onChangeTab: function() {
                this.moduleSelected = {name: "", paths: []}
            },
            readDir: function(path) {
                return new Promise((resolve, reject) => {
                    fs.readdir(path, (err, files) => {
                        if (err) reject(err)
                        resolve(files)
                    })
                })
            },
            isDirectory: function(path) {
                return new Promise((resolve, reject) => {
                    fs.stat(path, (err, stats) => {
                        if (err) reject(err)
                        resolve(stats.isDirectory())
                    })
                })
            },
            getProjPaths: async function(path, dict) {
                let fullPath = pathModule.join(this.data.repo.path, path).trim(this._PathSeperater, 'right')
                let index = fullPath.lastIndexOf(this._PathSeperater)
                let folder = index == -1 ? fullPath : fullPath.substr(index + 1)
                dict[path] = {folder: folder, subpaths: {}}
                try {
                    let dirs = await this.readDir(fullPath)
                    for(var dir of dirs) {
                        if (dir == ".git") continue
                        let fullSubPath = pathModule.join(fullPath, dir)
                        let subpath = path + dir + "/"
                        let isDirectory = await this.isDirectory(fullSubPath)
                        if (isDirectory) {
                            this.getProjPaths(subpath, dict[path].subpaths) // 父目录已经存在于字典中，无需await
                        }
                    }
                } catch(ex) {
                    this.$alert(this.langMsg['Msg Check Console'], this.langMsg['Title'])
                    console.log(ex)
                    return false
                }
            },
            gmmConfigCreateOrigin: function() {
                let that = this
                this.JStorage.setDataPath(this.data.repo.path)
                this.JStorage.set(this._GmmConfigFileOrigin, this.gmmConfigOrigin, function (error) {
                    if (error) throw error
                    that.hasProjConfig = true
                    that.$toast.success({message: that.lang['Success'], time: 1000})
                })
            },
            gmmConfigSaveOrigin: function() {
                let that = this
                this.JStorage.setDataPath(this.data.repo.path)
                this.JStorage.set(this._GmmConfigFileOrigin, this.gmmConfigOrigin, function (error) {
                    if (error) throw error
                    that.$toast.success({message: that.lang['Saved'], time: 1000})
                })
            },
            onSaveModulePath: function(config) { // 该函数同时处理模块名
                let mod = this.gmmConfigOrigin[config.oldName] || {paths: [], dependencies: [], config: {}}
                mod.paths = config.paths
                
                // 更换模块名
                if (config.oldName != "" && config.name != config.oldName) {
                    delete this.gmmConfigOrigin[config.oldName]
                    // 修改依赖的模块名
                    for(var key of Object.keys(this.gmmConfigOrigin)) {
                        let index = this.gmmConfigOrigin[key].dependencies.indexOf(config.oldName)
                        if (index > -1) this.gmmConfigOrigin[key].dependencies[index] = config.name
                    }
                }
                
                this.$set(this.gmmConfigOrigin, config.name, mod)
                this.gmmConfigSaveOrigin()
            },
            onSaveModuleDependence: function(config) {
                if (config.name.length == 0 || config.childName.length == 0) return false
                if (config.name == "gmm root") {
                    let mod = this.gmmConfigOrigin[config.childName]
                    mod.dependencies = []
                    this.$set(mod.config, 'isRoot', true)
                }
                else {
                    let mod = this.gmmConfigOrigin[config.childName]
                    if (mod.config.isRoot) delete mod.config.isRoot
                    this.$set(mod.dependencies, 0, config.name)
                }
                this.gmmConfigSaveOrigin()
            },
            onDeleteModule: function(mod) {
                this.$delete(this.gmmConfigOrigin, mod.name)
                this.onRemoveModule(mod)
            },
            onModifyModule: function(mod) {
                this.moduleSelected.name = mod.name
                this.moduleSelected.paths = this.gmmConfigOrigin[mod.name].paths
                this.tabProjSettingActive = 1
            },
            onSelectModule: function(mod) {
                if (this.moduleSelected.name == mod.name) this.moduleSelected = {name: "", paths: []} // 取消选中
                else if (mod.type == "free") { // 选中自由模块
                    this.moduleSelected.name = mod.name
                    this.moduleSelected.paths = this.gmmConfigOrigin[mod.name].paths
                }
                else if (mod.type == "graph") {
                    if (this.moduleSelected.name.length > 0) { // 关联图中模块
                        this.onSaveModuleDependence({name: mod.name, childName: this.moduleSelected.name})
                        this.moduleSelected = {name: "", paths: []}
                    }
                    else if (mod.name != "gmm root") { // 选中图中模块
                        this.moduleSelected.name = mod.name
                        this.moduleSelected.paths = this.gmmConfigOrigin[mod.name].paths
                    }
                }
            },
            onRemoveModule: function(mod) {
                let names = [mod.name]
                while(names.length > 0) {
                    let name = names.shift()
                    for(var key of Object.keys(this.gmmConfigOrigin)) {
                        let node = this.gmmConfigOrigin[key]
                        let index = node.dependencies.indexOf(name)
                        if (index > -1) {
                            node.dependencies = []
                            names.push(key)
                        }
                    }
                }
                mod = this.gmmConfigOrigin[mod.name]
                if(mod) {
                    if (mod.config.isRoot) this.$delete(mod.config, 'isRoot')
                    else if (mod.dependencies.length > 0) this.$set(mod, "dependencies", [])
                }
                this.gmmConfigSaveOrigin()
            },
            handleWrongDependence: function(list) {
                // 将依赖出错的模块变成自由模块（不改变他们的子模块）
                for(var name of list.modNames) {
                    this.gmmConfigOrigin[name].dependencies = []
                }
            }
        }
    }
</script>

<style>
    .modal-proj-setting .mu-dialog {
        max-width: 100%;
        width: calc(100vw - 50px);
        height: calc(100vh - 30px);
    }
    .modal-proj-setting .mu-dialog-body {
        padding-bottom: 0;
    }
    .modal-proj-setting .mu-checkbox-label {
        white-space: nowrap;
    }
</style>

