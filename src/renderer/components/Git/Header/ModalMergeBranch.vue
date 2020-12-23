<template>
    <mu-dialog :title="lang['Modal Title Merge Branch']" width="500" :open.sync="data.showMergeBranch" :overlay-close=false :esc-press-close=false>
        <mu-flex>
            <mu-select label="" filterable v-model="branchName" full-width>
                <mu-option v-for="branch in data.branches" :key="branch" :label="branch" :value="branch"></mu-option>
            </mu-select>
            <mu-button @click="mergeBranch" :disabled="branchName.length == 0">{{lang['Merge']}}</mu-button>
        </mu-flex>
        <div v-if="branchName.length > 0">{{infoMergeBranch}}</div>
        <div v-if="branchName.length > 0">{{warningMergeBranch}}</div>
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
                branchName: ""
            }
        },
        computed: {
            infoMergeBranch: function () {
                return this.lang['Info Merge Branch'].replace("%Branch1%", this.branchName).replace("%Branch2%", this.data.branchSelected)
            },
            warningMergeBranch: function () {
                return this.lang['Warning Merge Branch'].replace("%Branch1%", this.branchName).replace("%Branch2%", this.data.branchSelected)
            },
        },
        methods: {
            closeModal: function() {
                this.branchName = ""
                this.$emit('closeModal')
            },
            mergeBranch: function () {
                if (this.branchName.length == 0) {
                    return false
                }
                
                let that = this
                let proc = exec("git merge " + this.branchName, {cwd: this._AppConfig.Repo[this.data.repoOpened].path, windowsHide: true}, function(error, stdout, stderr) {
                    if (error) {
                        that.$alert(stderr, that.langMsg['Title'])
                        return
                    }
                    that.$toast.success(that.lang['Msg merge branch success'])
                    that.gmm.$emit("updateBranch", that.data.repoOpened)
                    that.gmm.$emit("gitStatus", that.data.repoOpened)
                    that.$emit('closeModal')
                })
            }
        }
    }
</script>
