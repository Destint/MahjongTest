<template>
    <ul>
        <li v-for="(val, key, index) in projFullPaths" :key="index">
            <mu-flex>
                <mu-checkbox :ripple="false" :disabled="isPickedAllChildren" :value="allPath[index]" v-model="pathPickAllChildren" @change="onCheckAllChildren(allPath[index])" uncheck-icon="star_border" checked-icon="star"></mu-checkbox>
                <mu-checkbox :ripple="false" :disabled="isPickedAllChildren" :value="allPath[index]" v-model="pathChecked" :label="val.folder" @change="onCheckPath(allPath[index])"></mu-checkbox>
                <mu-button v-if="!isObjectEmpty(val.subpaths)" class="toggle-btn" icon :ripple="false" @click="onToggle(index)">
                    <mu-icon class="toggle-icon" size="24" :value="showChildren[index] ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"></mu-icon>
                </mu-button>
            </mu-flex>
            <proj-path-list v-show="showChildren[index]" v-if="!isObjectEmpty(val.subpaths) && buildChildList[index]"
                :projFullPaths="val.subpaths" :isPickedAllChildren="disableAllChildren(index)" :pickedPaths="pickedPaths"
                @onPickPath="onPickPath" @onUnpickPath="onUnpickPath">
            </proj-path-list>
        </li>
    </ul>
</template>

<script>
    export default {
        name: "proj-path-list",
        props: [
            "projFullPaths", // 项目所有目录
            "isPickedAllChildren", // 是否勾选子目录
            "pickedPaths" // 已勾选的目录
        ],
        data () {
            return {
                allPath: [], // 项目所有目录
                pathChecked: [], // 勾选的目录，关联checkbox
                pathPickAllChildren: [], // 全选子目录的目录
                showChildren: [], // 是否展开显示子目录
                buildChildList: [] // 是否构建子目录
            }
        },
        watch: {
            isPickedAllChildren (val) {
                if (val != true) return
                // 只有父目录全选子目录，才需要清空勾选的子目录
                for(var index in this.pathChecked) {
                    let path = this.pathChecked[index]
                    this.$emit("onUnpickPath", path)
                }
                this.pathChecked = []
                for(var index in this.pathPickAllChildren) {
                    let path = this.pathPickAllChildren[index]
                    path.subpath = false
                }
                this.pathPickAllChildren = []
            }
        },
        mounted () {
            this.$nextTick(function() { // 不用nextTick无法获取props和data
                for(var key in this.projFullPaths) {
                    let path = {path: key, subpath: false}
                    this.allPath.push(path)
                    this.showChildren.push(false)
                    this.buildChildList.push(false)
                    // 检测是否为父组件传过来的已选中目录
                    let indexPathAlreadyChecked = this.getIndexOfPathAlreadyPicked(key)
                    if (indexPathAlreadyChecked > -1) {
                        this.pathChecked.push(path)
                        // 是否全选子目录
                        if (this.pickedPaths[indexPathAlreadyChecked].subpath) {
                            path.subpath = true
                            this.pathPickAllChildren.push(path)
                        }
                        this.$emit("onPickPath", path)
                    }
                }
            })
        },
        methods: {
            onCheckPath: function(path) {
                if (this.isPathPicked(path)) this.$emit("onPickPath", path)
                else this.$emit("onUnpickPath", path)
            },
            onToggle: function(index) { // 不能直接索引赋值，vue不会响应索引赋值
                if (!this.buildChildList[index]) this.$set(this.buildChildList, index, !this.buildChildList[index])
                this.$set(this.showChildren, index, !this.showChildren[index])
            },
            onPickPath: function(path) { // 向父组件传递
                this.$emit("onPickPath", path)
            },
            onUnpickPath: function(path) { // 向父组件传递
                this.$emit("onUnpickPath", path)
            },
            onCheckAllChildren: function(path) {
                path.subpath = !path.subpath
                if (this.isPathPicked(path)) this.$emit("onPickPath", path)
            },
            isPathPicked: function(path) {
                return this.pathChecked.indexOf(path) > -1
            },
            disableAllChildren (index) {
                return this.isPickedAllChildren || (this.allPath[index] && this.allPath[index].subpath)
            },
            getIndexOfPathAlreadyPicked: function(path) {
                if (this.pickedPaths.length == 0) return -1
                for (var index in this.pickedPaths) {
                    if (this.pickedPaths[index].path == path) return index
                }
                return -1
            }
        }
    }
</script>

<style coped>
    .toggle-btn {
        width: 0;
        height: 0;
        margin-left: 10px;
    }
    ul li {
        list-style-type:none;
    }
</style>

