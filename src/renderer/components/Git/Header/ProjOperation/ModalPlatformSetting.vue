<template>
    <mu-dialog class="modal-proj-setting" :title="modalTitle" scrollable :padding="30" :open.sync="data.showPlatformSetting" :overlay-close=false :esc-press-close=false>
        <mu-flex v-if="checkingConfig">{{lang['Msg Checking Proj Config']}}</mu-flex>
        <mu-flex v-else-if="platformWrong">{{platformWrong}}</mu-flex>
        <mu-flex v-else direction="column">
            <mu-flex>
                <mu-text-field v-model="platformName" :label="inputLabel" :prefix="inputPrefix" :error-text="errorPlatformName" :disabled="hasPlatformConfig" style="margin-right: 15px"
                    @change="changePlatformName">
                </mu-text-field>
                <mu-text-field v-model="platformSuffix" :label="lang['Platform Suffix']"></mu-text-field>
            </mu-flex>
            <div v-if="checkingModules">{{lang['Msg Checking Modules']}}</div>
            <mu-select v-else :label="lang['Platform Module Pick']" filterable multiple chips v-model="modulesSelected" full-width :no-data-text="langMsg['Msg No Data']">
                <mu-option v-for="(mod, name) in modules" :key="name" :label="name" :value="name"></mu-option>
            </mu-select>
            <mu-button round full-width color="primary" :disabled="hasPlatformConfig" @click="onConfigPlatform">
                <mu-icon value="bug_report" style="margin-right: 5px"></mu-icon>{{btnConfig}}
            </mu-button>
        </mu-flex>
        <mu-button slot="actions" flat color="primary" @click="closeModal">{{lang['Close']}}</mu-button>
    </mu-dialog>
</template>

