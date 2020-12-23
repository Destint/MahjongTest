<template>
    <mu-flex class="left-bar" direction="column" :style="{width: styles.leftBarWidth + 'px'}">
        <mu-tabs class="left-bar-tabs" :value.sync="activeTab" inverse color="#4caf50" indicator-color="blue" full-width>
            <mu-tab class="left-bar-tab">{{lang['Changes']}}</mu-tab>
            <mu-tab class="left-bar-tab">{{lang['History']}}</mu-tab>
        </mu-tabs>
        <mu-flex v-if="activeTab == 0" direction="column" fill style="width: 100%">
            <mu-flex class="total-changed" style="width: 100%; min-height: 26px;">
                <mu-checkbox label="" :input-value="checkAll" @change="handleCheckAll" :checked-icon="checkAllIcon" :disabled="noChanges"></mu-checkbox>
                <mu-flex fill justify-content="center">
                    {{checkList.length}} {{lang["Changed files"]}}
                </mu-flex>
            </mu-flex>
            <mu-flex class="changed-files" direction="column" fill>
                <mu-list dense>
                    <template  v-for="(file, index) in checkList">
                        <mu-list-item button :key="'file' + index" :title="file.label != file.path ? file.path : ''">
                            <mu-flex style="width: 100%" align-items="center">
                                <mu-flex fill style="word-break: keep-all; white-space: nowrap; overflow: hidden;">
                                    <mu-checkbox :ripple=false :value="file.path" v-model="checked" :label="file.label"></mu-checkbox>
                                </mu-flex>
                                <svg-icon v-if="file.mark == 'modify'" class="changed-file-svg" name="diff-modified" scale="100" color="#90a4ae"></svg-icon>
                                <svg-icon v-else-if="file.mark == 'add'" class="changed-file-svg" name="diff-added" scale="100" color="#8bc34a"></svg-icon>
                                <svg-icon v-else-if="file.mark == 'remove'" class="changed-file-svg" name="diff-removed" scale="100" color="red"></svg-icon>
                                <svg-icon v-else-if="file.mark == 'conflict'" class="changed-file-svg" name="alert" scale="100" color="red"></svg-icon>
                            </mu-flex>
                        </mu-list-item>
                        <mu-divider v-if="index+1 < checkList.length" :key="'divider' + index"></mu-divider>
                    </template>
                </mu-list>
            </mu-flex>
            <mu-container class="block-commit">
                <mu-text-field v-model="message" :label="lang['Message']" label-float :error-text="messageIsEmpty" full-width></mu-text-field><br/>
                <mu-button full-width color="primary" :disabled="noChanges || noChecked" @click="gitCommit">{{lang['Commit']}}</mu-button>
            </mu-container>
        </mu-flex>
        <mu-flex v-if="activeTab == 1" direction="column" fill style="width: 100%">
            该功能还没做
        </mu-flex>
    </mu-flex>
</template>

