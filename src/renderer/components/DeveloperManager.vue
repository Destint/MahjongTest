<template>
    <mu-dialog :title="lang['Title']" width="500" :open.sync="show" :overlay-close=false :esc-press-close=false>
        <mu-flex>
            <mu-text-field v-model="developer" :placeholder="lang['Developer Name']" full-width :error-text="errorAddDeveloper" @change="changeName"></mu-text-field>
            <mu-button @click="addDeveloper">{{lang['Add']}}</mu-button>
        </mu-flex>
        <mu-flex>
            <mu-chip class="developers" v-for="(developer, index) in developerArray" :key="index" color="success" @delete="removeDeveloper(developer)" delete>{{developer}}</mu-chip>
        </mu-flex>
        <mu-button slot="actions" flat color="primary" @click="closeModal">{{lang['Close']}}</mu-button>
    </mu-dialog>
</template>

<script>
    import { ipcRenderer } from 'electron'

    export default {
        props: [
            'lang',
            'show',
            'developers'
        ],
        data () {
            return {
                developer: "",
                errorAddDeveloper: "",
                developersUpdated: null
            }
        },
        computed: {
            developerArray () {
                return this.developersUpdated == null ? this.developers : this.developersUpdated
            }
        },
        methods: {
            closeModal: function() {
                this.developer = ""
                this.errorAddDeveloper = ""
                this.$emit('closeModal')
            },
            addDeveloper: function() {
                if (this.developer.length == 0) {
                    this.errorAddDeveloper = this.lang['Error developer name empty']
                    return false
                }
                this.developersUpdated = ipcRenderer.sendSync("developer-add", this.developer)
                this.developer = ""
            },
            changeName: function(txt) {
                this.errorAddDeveloper = txt.length > 0 ? "" : this.lang['Error developer name empty']
            },
            removeDeveloper: function(name) {
                this.developersUpdated = ipcRenderer.sendSync("developer-remove", name)
            }
        }
    }
</script>

<style scoped>
    .developers {
        margin-right: 8px;
    }
</style>
