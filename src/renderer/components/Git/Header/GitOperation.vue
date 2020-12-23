<template>
    <mu-flex class="header-item">
        <mu-list class="menu" style="min-width: 170px;">
            <mu-list-item button :ripple=false @click="onOperation">
                <mu-list-item-action class="menu-icon">
                    <svg-icon v-if="state == 'fetch'" name="sync" scale="150"></svg-icon>
                    <svg-icon v-else-if="state == 'pull'" name="arrow-down" scale="150"></svg-icon>
                    <svg-icon v-else-if="state == 'push'" name="arrow-up" scale="150"></svg-icon>
                    <svg-icon v-else-if="state == 'publish'" name="cloud-upload" scale="150"></svg-icon>
                </mu-list-item-action>
                <mu-list-item-content>
                    <mu-list-item-title class="title" v-if="state == 'fetch'">{{lang['Fetch']}}</mu-list-item-title>
                    <mu-list-item-title class="title" v-else-if="state == 'pull'">{{lang['Pull']}}</mu-list-item-title>
                    <mu-list-item-title class="title" v-else-if="state == 'push'">{{lang['Push']}}</mu-list-item-title>
                    <mu-list-item-title class="title" v-else-if="state == 'publish'">{{lang['Publish']}}</mu-list-item-title>
                    <mu-list-item-sub-title class="subtitle" v-if="state == 'fetch'">{{fetchMsg}}</mu-list-item-sub-title>
                    <mu-list-item-sub-title class="subtitle" v-else-if="state == 'pull'"></mu-list-item-sub-title>
                    <mu-list-item-sub-title class="subtitle" v-else-if="state == 'push'"></mu-list-item-sub-title>
                    <mu-list-item-sub-title class="subtitle" v-else-if="state == 'publish'"></mu-list-item-sub-title>
                </mu-list-item-content>
                <mu-list-item-action v-if="state == 'pull' || state == 'push'">
                    <mu-chip color="info" style="margin-left: 15px; padding: 0 8px; line-height: unset;">
                        <span v-if="countPush > 0">{{countPush}}</span><mu-icon v-if="countPush > 0" value="arrow_upward" size="16"></mu-icon>
                        <span v-if="countPull > 0">{{countPull}}</span><mu-icon v-if="countPull > 0" value="arrow_downward" size="16"></mu-icon>
                    </mu-chip>
                </mu-list-item-action>
            </mu-list-item>
        </mu-list>
    </mu-flex>
</template>