<script>
    const { exec } = require('child_process')
    const Remote = require('electron').remote

    export default {
        props: ['lang', 'langMsg'],
        data () {
            return {
                activeTab: 0,
                repoSelected: null,
                checked: [],    // 勾选的改动文件
                checkList: [],  // 所有本地改动文件
                message: "",
                doCommit: false,
                isCommitting: false,
                styles: {
                    leftBarWidth: 300
                }
            }
        },
        computed: {
            checkAll: function() {
                return this.checked.length > 0
            },
            checkAllIcon: function() {
                return this.checked.length < this.checkList.length ? 'indeterminate_check_box' : undefined
            },
            noChanges: function() {
                return this.checkList.length == 0
            },
            noChecked: function() {
                return this.checked.length == 0
            },
            messageIsEmpty: function() {
                return this.doCommit && this.checkList.length > 0 && this.message.length == 0 ? this.lang['Error message empty'] : ""
            }
        },
        mounted () {
            let that = this
            that.gmm.$on("updateRepo", function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    that.checkList = []
                    that.checked = []
                    that.repoSelected = null
                    return
                }
                
                if (that.repoSelected != repoName) {
                    that.repoSelected = repoName
                }

                that.Git(that._AppConfig.Repo[repoName].path)
                    .status((err, status) => {
                        if (err) {
                            console.log(err)
                            that.$alert(that.langMsg['Msg Check Console'], that.langMsg['Title'])
                        }
                        
                        let list = []
                        let checkedList = []
                        // 新增文件
                        let maxWidth = that.styles.leftBarWidth - 24 - 8 - 12.5 // check box,margin,change active
                        for (var path of status.not_added) {
                            list.push({
                                path: path,
                                mark: "add",
                                label: path.hidePath("/", maxWidth)
                            })
                            // 修正已勾选的文件
                            if (that.checked.indexOf(path) > -1) checkedList.push(path)
                        }
                        for (var path of status.created) {
                            list.push({
                                path: path,
                                mark: "add",
                                label: path.hidePath("/", maxWidth)
                            })
                            // 修正已勾选的文件
                            if (that.checked.indexOf(path) > -1) checkedList.push(path)
                        }
                        // 删除文件
                        for (var path of status.deleted) {
                            list.push({
                                path: path,
                                mark: "remove",
                                label: path.hidePath("/", maxWidth)
                            })
                            // 修正已勾选的文件
                            if (that.checked.indexOf(path) > -1) checkedList.push(path)
                        }
                        // 修改文件
                        for (var path of status.modified) {
                            list.push({
                                path: path,
                                mark: "modify",
                                label: path.hidePath("/", maxWidth)
                            })
                            // 修正已勾选的文件
                            if (that.checked.indexOf(path) > -1) checkedList.push(path)
                        }
                        // 冲突文件
                        for (var path of status.conflicted) {
                            list.push({
                                path: path,
                                mark: "conflict",
                                label: path.hidePath("/", maxWidth)
                            })
                            // 修正已勾选的文件
                            if (that.checked.indexOf(path) > -1) checkedList.push(path)
                        }

                        that.checkList = list
                        that.checked = checkedList
                    })
            })
            
            this.$nextTick(function() { // 不用nextTick无法获取props和data
                // 初始化检测仓库变动
                let repos = that._AppConfig.Repo
                for (var name in repos) {
                    if (repos[name].selected) {
                        that.gmm.$emit("updateRepo", name)
                        break
                    }
                }
            })
        },
        methods: {
            handleCheckAll: function(event) {
                let doCheckAll = this.checked.length != this.checkList.length
                this.checked = []
                if (doCheckAll) {
                    for (var index in this.checkList)
                        this.checked.push(this.checkList[index].path)
                }
            },
            gitCommit: function(event) {
                if (this.isCommitting) return

                this.doCommit = true
                if (this.message.length == 0) {
                    return
                }
                
                let that = this
                this.isCommitting = true
                const loading = this.$loading({target: event.target, size: 24})

                let addFiles = []
                let removeFiles = []
                for (var path of this.checked) {
                    for (var checkbox of this.checkList) {
                        if (checkbox.path == path) {
                            if (checkbox.mark != "remove") {
                                addFiles.push(path)
                            }
                            else {
                                removeFiles.push(path)
                            }
                            break
                        }
                    }
                }
                if (addFiles.length > 0 && removeFiles.length > 0) {
                    this.Git(this._AppConfig.Repo[this.repoSelected].path)
                        .add(addFiles)
                        .rm(removeFiles)
                        .commit(this.message, () => {
                            that.isCommitting = false
                            that.doCommit = false
                            that.message = ""
                            that.checked = []
                            that.checkList = []
                            loading.close()

                            that.gmm.$emit("updateRepo", that.repoSelected)
                        })
                }
                else if (addFiles.length > 0) {
                    this.Git(this._AppConfig.Repo[this.repoSelected].path)
                        .add(addFiles)
                        .commit(this.message, () => {
                            that.isCommitting = false
                            that.doCommit = false
                            that.message = ""
                            that.checked = []
                            that.checkList = []
                            loading.close()

                            that.gmm.$emit("updateRepo", that.repoSelected)
                        })
                }
                else if (removeFiles.length > 0) {
                    this.Git(this._AppConfig.Repo[this.repoSelected].path)
                        .rm(removeFiles)
                        .commit(this.message, () => {
                            that.isCommitting = false
                            that.doCommit = false
                            that.message = ""
                            that.checked = []
                            that.checkList = []
                            loading.close()

                            that.gmm.$emit("updateRepo", that.repoSelected)
                        })
                }
            }
        }
    }
</script>

<style>
    .mu-tab {
        min-width: 0 !important;
    }
    .mu-tab-wrapper {
        min-height: 0;
        padding: 8px;
    }
    .left-bar .mu-checkbox-svg-icon {
        height: 20px;
        width: 20px;
        left: 2px;
        top: 2px;
    }
    .total-changed .mu-checkbox-icon-checked {
        left: 2px;
        top: 2px;
    }
    .total-changed .material-icons {
        font-size: 20px;
    }
    .changed-files .mu-list {
        padding: 0;
    }
    .changed-files .mu-list-dense .mu-item {
        height: 28px;
        padding: 0;
    }
    .block-commit .mu-raised-button {
        box-shadow: none;
        font-size: 12px;
        height: 26px;
    }
    .block-commit .mu-input {
        margin-bottom: 0;
    }
    .block-commit .mu-input.has-label .mu-input-label.float {
        -webkit-transform: translate3d(0,22px,0) scale(1);
        transform: translate3d(0,22px,0) scale(1);
    }
</style>

<style scoped>
    .left-bar {
        height: 100%;
        border-right: 1px solid #00e5ff;
    }
    .left-bar-tabs { /*限制高度自动变化*/
        min-height: 25px;
        max-height: 25px;
    }
    .left-bar-tab {
        background-color: white;
    }
    .left-bar-tab:not(:last-of-type) {
        border-right: 1px solid #00e5ff;
    }
    .total-changed {
        border: 1px solid #00e5ff;
        border-left: 0;
        border-right: 0;
    }
    .changed-files {
        width: 100%;
        background-color: white;
    }
    .block-commit {
        padding-bottom: 5px;
        border-top: 1px solid #00e5ff;
        background-color: #e1f5fe;
    }
    .changed-file-svg {
        margin-right: 5px;

    }
    .changed-file:hover {
        background-color: #f8f8f8;
    }
</style>
