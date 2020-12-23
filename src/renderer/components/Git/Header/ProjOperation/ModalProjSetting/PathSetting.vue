<template>
    <mu-flex direction="column">
        <!-- ------------------------------ 模块名 ------------------------------ -->
        <mu-flex class="full-width">
            <mu-text-field class="module-name" v-model="moduleName" :placeholder="lang['Proj Setting Module Name']"></mu-text-field>
            <mu-flex fill><!--空白占位子--></mu-flex>
            <mu-button @click="onSaveModulePath">{{lang['Save']}}</mu-button>
        </mu-flex>
        <!-- ------------------------------ 目录 ------------------------------ -->
        <mu-flex class="proj-path-list-wrapper full-width">
            <proj-path-list :lang="lang" :projFullPaths="projFullPaths" :pickedPaths="this.moduleSelected.paths"
                @onPickPath="onPickPath" @onUnpickPath="onUnpickPath">
            </proj-path-list>
        </mu-flex>
    </mu-flex>
</template>

<script>
    import ProjPathList from './PathSetting/ProjPathList'

    export default {
        components: {
            ProjPathList
        },
        props: [
            "lang",
            "projFullPaths",
            "moduleSelected"
        ],
        data () {
            return {
                pathPicked: [],
                moduleName: this.moduleSelected.name || "",
                moduleNameError: "",
                moduleOldName: this.moduleSelected.name || "",
            }
        },
        computed: {
            pickedPaths: function() {
                let paths = []
                for (var key in this.moduleSelected.paths) {
                    paths.push(this.moduleSelected.paths[key].path)
                }
                return paths
            }
        },
        methods: {
            onPickPath: function(path) {
                let index = this.pathPicked.indexOf(path)
                if (index > -1) this.$set(this.pathPicked, index, path)
                else this.pathPicked.push(path)
            },
            onUnpickPath: function(path) {
                this.$delete(this.pathPicked, this.pathPicked.indexOf(path))
            },
            onSaveModulePath: function() {
                if (this.moduleName.length == 0) {
                    this.$toast.error(this.lang['Error module name empty'])
                    return false
                }
                this.pathPicked.sort(this.sortPath)
                this.$emit("onSaveModulePath", {name: this.moduleName, oldName: this.moduleOldName, paths: this.pathPicked})
            },
            sortPath: function(pathA, pathB) {
                if (pathA.path < pathB.path) return -1
                if (pathA.path > pathB.path) return 1
                return 0
            }
        }
    }
</script>

<style scoped>
    .full-width {
        width: 100%;
    }
    .proj-path-list-wrapper {
        overflow: auto;
        border: 1px solid #b2dfdb;
        /* 目录列表高度 = 屏幕高度 - 对话框上下边距 - 标题高度 - 标签页高度 - 标签页下边距 - 模块名输入框高度 - 关闭按钮高度 */
        height: calc(100vh - 30px - 75.5px - 33.1px - 15px - 48px - 52px);
    }
    .proj-path-list-wrapper ul {
        padding-left: 0;
    }
    .module-name {
        margin-bottom: 0;
    }
</style>