<script>
    const fs = require('fs')
    const pathModule = require('path')
    const mkdirp = require('mkdirp')

    export default {
        props: [
            "lang",
            "langMsg",
            "data"
        ],
        data () {
            return {
                platformName: "",
                platformSuffix: "",
                checkingConfig: false,
                checkingModules: false,
                hasPlatformConfig: false,
                modulesSelected: [],
                errorPlatformName: "",
                modules: {},
                gmmConfigPlatform: {
                    type: "",
                    dependencies: [],
                    config: {}
                }
            }
        },
        computed: {
            platformWrong: function() {
                if (this.hasPlatformConfig && this.data.type != this.gmmConfigPlatform.type) {
                    let name = ""
                    if (this.gmmConfigPlatform.type == "dev") name = this.lang['Platform Dev']
                    else if (this.gmmConfigPlatform.type == "rel") name = this.lang['Platform Rel']
                    return this.lang['Error platform inconsist'].replace("%platform%", name)
                }
                return ""
            },
            modalTitle: function() {
                if (this.data.type == 'dev') return this.lang['Platform Dev']
                else if (this.data.type == 'rel') return this.lang['Platform Rel']
                return this.lang['Platform Unknown']
            },
            btnConfig: function() {
                if (this.hasPlatformConfig) return this.lang['Save']
                else if (this.data.type == 'dev') return this.lang['Platform Dev Create']
                else if (this.data.type == 'rel') return this.lang['Platform Rel Create']
                return ""
            },
            iconCreateConfig: function() {
                if (this.data.type == 'dev') return 'bug_report'
                else if (this.data.type == 'rel') return 'launch'
                return 'help_outline'
            },
            inputLabel: function() {
                return this.lang['Platform Name'] + '(' + this.lang['Branch Name'] + ')'
            },
            inputPrefix: function() {
                return this.data.type + "_"
            },
            platformFullName: function() {
                return this.inputPrefix + this.platformName
            }
        },
        watch: {
            data: {
                deep: true,
                handler(val) {
                    this.checkingConfig = true
                    if (val.showPlatformSetting && val.repo) {
                        this.initData()
                        let that = this
                        this.JStorage.setDataPath(val.repo.path)
                        // 模态框弹出时检测平台配置文件
                        this.JStorage.has(this._GmmConfigFilePlatform, function (error, hasKey) {
                            if (error) {
                                that.checkingConfig = false
                                throw error
                            }
                            if (hasKey) {
                                that.JStorage.get(that._GmmConfigFilePlatform, function (error, data) {
                                    if (error) throw error
                                    if (data) {
                                        that.gmmConfigPlatform = that.deepCopyObj(data)
                                        that.modulesSelected = that.gmmConfigPlatform.dependencies
                                        that.hasPlatformConfig = true
                                        that.checkingConfig = false
                                        that.platformName = that.data.branch.substr(that.inputPrefix.length)
                                        that.platformSuffix = that.gmmConfigPlatform.config['suffix']
                                    }
                                })
                            }
                            else {
                                that.hasPlatformConfig = false
                                that.checkingConfig = false
                            }
                        })
                        // 模态框弹出时检测模块设置
                        this.checkingModules = true
                        this.Git(val.repo.path).show(["master:" + this._GmmConfigFileOrigin], (err, result) => {
                            if (err) throw err
                            that.modules = JSON.parse(result)
                            that.checkingModules = false
                        })
                    }
                }
            }
        },
        methods: {
            closeModal: function() {
                this.errorPlatformName = ""
                this.$emit('closeModal')
            },
            initData: function() {
                this.platformName = ""
                this.platformSuffix = ""
                this.modulesSelected = []
                this.modules = {}
            },
            onConfigPlatform: function(event) {
                if (this.platformName.length == 0) {
                    this.errorPlatformName = this.lang['Error platform name empty']
                    return
                }

                const loading = this.$loading({target: event.target, size: 24})
                
                if (this.hasPlatformConfig) {
                    this.gmmConfigSavePlatform(loading)
                }
                else {
                    let that = this
                    let waring = this.lang['Comfirm Module Create'].replace("%branch%", this.data.branch).replace("%platform%", this.platformFullName)
                    this.$confirm(waring, '', {
                        width: 500,
                        type: 'warning'
                    }).then(({ result }) => {
                        if (result) {
                            that.gmmConfigCreatePlatform(loading)
                        }
                        else {
                            loading.close()
                        }
                    })
                }
            },
            changePlatformName: function() {
                if (this.platformName.length > 0) this.errorPlatformName = ""
            },
            gmmConfigCreatePlatform: function(loading) {
                // 获取所需模块
                let mods = this.gmmConfigGetRequiredModules()
                let paths = []
                for (var modName of mods) {
                    for (var path of this.modules[modName].paths) {
                        // 若目录下无子文件且不包含子目录，直接跳过（否则Git获取时会报错）
                        if (!path.subpath) {
                            let files = fs.readdirSync(path.path)
                            let dirHasFile = false
                            for (var file of files) {
                                const fullPath = pathModule.join(path.path, file)
                                if (fs.statSync(fullPath).isFile()) {
                                    dirHasFile = true
                                    break
                                }
                            }
                            if (!dirHasFile) continue
                        }
                        // 为checkout操作准备路径
                        let subpath = path.subpath ? "" : this._PathSeperater + "*.*"
                        path = path.path + subpath
                        if (paths.indexOf(path) < 0) {
                            paths.push(path)
                        }
                    }
                }
                paths.sort()

                let masterMerge = "master@" + this.platformFullName
                let platformMerge = this.platformFullName + "@merge"
                let that = this
                this.Git(this.data.repo.path)
                    // 获取master最新commit id
                    .revparse(['master'], (err, res) => {
                        that.gmmConfigPlatform.config['masterLastCommitId'] = res.trim()
                        that.Git(that.data.repo.path)
                            // 创建master的平台合并专用分支
                            .checkoutBranch(masterMerge, "master")
                            .push("origin", masterMerge)
                            .branch(['--set-upstream', masterMerge, "origin/" + masterMerge])
                            // 切回master
                            .checkout("master")
                            // 创建空分支
                            .checkout(['--orphan', that.platformFullName])
                            .rm(['-rf', '.'])
                            // 生成平台配置文件
                            .exec(() => {
                                // 保存配置
                                that.gmmConfigPlatform.type = that.data.type
                                that.gmmConfigPlatform.dependencies = that.modulesSelected
                                that.gmmConfigPlatform.config['suffix'] = that.platformSuffix
                                // 生成配置文件
                                that.JStorage.setDataPath(that.data.repo.path)
                                that.JStorage.set(that._GmmConfigFilePlatform, that.gmmConfigPlatform, function (error) {
                                    if (error) {
                                        loading.close()
                                        throw error
                                    }

                                    that.Git(that.data.repo.path)
                                        // 拉取平台文件
                                        .checkout(["master", ...paths])
                                        // 删除模块配置文件
                                        .rm([that._GmmConfigFileOrigin])
                                        // 提交到远程
                                        .add('.')
                                        .commit('Init ' + that.platformFullName)
                                        .push("origin", that.platformFullName)
                                        .branch(['--set-upstream', that.platformFullName, "origin/" + that.platformFullName])
                                        .checkoutBranch(platformMerge, that.platformFullName)
                                        .push("origin", platformMerge)
                                        .branch(['--set-upstream', platformMerge, "origin/" + platformMerge])
                                        .checkout(that.platformFullName)
                                        // 平台版本号
                                        .revparse([that.platformFullName], (err, res) => {
                                            that.gmmConfigPlatform.config['platformLastCommitId'] = res.trim()
                                            that.JStorage.set(that._GmmConfigFilePlatform, that.gmmConfigPlatform, function (error) {
                                                if (error) {
                                                    loading.close()
                                                    throw error
                                                }
                                            })
                                        })
                                        .add(["."])
                                        .commit("Init config")
                                        .push("origin", that.platformFullName)
                                        .exec(() => {
                                            that.gmm.$emit("updateBranch", that.data.repoName)
                                            that.gmm.$emit("modifyPlatform", that.platformFullName, loading)
                                            that.hasPlatformConfig = true
                                        })
                                })
                            })
                    })
            },
            gmmConfigSavePlatform: function() {
                // 保存数据
                this.gmmConfigPlatform.type = this.data.type
                this.gmmConfigPlatform.dependencies = this.modulesSelected
                this.gmmConfigPlatform.config['suffix'] = this.platformSuffix
                // 保存文件
                let that = this
                this.JStorage.setDataPath(this.data.repo.path)
                this.JStorage.set(this._GmmConfigFilePlatform, this.gmmConfigPlatform, function (error) {
                    if (error) throw error
                    that.gmm.$emit("updateBranch", that.data.repoName)
                    that.gmm.$emit("modifyPlatform")
                    that.hasPlatformConfig = true
                    that.$toast.success({message: that.lang['Success'], time: 1000})
                })
            },
            gmmConfigGetRequiredModules: function() {
                let mods = []
                for (var modName of this.modulesSelected) { // 选中的模块
                    if (mods.indexOf(modName) < 0) mods.push(modName)
                }
                for (var modName of mods) { // 选中模块的依赖
                    for (var parentName of this.modules[modName].dependencies) {
                        if (mods.indexOf(parentName) < 0) mods.push(parentName)
                    }
                }
                return mods
            }
        }
    }
</script>
