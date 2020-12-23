<template>
    <mu-flex class="header">
        <!-- -------------------------------- Repo -------------------------------- -->
        <mu-flex class="header-item">
            <mu-list class="menu">
                <mu-list-item button :ripple=false ref="btnRepo" @click="showRepository = !showRepository">
                    <mu-list-item-action class="menu-icon">
                        <svg-icon name="device-desktop" scale="150"></svg-icon>
                    </mu-list-item-action>
                    <mu-list-item-content>
                        <mu-list-item-sub-title class="subtitle">{{lang['Cur Repo']}}</mu-list-item-sub-title>
                        <mu-list-item-title class="title">{{repoOpened}}</mu-list-item-title>
                    </mu-list-item-content>
                    <mu-list-item-action>
                        <svg-icon class="toggle-icon" :class="{'toggle-open': showRepository}" name="chevron-down" scale="100"></svg-icon>
                    </mu-list-item-action>
                </mu-list-item>
            </mu-list>
            <mu-popover class="popover-left header-popover" :open.sync="showRepository" :trigger="trigger_repo">
                <mu-list dense>
                    <mu-list-item>
                        <mu-text-field disabled class="search-list" v-model="filterRepo" :placeholder="lang['Search Repo']" icon="search" solo @input="repoFilter"></mu-text-field>
                        <mu-button small flat @click="showModalAddRepo">
                            <mu-icon left value="add"></mu-icon>{{lang["Add Repo"]}}
                        </mu-button>
                        <!-- -------------------------------- Add Repo Modal -------------------------------- -->
                        <modal-add-repo :lang="lang" :data="modalAddRepoData" @closeModal="showAddRepo = false" @saveRepo="saveRepo"></modal-add-repo>
                        <!-- -------------------------------- Add Repo End -------------------------------- -->
                    </mu-list-item>
                    <mu-divider></mu-divider>
                    <!-- -------------------------------- Repo List -------------------------------- -->
                    <mu-list-item button v-for="(repoData, repoName) in repos" :key="repoName" @click="selectRepo(repoName)">
                        <mu-list-item-action v-if="repoData.selected" style="min-width: 0; margin-right: 5px;">
                            <mu-icon value="play_arrow" color="pink" size="16"></mu-icon>
                        </mu-list-item-action>
                        <mu-list-item-title>{{repoName}}</mu-list-item-title>
                        <mu-list-item-action>
                            <mu-button icon @click.stop="removeRepo(repoName)" style="width: 28px; height: 28px;">
                                <mu-icon value="clear"></mu-icon>
                            </mu-button>
                        </mu-list-item-action>
                    </mu-list-item>
                    <!-- -------------------------------- Repo List End -------------------------------- -->
                </mu-list>
            </mu-popover>
        </mu-flex>
        <!-- -------------------------------- Branch -------------------------------- -->
        <mu-flex class="header-item">
            <mu-list class="menu">
                <mu-list-item button :ripple=false ref="btnBranch" @click="showBranch = !showBranch">
                    <mu-list-item-action class="menu-icon">
                        <svg-icon name="git-branch" scale="150"></svg-icon>
                    </mu-list-item-action>
                    <mu-list-item-content>
                        <mu-list-item-sub-title class="subtitle">{{lang['Cur Branch']}}</mu-list-item-sub-title>
                        <mu-list-item-title class="title">{{branchSelected}}</mu-list-item-title>
                    </mu-list-item-content>
                    <mu-list-item-action>
                        <svg-icon class="toggle-icon" :class="{'toggle-open': showBranch}" name="chevron-down" scale="100"></svg-icon>
                    </mu-list-item-action>
                </mu-list-item>
            </mu-list>
            <mu-popover class="header-popover" :open.sync="showBranch" :trigger="trigger_branch">
                <mu-list dense>
                    <mu-list-item>
                        <mu-text-field disabled class="search-list" v-model="filterBranch" :placeholder="lang['Search Branch']" icon="search" solo @input="branchFilter"></mu-text-field>
                        <mu-button small flat @click="showModalCreateBranch">
                            <mu-icon left value="add"></mu-icon>{{lang["Create Branch"]}}
                        </mu-button>
                        <!-- -------------------------------- Create Branch Modal -------------------------------- -->
                        <modal-create-branch :lang="lang" :langMsg="langMsg" :data="modalCreateBranchData" @closeModal="showCreateBranch = false"></modal-create-branch>
                        <!-- -------------------------------- Create Branch End -------------------------------- -->
                    </mu-list-item>
                    <mu-divider></mu-divider>
                    <mu-list-item button v-for="(branch, index) in branches" :key="index" @click="checkoutBranch(branch)">
                        <mu-list-item-action v-if="branch == branchSelected" style="min-width: 0; margin-right: 5px;">
                            <mu-icon value="play_arrow" color="pink" size="16"></mu-icon>
                        </mu-list-item-action>
                        <mu-list-item-title>{{branch}}</mu-list-item-title>
                        <mu-list-item-action v-if="branch == branchSelected" style="min-width: 0; margin-right: 5px;">
                            <mu-button flat small @click.stop="showModalMergeBranch">{{lang["Merge"]}}</mu-button>
                        </mu-list-item-action>
                    </mu-list-item>
                    <!-- -------------------------------- Merge Branch Modal -------------------------------- -->
                    <modal-merge-branch :lang="lang" :langMsg="langMsg" :data="modalMergeBranchData" @closeModal="showMergeBranch = false"></modal-merge-branch>
                    <!-- -------------------------------- Merge Branch End -------------------------------- -->
                </mu-list>
            </mu-popover>
        </mu-flex>
        <!-- -------------------------------- Git Operation -------------------------------- -->
        <git-operation :lang="lang" :langMsg="langMsg" :repoOpened="repoOpened" :branch="branchSelected"></git-operation>
        <!-- -------------------------------- Empty -------------------------------- -->
        <mu-flex class="header-item" fill>
            <mu-list class="menu">
                <mu-list-item>
                    <!-- Fill empty space -->
                </mu-list-item>
            </mu-list>
        </mu-flex>
        <!-- -------------------------------- Project Operation -------------------------------- -->
        <proj-operation :lang="lang" :langMsg="langMsg" :data="modalProjOperationData"></proj-operation>
    </mu-flex>
