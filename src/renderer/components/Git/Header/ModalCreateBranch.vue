<template>
    <mu-dialog :title="lang['Modal Title Create Branch']" width="500" :open.sync="data.showCreateBranch" :overlay-close=false :esc-press-close=false>
        <mu-flex>
            <mu-text-field v-model="branchName" :placeholder="lang['Branch Name']" full-width :error-text="errorCreateBranch" @change="changeBranchName"></mu-text-field>
            <mu-button @click="createBranch">{{lang['Create']}}</mu-button>
        </mu-flex>
        <div>{{infoCreateBranch}}</div>
        <mu-button slot="actions" flat color="primary" @click="closeModal">{{lang['Close']}}</mu-button>
    </mu-dialog>
</template>

<script>
    const { exec } = require('child_process')

    export default {
        props: [
            'lang',
            'langMsg',
            'data'
        ],
        data () {
            return {
                branchName: "",
                errorCreateBranch: ""
            }
        },
        computed: {
            infoCreateBranch: function () {
                return this.lang['Info Create Branch'].replace("%BranchName%", this.data.branchSelected)
            }
        },
        methods: {
            closeModal: function() {
                this.branchName = ""
                this.errorCreateBranch = ""
                this.$emit('closeModal')
            },
            changeBranchName: function (txt) {
                this.errorCreateBranch = txt.length > 0 ? "" : this.lang['Error branch name empty']
            },
            createBranch: function () {
                if (this.branchName.length == 0) {
                    this.errorCreateBranch = this.lang['Error branch name empty']
                    return false
                }
                
                let that = this
                let proc = exec("git branch " + this.branchName, {cwd: this._AppConfig.Repo[this.data.repoOpened].path, windowsHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'])
                        return
                    }
                    that.$toast.success(that.lang['Msg create branch success'])
                    that.gmm.$emit("updateBranch", that.data.repoOpened)
                    that.$emit('closeModal')
                })
            }
        }
    }
</script>
