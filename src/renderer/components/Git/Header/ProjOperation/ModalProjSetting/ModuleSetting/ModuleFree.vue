<template>
    <mu-flex style="width: 250px;">
        <mu-list class="module-list" dense>
            <mu-sub-header class="module-list-header">{{lang['Proj Setting Module Free']}}</mu-sub-header>
            <mu-list-item :class="[moduleSelected == name ? 'module-selected' : '']" button :ripple="false" v-for="(mod, name) in freeModules" :key="name" @click="onModuleSelect(name)">
                <mu-list-item-title v-tooltip="{content: name, show: moduleShowingTip == name, trigger: 'manual'}"
                    @mouseenter="showTip(name, $event)" @mouseleave="hideTip(name)">
                    {{name}}
                </mu-list-item-title>
                <mu-list-item-action>
                    <mu-button icon @click.stop="onModify(name)">
                        <mu-icon value="edit"></mu-icon>
                    </mu-button>
                    <mu-button icon @click.stop="onDelete(name)">
                        <mu-icon value="delete"></mu-icon>
                    </mu-button>
                </mu-list-item-action>
            </mu-list-item>
        </mu-list>
    </mu-flex>
</template>

<script>
    export default {
        props: [
            "lang",
            "moduleConfig"
        ],
        data () {
            return {
                moduleSelected: null,
                moduleShowingTip: null // 正在显示tip的模块名
            }
        },
        computed: {
            freeModules: function() {
                let modules = {}
                for (var key in this.moduleConfig) {
                    let mod = this.moduleConfig[key]
                    if (!mod.config.isRoot && mod.dependencies.length == 0) {
                        modules[key] = mod
                    }
                }
                this.moduleSelected = null
                return modules
            }
        },
        methods: {
            showTip: function(mod, event) {
                if (event.target.clientWidth < event.target.scrollWidth) {
                    this.moduleShowingTip = mod
                }
            },
            hideTip: function(mod) {
                this.moduleShowingTip = null
            },
            onDelete: function(modName) {
                let waring = this.lang['Comfirm Module Free Delete'].replace("%module%", modName)
                this.$confirm(waring, '', {
                    width: 400,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        this.$emit("onDeleteModule", {name: modName})
                    }
                })
            },
            onModify: function(modName) {
                this.$emit("onModifyModule", {name: modName})
            },
            onModuleSelect: function(modName) {
                if (this.moduleSelected == modName) this.moduleSelected = null
                else this.moduleSelected = modName
                this.$emit("onSelectModule", {name: modName, type: "free"})
            }
        }
    }
</script>

<style scoped>
    .module-list {
        /* 画布高度 = 屏幕高度 - 对话框上下边距 - 标题高度 - 标签页高度 - 标签页下边距 - 关闭按钮高度 */
        height: calc(100vh - 30px - 75.5px - 33.1px - 15px - 52px);
        border: 1px solid black;
        border-left: 0;
        overflow-y: auto;
    }
    .module-list-header {
        padding-left: 0;
        background-color: aqua;
        text-align: center;
        font-size: 16px;
        line-height: 25px;
    }
    .module-list .mu-item-action {
        min-width: 50px;
    }
    .module-list .mu-item-action.is-more {
        padding-bottom: 3px;
        flex-direction: row;
    }
    .module-list .mu-icon-button {
        width: 30px;
        height: 30px;
    }
    .module-selected {
        background-color: #c8e6c9;
    }
</style>
