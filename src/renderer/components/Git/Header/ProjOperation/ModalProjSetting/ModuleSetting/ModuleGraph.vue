<template>
    <mu-flex id="proj-graph-wrapper">
        <div id="proj-graph">
            <div id="graph-width-test" class="card-container" style="visiblility:hidden; width: 170px; position: fixed; top: 100vh">
                <!-- 由于在画出树状图之前无法获取标题宽度（因为还没加入DOM树），因此用此div做宽度测量 -->
                <h1 class="main-text"><span id="graph-width-test-txt"></span></h1>
            </div>
        </div>
    </mu-flex>
</template>

<script>
    import G6 from '@antv/g6'
    import '@antv/g6/build/plugin.behaviour.analysis'

    // 定义边
    G6.registerEdge('edgeVHV', {
        getPath(item) {
            const points = item.getPoints()
            const start = points[0]
            const end = points[points.length-1]
            const vgap = end.y - start.y
            const ygap = vgap / 5 * 2
            return [
                ['M', start.x, start.y],
                ['L', start.x, start.y + ygap],
                ['L', end.x, start.y + ygap],
                ['L', end.x, end.y]
            ]
        }
    })
    // 定义节点
    G6.registerNode('card', {
        collapseBtn: 'remove_circle',
        expandBtn: 'add_circle',
        draw(item) {
            const group = item.getGraphicGroup()
            const {id, moduleName, edit, remove, del, selected, collapsed, children} = item.getModel()
            const borderWidth = 1 * 2 // 由.card-container样式决定
            const margin = 10 * 2 // 由.main-text样式决定
            const h1Width = 148 // .main-text的内容宽度（总长度 - 边距 - 边框，浏览器可直接查看）
            const widthDefault = 170
            const heightDefault = 80
            const buttonWidth = 16
            const buttonHeight = 16

            // 测量标题宽度
            let div = document.getElementById("graph-width-test")
            let span = document.getElementById("graph-width-test-txt")
            span.innerText = moduleName

            let width = span.offsetWidth > h1Width ? div.scrollWidth + borderWidth + margin : widthDefault
            let height = heightDefault

            let button = ''
            if(children && children.length > 0) {
                button = '<i class="ce-button material-icons">' + (collapsed ? this.expandBtn : this.collapseBtn) + '</i>'
            } 
            
            let html = null
            let cardClass = selected ? "card-container card-selected" : "card-container"
            if (id == "gmm root") {
                height = 35
                html = G6.Util.createDOM(`
                    <div class="${cardClass}" style="height: auto">
                        <h1 class="main-text" style="border-bottom: 0; margin-top: 0;"><span>${moduleName}</span></h1>
                    </div>
                `)
            }
            else {
                html = G6.Util.createDOM(`
                    <div class="${cardClass}">
                        <h1 class="main-text"><span>${moduleName}</span></h1>
                        <p>
                            <a href="#" class="left-text">${edit}</a>
                            <a href="#" class="center-text">${remove}</a>
                            <a href="#" class="right-text">${del}</a>
                        </p>
                    </div>
                `)
            }
            
            const keyShape = group.addShape('dom', {
                attrs: {
                    x: 0,
                    y: 0,
                    width,
                    height,
                    html
                }
            })
            group.addShape('dom', {
                attrs: {
                    x: width/2 - buttonWidth/2,
                    y: height - buttonHeight,
                    width: buttonWidth,
                    height: buttonHeight,
                    html: button
                }
            })
            return keyShape
        },
        anchor: [
            [0.5, 0],
            [0.5, 1]
        ]
    })

    export default {
        props: [
            "lang",
            "moduleConfig"
        ],
        data () {
            return {
                moduleSelected: null,
                graph: null,
                graphRoot: {
                    id: "gmm root",
                    moduleName: this.lang['Proj Setting Module Root'],
                    edit: "",
                    remove: "",
                    del: "",
                    selected: false,
                    children: []
                }
            }
        },
        watch: {
            moduleConfig: {
                deep: true,
                handler (config) {
                    this.moduleSelected = null // 更新图的时候取消任何选中

                    this.updateGraph(config)
                }
            }
        },
        mounted () {
            this.$nextTick(function() {
                this.graph = this.createGraph()
                this.updateGraph()
            })
        },
        methods: {
            createGraph: function() {
                let that = this
                const tree = new G6.Tree({
                    container: 'proj-graph',
                    renderer: 'svg',
                    layout: new G6.Layouts.CompactBoxTree({
                        getHGap: function getHGap() {
                            // 横向间距
                            return 20
                        },
                        getVGap: function getVGap() {
                            // 竖向间距
                            return 14
                        },
                        direction: 'TB' // 方向：top bottom 从上到下画树状图
                    }),
                    fitView: 'tc', // 整个树状图在画布中的位置：top center
                    modes: {
                        default: ['panCanvas', 'wheelZoom']
                    }
                })
                tree.node({
                    shape: 'card'
                })
                tree.edge({
                    shape: 'edgeVHV',
                    endArrow: true
                })
                tree.on('node:click', (ev) => {
                    const { domEvent, item } = ev
                    const { target } = domEvent
                    const { id, moduleName, collapsed } = item.getModel()
                    if (target.className == "left-text") {
                        that.moduleModify(moduleName)
                    }
                    else if (target.className == "center-text") {
                        that.moduleRemove(moduleName)
                    }
                    else if (target.className == "right-text") {
                        that.moduleDelete(moduleName)
                    }
                    else if (target.className.indexOf('ce-button') > -1) {
                        if (collapsed) {
                            tree.update(item, {
                                collapsed: false,
                            })
                        } else {
                            tree.update(item, {
                                collapsed: true,
                            })
                        }
                    }
                    else {
                        that.moduleSelect(id)
                    }
                })

                return tree
            },
            updateGraph: function(config) {
                config = config || this.moduleConfig

                let data = {
                    roots: [ this.deepCopyObj(this.graphRoot) ]
                }
                // 按依赖顺序创建节点
                let modNames = Object.keys(config)
                let curNodes = {'gmm root': data.roots[0]}
                while(modNames.length > 0) {
                    let modNamesUnhandle = []
                    let nextNodes = {}
                    for (var name of modNames) {
                        let node = {
                            id: name,
                            moduleName: name,
                            edit: this.lang['Modify'],
                            remove: this.lang['Remove'],
                            del: this.lang['Delete'],
                            selected: false,
                            children: []
                        }

                        if (config[name].config.isRoot) {
                            curNodes['gmm root'].children.push(node)
                            nextNodes[name] = node
                        }
                        else if (config[name].dependencies.length > 0) {
                            let parentName = config[name].dependencies[0]
                            if (curNodes[parentName]) {
                                curNodes[parentName].children.push(node)
                                nextNodes[name] = node
                            }
                            else {
                                modNamesUnhandle.push(name)
                            }
                        }
                        // else 舍弃自由模块
                    }
                    if (modNames.toString() == modNamesUnhandle.toString()) {
                        // 待处理的模块未变化，依赖关系出错，被依赖的模块不存在或名字不同
                        this.$toast.error(this.lang['Error module dependencies'])
                        this.$emit("handleWrongDependence", {modNames: modNames})
                        break
                    } 
                    modNames = modNamesUnhandle
                    curNodes = nextNodes
                }

                this.graph.read(data)
            },
            moduleModify: function(modName) {
                this.$emit("onModifyModule", {name: modName})
            },
            moduleRemove: function(modName) {
                this.$confirm(this.confirmRemoveInfo(modName), this.lang['Comfirm Module Remove Title'], {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        this.$emit("onRemoveModule", {name: modName})
                    }
                })
            },
            moduleDelete: function(modName) {
                this.$confirm(this.confirmDeleteInfo(modName), this.lang['Comfirm Module Delete Title'], {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        this.$emit("onDeleteModule", {name: modName})
                    }
                })
            },
            moduleSelect: function(modName) {
                if (this.moduleSelected != null) {
                    this.graph.update(this.moduleSelected, {selected: false})
                    this.moduleSelected = null
                }
                else if (modName != "gmm root") {
                    this.graph.update(modName, {selected: true})
                    this.moduleSelected = modName
                }
                this.$emit("onSelectModule", {name: modName, type: 'graph'})
            },
            confirmRemoveInfo: function(modName) {
                return this.lang['Comfirm Module Remove Info'].replace('%module%', modName)
            },
            confirmDeleteInfo: function(modName) {
                return this.lang['Comfirm Module Delete Info'].replace('%module%', modName)
            }
        }
    }