<script>
    const { exec } = require('child_process')

    export default {
        props: ['lang', 'langMsg', 'repoOpened', 'branch'],
        data () {
            return {
                isWorking: false,
                loading: null,
                fetchMsg: "",
                publishRequired: false,
                fetchRequired: false,
                countPull: 0,
                countPush: 0
            }
        },
        computed: {
            state: function() {
                if (this.publishRequired) return "publish"
                if (this.fetchRequired) return "fetch"
                if (this.countPull > 0) return "pull"
                if (this.countPush > 0) return "push"
                return "fetch"
            }
        },
        mounted () {
            let that = this
            this.gmm.$on("gitFetch", function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    if (that.loading) that.loading.close()
                    that.isWorking = false
                    return
                }
                
                let proc = exec("git fetch", {cwd: that._AppConfig.Repo[repoName].path,  windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'])
                        if (that.loading) that.loading.close()
                        that.isWorking = false
                        return
                    }

                    that.fetchRequired = false

                    that.gmm.$emit("gitStatus", repoName)

                    if (that.loading) that.loading.close()
                    that.isWorking = false
                })
            })

            this.gmm.$on("gitPull", function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    if (that.loading) that.loading.close()
                    that.isWorking = false
                    return
                }
                
                let proc = exec("git pull", {cwd: that._AppConfig.Repo[repoName].path, windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'], {width: 500})
                        if (that.loading) that.loading.close()
                        that.isWorking = false
                        return
                    }

                    that.gmm.$emit("gitStatus", repoName)

                    if (that.loading) that.loading.close()
                    that.isWorking = false
                })
            })

            this.gmm.$on("gitPush", function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    if (that.loading) that.loading.close()
                    that.isWorking = false
                    return
                }
                
                let proc = exec("git push", {cwd: that._AppConfig.Repo[repoName].path, windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'], {width: 500})
                        that.fetchRequired = true
                        if (that.loading) that.loading.close()
                        that.isWorking = false
                        return
                    }

                    that.gmm.$emit("gitStatus", repoName)

                    if (that.loading) that.loading.close()
                    that.isWorking = false
                })
            })

            this.gmm.$on("gitPublishBranch", function(repoName, branchName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    if (that.loading) that.loading.close()
                    that.isWorking = false
                    return
                }
                
                let proc = exec("git push --set-upstream origin " + branchName, {cwd: that._AppConfig.Repo[repoName].path, windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'], {width: 500})
                        if (that.loading) that.loading.close()
                        that.isWorking = false
                        return
                    }

                    that.gmm.$emit("updateBranch", repoName)
                    that.gmm.$emit("gitStatus", repoName)

                    if (that.loading) that.loading.close()
                    that.isWorking = false
                })
            })

            this.gmm.$on("gitStatus", function(repoName) {
                if (typeof(repoName) == "undefined" || repoName.length == 0) {
                    that.countPull = 0
                    that.countPush = 0
                    return
                }
                
                /**
                 * git status输出的第二行：
                 * 已最新
                 * Your branch is up-to-date with 'origin/master'.
                 * 有推送
                 * Your branch is ahead of 'origin/master' by 1 commit.
                 * 有拉取
                 * Your branch is behind 'origin/master' by 6 commits, and can be fast-forwarded.
                 * 推送拉取都有
                 * Your branch and 'origin/master' have diverged,
                 * and have 5 and 1 different commits each, respectively.
                 * 没有以上的语句表明分支未发布到远程
                 */
                let proc = exec("git status", {cwd: that._AppConfig.Repo[repoName].path,  windowHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'])
                        return
                    }

                    that.publishRequired = false
                    
                    let strBy = "by "
                    let strCommit = " commit"
                    
                    let lines = stdout.split("\n")
                    let status = lines[1]
                    if (status.indexOf("up-to-date") > -1) {
                        that.countPull = 0
                        that.countPush = 0
                    }
                    else if (status.indexOf("ahead of") > -1) {
                        let indexBy = status.indexOf(strBy)
                        let indexCommit = status.indexOf(strCommit)
                        let count = status.substring(indexBy + strBy.length, indexCommit)
                        count = parseInt(count)
                        that.countPull = 0
                        that.countPush = count
                    }
                    else if (status.indexOf("behind") > -1) {
                        let indexBy = status.indexOf(strBy)
                        let indexCommit = status.indexOf(strCommit)
                        let count = status.substring(indexBy + strBy.length, indexCommit)
                        count = parseInt(count)
                        that.countPull = count
                        that.countPush = 0
                    }
                    else if (status.indexOf("diverged") > -1) {
                        status = lines[2]
                        let str1 = "and have "
                        let str2 = " and "
                        let str3 = " different commit"
                        let index1 = status.indexOf(str1)
                        let index2 = status.indexOf(str2)
                        let index3 = status.indexOf(str3)
                        let countPush = status.substring(index1 + str1.length, index2)
                        let countPull = status.substring(index2 + str2.length, index3)
                        countPush = parseInt(countPush)
                        countPull = parseInt(countPull)
                        that.countPush = countPush
                        that.countPull = countPull
                    }
                    else if (status.indexOf("nothing to commit, working tree clean") > -1) {
                        that.countPull = 0
                        that.countPush = 0
                    }
                    else {
                        that.countPull = 0
                        that.countPush = 0
                        that.publishRequired = true
                    }
                })
            })

            this.$nextTick(function() { // 不用nextTick无法获取props和data
                // 初始化检测推送拉取
                let repos = that._AppConfig.Repo
                for (var name in repos) {
                    if (repos[name].selected) {
                        that.gmm.$emit("gitStatus", name)
                        break
                    }
                }
            })
        },
        methods: {
            onOperation: function(event) {
                if (this.isWorking) return

                this.isWorking = true
                this.loading = this.$loading({target: event.target, size: 24})
                switch(this.state) {
                    case "fetch":
                        this.onFetch()
                        break
                    case "pull":
                        this.onPull()
                        break
                    case "push":
                        this.onPush()
                        break
                    case "publish":
                        this.onPublish()
                        break
                    default:
                        if (this.loading) this.loading.close()
                        this.isWorking = false
                        break
                }
            },
            onFetch: function() {
                this.gmm.$emit("gitFetch", this.repoOpened)
            },
            onPull: function() {
                this.gmm.$emit("gitPull", this.repoOpened)
            },
            onPush: function() {
                this.gmm.$emit("gitPush", this.repoOpened)
            },
            onPublish: function() {
                this.gmm.$emit("gitPublishBranch", this.repoOpened, this.branch)
            }
        }
    }
</script>

<style scoped>
    @import './Header.css'
</style>
