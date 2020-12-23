<template>
    <div id="app">
        <router-view v-if="isRouterAlive"></router-view>
        <developer-manager :lang="langDev" :show="showDeveloperManager" :developers="developers" @closeModal="showDeveloperManager = false"></developer-manager>
    </div>
</template>

<script>
    import { ipcRenderer } from 'electron'

    import DeveloperManager from './components/DeveloperManager.vue'

    export default {
        name: "app-index",
        provide (){
            return {
                reload:this.reload
            }
        },
        data () {
            return {
                langDev: this.i18n.__('Developer'),
                langMenu: this.i18n.__('Menu'),
                showDeveloperManager: false,
                developers: [],
                projectPath: "",
                isRouterAlive:true
            }
        },
        methods:{
            reload (){
                this.isRouterAlive = false
                this.$nextTick(function(){
                    this.isRouterAlive = true
                })
            }
        },
        components: {
            DeveloperManager
        },
        mounted () {
            this.gmm.$on("updateProjectPath", (path) => { // 更换项目路径，比如切换项目时
                this.projectPath = path
            })

            ipcRenderer.on('mainWindow-onFocus', (event, arg) => {
                for (var name in this._AppConfig.Repo) {
                    if (this._AppConfig.Repo[name].selected) {
                        this.gmm.$emit('updateRepo', name)
                        break
                    }
                }
            })

            ipcRenderer.on('developer-manager-onShow', (event, arg) => {
                this.developers = arg.developers
                this.showDeveloperManager = true
            })

            ipcRenderer.on('manager-onChangeApp', (event, arg) => {
                switch(arg.app) {
                    case this.langMenu['Git']:
                        this.$router.replace({name: "app-git"})
                        break
                    case this.langMenu['Img']:
                        this.$router.replace({name: "app-img", params: {projPath: this.projectPath}})
                        break
                    case this.langMenu['Laya']:
                        this.$router.replace({name: "app-laya", params: {projPath: this.projectPath}})
                        break
                    case this.langMenu['Server']:
                        this.$router.replace({name: "app-server", params: {projPath: this.projectPath}})
                        break
                }
            })
        }
    }
</script>

<style>
    body {
        font-family: Roboto, sans-serif;
        height: 100vh;
    }
    html {
        scrollbar-arrow-color:#9194a4;
        scrollbar-face-color:transparent;
        scrollbar-3dlight-color: transparent;
        scrollbar-highlight-color:#fff;
        scrollbar-shadow-color:rgba(0,0,0,.15);
        scrollbar-darkshadow-color: transparent;
        scrollbar-track-color:#fff;
        scrollbar-base-color: rgba(0, 0, 0, .3);
    }
    html ::-webkit-scrollbar {
        width: 6px;
        height: 8px;
        background-color: transparent;
    }
    html ::-webkit-scrollbar-track {
        box-shadow: none;
        background-color: #fff;
    }
    html ::-webkit-scrollbar-thumb {
        border-radius: 10px;
        box-shadow: none;
        background-color: rgba(0, 0, 0, .3);
    }
</style>

<style>
    #app {
        height: 100%;
    }
</style>