</script>

<style>
    #proj-graph-wrapper {
        /* 画布在窗口变化时尺寸处理流程获取CSS3的calc会报错，因此放在父元素计算，画布宽高用100% */
        /* 画布宽度 = 屏幕宽度 - 对话框左右外边距 - 对话框左右内边距 - 自由模块宽度 */
        width: calc(100vw - 50px - 48px - 250px);
        /* 画布高度 = 屏幕高度 - 对话框上下边距 - 标题高度 - 标签页高度 - 标签页下边距 - 关闭按钮高度 */
        height: calc(100vh - 30px - 75.5px - 33.1px - 15px - 52px);
    }
    #proj-graph {
        width: 100%;
        height: 100%;
        border: 1px solid black;
        overflow: hidden;
    }
    .card-container {
        min-width: 170px;
        height: 74px;
        border: 1px solid #DBDBDB;
        border-radius: 4px;
        cursor: pointer;
    }
    .card-selected {
        background-color: #c8e6c9;
    }
    .ce-button {
        color: darkgrey;
        font-size: 16px;
    }
    .ce-button:hover {
        cursor: copy;
    }
    .card-container .main-text {
        text-align: center;
        margin: 12px 10px;
        margin-bottom: 0px;
        font-size: 16px;
        border-bottom: 1px solid #DBDBDB;
        white-space: nowrap;
    }
    .card-container p {
        font-size: 12px;
        margin: 8px;
        display: flex;
        justify-content: space-around;
    }
    .card-container .left-text {
        color: blue;
    }
    .card-container .center-text {
        color: green;
    }
    .card-container .right-text {
        color: red;
    }
    .card-container .left-text:hover,
    .card-container .center-text:hover,
    .card-container .right-text:hover {
        cursor: default;
        text-decoration: underline;
    }
</style>
