<template>
    <mu-dialog title="" width="500" :open.sync="data.showAddRepo" :overlay-close=false :esc-press-close=false>
        <mu-tabs :value.sync="tabAddRepoActive" inverse color="secondary" text-color="rgba(0, 0, 0, .54)" full-width style="margin-bottom: 15px">
            <mu-tab>{{lang["Clone Repo"]}}</mu-tab>
            <mu-tab>{{lang["Add Exist Repo"]}}</mu-tab>
        </mu-tabs>
        <!-- -------------------------------- Clone -------------------------------- -->
        <mu-container v-if="tabAddRepoActive == 0">
            <mu-text-field v-model="cloneURL" :placeholder="lang['Remote Git URL']" full-width :error-text="errorCloneUrl" @change="changeCloneUrl"></mu-text-field>
            <mu-flex>
                <mu-text-field v-model="localPath" :placeholder="lang['Local Path']" full-width :error-text="errorCloneLocal" @change="changeCloneLocalPath"></mu-text-field>
                <mu-button @click="showOpenDirectory(chooseLocalPath)">{{lang['Local Path Choose']}}</mu-button>
            </mu-flex>
            <mu-flex justify-content="center">
                <mu-button @click="gitClone" v-if="!cloning">{{lang['Clone']}}</mu-button>
            </mu-flex>
            <div style="overflow: hidden" v-if="cloning">{{msgClone}}</div>
            <mu-linear-progress :value="cloneProgress" :size="15" :max="cloneProgressMax" mode="determinate" color="green" v-if="cloning"></mu-linear-progress>
        </mu-container>
        <!-- -------------------------------- Clone End -------------------------------- -->
        <!-- -------------------------------- Add Local -------------------------------- -->
        <mu-container v-if="tabAddRepoActive == 1">
            <mu-flex>
                <mu-text-field v-model="localPath" :placeholder="lang['Local Path']" full-width :error-text="errorAddLocalPath" @change="changeAddLocalPath"></mu-text-field>
                <mu-button @click="showOpenDirectory(chooseLocalPath)">{{lang['Local Path Choose']}}</mu-button>
            </mu-flex>
            <mu-flex justify-content="center">
                <mu-button @click="addLocal">{{lang['Add Local']}}</mu-button>
            </mu-flex>
        </mu-container>
        <!-- -------------------------------- Add Local End -------------------------------- -->
        <mu-button slot="actions" flat color="primary" @click="closeModal">{{lang['Close']}}</mu-button>
    </mu-dialog>
</template>

<script>
    const { dialog } = require('electron').remote
    const { exec } = require('child_process')

    export default {
        props: [
            'lang',
            'data'
        ],
        data () {
            return {
                tabAddRepoActive: 0,
                cloneURL: "",
                localPath: "",
                cloning: false,
                msgClone: "",
                cloneProgress: 0,
                cloneProgressMax: 300,
                errorCloneUrl: "",
                errorCloneLocal: "",
                errorAddLocalPath: ""
            }
        },
        methods: {
            closeModal: function() {
                this.tabAddRepoActive= 0
                this.errorCloneUrl = ""
                this.errorCloneLocal = ""
                this.errorAddLocalPath = ""
                this.$emit('closeModal')
            },
            changeCloneUrl: function(txt) {
                this.errorCloneUrl = txt.length > 0 ? "" : this.lang['Error clone url empty']
            },
            changeCloneLocalPath: function(txt) {
                this.errorCloneLocal = txt.length > 0 ? "" : this.lang['Error clone local path empty']
            },
            showOpenDirectory: function(callback) {
                dialog.showOpenDialog({
                    properties: ['openDirectory']
                }, callback)
            },
            chooseLocalPath: function(filePaths) {
                if (filePaths) {
                    this.localPath = filePaths[0]
                }
            },
            gitClone: function() {
                if (this.cloneURL.length == 0) {
                    this.errorCloneUrl = this.lang['Error clone url empty']
                    return false
                }
                if (this.localPath.length == 0) {
                    this.errorCloneLocal = this.lang['Error clone local path empty']
                    return false
                }

                this.cloneProgress = 0
                this.msgClone = ""
                this.cloning = true

                // 流程
                let done = "done"
                let compress = "remote: Compressing objects:"
                let receive = "Receiving objects:"
                let resolve = "Resolving deltas:"
                let process = compress
                let preProgress = 0

                let that = this
                let proc = exec("git clone --progress " + this.cloneURL, {cwd: this.localPath, windowsHide: true})
                this.msgClone = this.lang['Msg start clone']

                proc.stderr.on('data', function (data) {
                    while (true) {
                        let startIndex = data.lastIndexOf(process)
                        if (startIndex == -1 && process == compress) { // 小项目可能没有压缩解包过程
                            startIndex = data.lastIndexOf(receive)
                            if (startIndex > -1) {
                                process = receive
                                that.cloneProgress = 200
                            }
                        }

                        if (startIndex == -1) return
                        
                        let endIndex = data.indexOf(done)
                        
                        let progress = data.substr(startIndex + process.length, 5)
                        let curProgress = parseInt(progress)

                        that.msgClone = process + progress
                        that.cloneProgress += curProgress - preProgress
                        preProgress = curProgress

                        if (endIndex > -1) {
                            preProgress = 0
                            if (process == compress) process = receive
                            else if (process == receive) process = resolve

                            data = data.substr(endIndex + done.length)
                        }
                        else break
                    }
                })

                proc.on("close", function (code) {
                    that.$toast.success(that.lang['Msg clone finish'])
                    setTimeout(function() {
                        that.cloning = false
                    }, 1500)

                    // 保存配置
                    let index = that.cloneURL.lastIndexOf("/")
                    let repoName = that.cloneURL.substr(index + 1)
                    repoName = repoName.substr(0, repoName.length - ".git".length)
                    that.$emit("saveRepo", {name: repoName, path: that.localPath + that._PathSeperater + repoName})
                })
            },
            changeAddLocalPath: function (txt) {
                this.errorAddLocalPath = txt.length > 0 ? "" : this.lang['Error add local path empty']
            },
            addLocal: function() {
                if (this.localPath.length == 0) {
                    this.errorAddLocalPath = this.lang['Error add local path empty']
                    return false
                }

                let addLocalStep = 0
                let that = this
                let proc = exec("git config --local remote.origin.url", {cwd: this.localPath, windowsHide: true})
                proc.stdout.on("data", function (data) {
                    if (typeof(data) == "undefined" || data.length == 0) return
                    
                    data = data.trim()
                    let index = data.lastIndexOf("/")
                    let repoName = data.substr(index + 1)
                    repoName = repoName.substr(0, repoName.length - ".git".length)
                    
                    if (repoName in that.data.repos) addLocalStep = 2
                    else {
                        that.$emit("saveRepo", {name: repoName, path: that.localPath})
                        addLocalStep = 1
                    }
                })
                proc.on("close", function (code) {
                    if (addLocalStep == 0)
                        that.$toast.error(that.lang['Error add local not repo'])
                    else if (addLocalStep == 1)
                        that.$toast.success(that.lang['Msg add local success'])
                    else if (addLocalStep == 2)
                        that.$toast.warning(that.lang['Msg add local exist'])
                })
            }
        }
    }
</script>

<style scoped>

</style>