</template>

<script>
    import { ipcRenderer } from 'electron'
    const { exec } = require('child_process')
    const fs = require('fs')
    const pathMod = require("path")

    import ModalAddRepo from "./Header/ModalAddRepo"
    import GitOperation from "./Header/GitOperation"
    import ProjOperation from "./Header/ProjOperation"
    import ModalCreateBranch from "./Header/ModalCreateBranch"
    import ModalMergeBranch from "./Header/ModalMergeBranch"
    
    export default {
        props: ['lang', 'langMsg'],
        components: {
            ModalAddRepo,
            GitOperation,
            ProjOperation,
            ModalCreateBranch,
            ModalMergeBranch
        },
        inject:['reload'],
        data () {
            return {
                repos: this._AppConfig.Repo,
                showRepository: false,
                showBranch: false,
                showAddRepo: false,
                showCreateBranch: false,
                showMergeBranch: false,
                trigger_repo: null,
                trigger_branch: null,
                filterRepo: "",
                branches: [],
                branchSelected: null,
                filterBranch: ""
            }
        },
        computed: {
            repoOpened () {
                for (var name in this.repos) {
                    if (this.repos[name].selected) return name
                }
            },
            localBranches () {
                let list = []
                for (var index = 0; index < this.branches.length; index++) {
                    let branch = this.branches[index]
                    if (branch.indexOf("origin/") == -1 && branch != this.branchSelected) {
                        list.push(branch)
                    }
                }
                return list
            },
            modalAddRepoData () {
                return {
                    showAddRepo: this.showAddRepo,
                    repos: this.repos
                }
            },
            modalCreateBranchData () {
                return {
                    showCreateBranch: this.showCreateBranch,
                    repoOpened: this.repoOpened,
                    branchSelected: this.branchSelected
                }
            },
            modalMergeBranchData () {
                return {
                    showMergeBranch: this.showMergeBranch,
                    repoOpened: this.repoOpened,
                    branches: this.localBranches,
                    branchSelected: this.branchSelected
                }
            },
            modalProjOperationData () {
                return {
                    repo: this.repos[this.repoOpened],
                    repoOpened: this.repoOpened,
                    branchSelected: this.branchSelected
                }
            }
        },
        mounted () {
            this.trigger_repo = this.$refs.btnRepo.$el
            this.trigger_branch = this.$refs.btnBranch.$el

            let that = this
            this.gmm.$on('updateBranch', function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    that.branches = []
                    that.branchSelected = null
                    return
                }
                
                let path = that.repos[repoName].path
                let proc = exec("git branch -a", {cwd: path, windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'])
                        return
                    }
                    
                    that.branches = []
                    let lines = stdout.split("\n")
                    lines.pop()
                    for (var line of lines) {
                        if (line.indexOf("@") > -1) continue // 合并分支
                        line = line.trim()
                        let remotePath = "remotes/"
                        if (line.indexOf(remotePath) == 0) { // 远程分支
                            if (line.indexOf("/HEAD") > -1) continue
                            line = line.substr(remotePath.length)
                        }
                        else if (line.indexOf("* ") == 0) { // 当前分支
                            line = line.substr(2)
                            that.branchSelected = line
                        }
                        that.branches.push(line)
                    }
                })
            })

            this.$nextTick(function() { // 不用nextTick无法获取props和data
                // 初始化检测仓库变动
                let repos = that._AppConfig.Repo
                for (var name in repos) {
                    if (repos[name].selected) {
                        that.gmm.$emit("updateBranch", name)
                        // 传项目路径给App.vue以供其他工具使用
                        that.gmm.$emit("updateProjectPath", repos[name].path)
                        break
                    }
                }
            })
        },
        methods: {
            repoFilter: function(text) {
                // this.$toast.message('repo filter')
            },
            showModalAddRepo: function() {
                this.showAddRepo = true
                this.showRepository = false
            },
            saveRepo: function(repo) {
                this.repos = ipcRenderer.sendSync("repo-save", repo.name, repo.path)
                this._AppConfig.Repo = this.repos
                this.addGitIgnore(repo.path)
                this.gmm.$emit("updateRepo", repo.name)
                this.gmm.$emit('updateBranch', repo.name)
                this.gmm.$emit('gitStatus', repo.name)
            },
            removeRepo: function(repoName) {
                this.repos = ipcRenderer.sendSync("repo-remove", repoName)
                this._AppConfig.Repo = this.repos
                this.gmm.$emit("updateRepo")
                this.gmm.$emit('updateBranch')
                this.gmm.$emit('gitStatus')
            },
            selectRepo: function(repoName) {
                if (this.repos[repoName].selected) return
                this.repos = ipcRenderer.sendSync("repo-select", repoName)
                this._AppConfig.Repo = this.repos
                this.gmm.$emit("updateRepo", repoName)
                this.gmm.$emit('updateBranch', repoName)
                this.gmm.$emit('gitStatus', repoName)
                this.reload()
            },
            showModalCreateBranch: function() {
                this.showCreateBranch = true
                this.showBranch = false
            },
            branchFilter: function(text) {
                // this.$toast.message('branch filter')
            },
            checkoutBranch: function(branchName) {
                // 判断目标分支是本地还是远程
                let cmd = ""
                if (branchName.indexOf("origin/") > -1) {
                    let branch = branchName.substr("origin/".length)
                    if (this.branches.indexOf(branch) == -1) { // 未找到对应本地分支
                        cmd = "git checkout -b " + branch + " " + branchName
                    }
                    else cmd = "git checkout " + branch
                }
                else cmd = "git checkout " + branchName

                let that = this
                exec(cmd, {cwd: that.repos[that.repoOpened].path, windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'], {width: 800})
                        return
                    }
                    
                    that.gmm.$emit("updateBranch", that.repoOpened)
                    that.gmm.$emit("gitStatus", that.repoOpened)
                })
            },
            showModalMergeBranch: function() {
                this.showMergeBranch = true
                this.showBranch = false
            },
            addGitIgnore: function(repoPath) {
                let ignoreFile = pathMod.join(repoPath, ".gitignore")
                let content = fs.readFileSync(ignoreFile).toString()
                if (content.indexOf("bin/js.min") == -1) {
                    if (content.lastIndexOf("\n") < content.length - 1) content += "\r\n"
                    content += "bin/js.min"
                    fs.writeFileSync(ignoreFile, content)
                }
            }
        }
    }
</script>

<style>
    .mu-input.is-solo .mu-input-icon {
        top: 5px;
    }
</style>

<style scoped>
    .header {
        width: 100vw;
    }
    .header .header-dark {
        background-color: #90caf9;
    }
    .search-list {
        background-color: #fce4ec;
        padding-right: 10px;
        margin-right: 5px;
    }
    .mu-input {
        min-height: unset;
    }
    .mu-input.is-solo {
        padding-top: 0;
        padding-bottom: 0;
    }
    .mu-input.has-icon {
        padding-left: 40px;
    }
    .toggle-icon {
        transition: transform .3s cubic-bezier(.23,1,.32,1),-webkit-transform .3s cubic-bezier(.23,1,.32,1);
    }
    .toggle-open {
        -webkit-transform: rotate(180deg);
        transform: rotate(180deg);
    }
    .popover-left {
        left: 0 !important;
    }
    .proj-icon {
        margin-right: 10px;
    }
    .header-popover {
        top: 48px !important;
        max-height: calc(100% - 48px);
    }
</style>

<style scoped>
    @import './Header/Header.css'
</style>