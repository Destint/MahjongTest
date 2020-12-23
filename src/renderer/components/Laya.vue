<template>
    <mu-flex direction="column" style="padding: 30px 50px">
        <mu-button large full-width color="primary" @click="onCompressJS">{{lang['Compress JS']}}</mu-button>
        <mu-button large full-width color="primary" @click="onPackageJS" style="margin-top: 10px">{{lang['Package JS']}}</mu-button>
        <mu-dialog :title="lang['Compress JS']" :open="compressing" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-flex>{{compressProgress}}/{{compressMax}}</mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="compressProgress" :max="compressMax" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-button slot="actions" flat color="primary" @click="compressing = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
    </mu-flex>
</template>

<script>
    const fs = require('fs')
    const pathMod = require("path")
    const Terser = require("terser")
    const md5File = require('md5-file/promise')

    export default {
        name: "app-laya",
        data () {
            return {
                lang: this.i18n.__('Laya'),
                compressFolder: "js.min/",
                compressing: false,
                compressProgress: 0,
                compressMax: 0,
                doCompress: true,
                topLevel: false,
                nameCache: null,
                createMapJS: false
            }
        },
        methods: {
            onCompressJS: function() {
                let that = this
                this.$confirm(this.lang['Comfirm Compress JS'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.doCompress = true
                        that.topLevel = true
                        that.nameCache = {}
                        that.compressJS()
                    }
                })
            },
            onPackageJS: function() { // 不压缩
                let that = this
                this.$confirm(this.lang['Comfirm Package JS'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.doCompress = false
                        that.topLevel = false
                        that.nameCache = {}
                        that.compressJS()
                    }
                })
            },
            uglifyJS: function(files, compressPath, outFile) {
                let that = this
                let p = new Promise((resolve, reject) => {
                    if (outFile.substr(-3).toLowerCase() != ".js") outFile += ".js"
                    let mapFile = outFile + ".map"
                    if (outFile.lastIndexOf(".min.js") == -1) outFile = outFile.replace(".js", ".min.js")

                    // 读取JS
                    let jsList = {}
                    let promises = []
                    for (var file of files) {
                        promises.push(new Promise((res, rej) => {
                            fs.readFile(file, 'utf8', (err, data) => {
                                if (err) console.log(err)
                                res(data)
                            })
                        }))
                    }
                    // 压缩JS并输出
                    Promise.all(promises)
                        .then((data) => {
                            // 读取当前项目使用过的压缩名

                            // 压缩
                            for (var index = 0; index < files.length; index++) {
                                jsList[ files[index] ] = data[index]
                            }

                            let terserConfig = {
                                // sourceMap: {
                                //     filename: outFile,
                                //     url: mapFile
                                // }
                            }
                            if (!that.doCompress) {
                                terserConfig.compress = false
                                terserConfig.mangle = false
                            }
                            else if (that.topLevel) {
                                terserConfig.mangle = {
                                    toplevel: true
                                }
                                terserConfig.nameCache = that.nameCache
                            }

                            let js_min = Terser.minify(jsList, terserConfig)

                            if (js_min.error) throw js_min.error
                            
                            // 输出
                            fs.writeFile(pathMod.join(compressPath, outFile), js_min.code, 'utf8', (err) => {
                                if (that.createMapJS) {
                                    fs.writeFile(pathMod.join(compressPath, mapFile), js_min.map, 'utf8', (err) => {
                                        Promise.all(promises)
                                            .then((data) => {
                                                resolve(files.length)
                                            })
                                    })
                                }
                                else {
                                    Promise.all(promises)
                                        .then((data) => {
                                            resolve(files.length)
                                        })
                                }
                            })
                            
                        })
                })
                return p
            },
            modifyJsVersion: function(compressPath, modNames) {
                let mainJs = pathMod.join(compressPath, "main.min.js")
                if (fs.existsSync(mainJs)) {
                    let content = fs.readFileSync(mainJs).toString()
                    for (var outFile of modNames) {
                        if (outFile.substr(-3).toLowerCase() != ".js") outFile += ".js"
                        if (outFile.lastIndexOf(".min.js") == -1) outFile = outFile.replace(".js", ".min.js")

                        let preStr = outFile + "?v="
                        let endStr1 = ","
                        let endStr2 = "}"
                        let index1 = content.indexOf(preStr)
                        if (index1 < 0) continue
                        let index2 = content.indexOf(endStr1, index1)
                        let index3 = content.indexOf(endStr2, index1)
                        if (index3 < index2) index2 = index3

                        let str = content.substring(index1, index2)
                        let newStr = preStr + md5File.sync(pathMod.join(compressPath, outFile)) + '"'
                        content = content.replace(str, newStr)
                    }
                    fs.writeFileSync(mainJs, content)
                }
                this.$toast.success(this.lang['Finish'])
            },
            compressJS: async function() {
                let that = this
                let projPath = this.$route.params.projPath
                if (projPath) {
                    this.compressing = true
                    this.compressProgress = 0
                    // 根据 bin/index.html 打包JS
                    let fileIndex = pathMod.join(projPath, "bin/index.html")
                    if (fs.existsSync(fileIndex)) {
                        projPath = pathMod.join(projPath, "/bin/")
                        // 检查压缩目录是否存在
                        let compressPath = pathMod.join(projPath, this.compressFolder)
                        if (!fs.existsSync(compressPath)) {
                            fs.mkdirSync(compressPath)
                        }

                        // 开始处理模块
                        let content = fs.readFileSync(fileIndex).toString().split("\n")
                        // 计算总量
                        let isComment = false
                        this.compressMax = 0
                        for (var line of content) {
                            if (isComment) {
                                if (line.indexOf("-->") > -1) isComment = false
                            }
                            else if (line.indexOf("<!--") > -1) {
                                if (line.indexOf("-->") == -1) {
                                    isComment = true
                                }
                            }
                            else if (line.indexOf("script ") > -1 && line.indexOf("src=") > -1) {
                                this.compressMax++
                            }
                        }
                        // 获取各模块文件名
                        let modList = []
                        let modNames = []
                        let modFiles = []
                        let modName = ""
                        isComment = false
                        for (var line of content) {
                            if (isComment) {
                                if (line.indexOf("-->") > -1) isComment = false
                            }
                            else if (line.indexOf("<!--") > -1) {
                                if (line.indexOf("Mod:") > -1) { // 模块标签
                                    let index = line.indexOf("Mod:")
                                    if (modName.length == 0) {
                                        if (line.indexOf(":start", index + 4) > -1) { // 模块开头
                                            let index2 = line.indexOf(":start", index + 4)
                                            modName = line.substring(index + 4, index2).trim()
                                        }
                                    }
                                    else if (modName.length > 0 && line.indexOf(":end", index + 4) > -1) { // 非平台依赖模块结尾
                                        modList.push(modFiles)
                                        modNames.push(modName)
                                        modName = ""
                                        modFiles = []
                                    }
                                }
                                else if (line.indexOf("-->") == -1) {
                                    isComment = true
                                }
                            }
                            else if (line.indexOf("script ") > -1) {
                                // 案例：script src="libs/laya.core.js?v=1.0.11" ><\/script>
                                // 第一次截取：src="libs/laya.core.js?v=1.0.11" >
                                let startIndex = line.indexOf("script ")
                                let endIndex = line.lastIndexOf("<\/script>")
                                let file = line.substring(startIndex + 'script '.length, endIndex)
                                // 第二次截取：libs/laya.core.js?v=1.0.11" 
                                startIndex = file.indexOf('src="')
                                endIndex = file.lastIndexOf('>')
                                file = file.substring(startIndex + 'src="'.length, endIndex).trim()
                                // 第三次截取：libs/laya.core.js
                                endIndex = file.lastIndexOf("?")
                                if (endIndex == -1) endIndex = file.lastIndexOf('"')
                                file = file.substring(0, endIndex)
                                // 获取文件名
                                endIndex = file.lastIndexOf('/')
                                let fileName = file.substr(endIndex + 1)
                                // 拼接绝对路径
                                file = pathMod.join(projPath, file)

                                if (modName.length > 0) modFiles.push(file) // 模块代码
                                else { // 非模块代码
                                    modList.push([file])
                                    modNames.push(fileName)
                                }
                            }
                        }
                        // 压缩
                        let progress = 0
                        let mangleFile = that.doCompress ? pathMod.join(projPath, "../gmm_mangle.json") : ""
                        if (that.doCompress) { // 获取使用过的混淆名
                            if (fs.existsSync(mangleFile))
                                that.nameCache = JSON.parse(fs.readFileSync(mangleFile, "utf8"))
                        }
                        for (var index = 0; index < modList.length; index++) {
                            let files = modList[index]
                            modName = modNames[index]
                            this.uglifyJS(files, compressPath, modName)
                                .then((result) => {
                                    if (that.doCompress) {
                                        progress += result
                                        if (progress == that.compressMax) {
                                            // 第一次压缩获取所有混淆名，第二次真正压缩
                                            for (var index = 0; index < modList.length; index++) {
                                                let files = modList[index]
                                                modName = modNames[index]
                                                this.uglifyJS(files, compressPath, modName)
                                                    .then((result) => {
                                                        that.compressProgress += result
                                                        
                                                        if (that.compressProgress == that.compressMax) {
                                                            // 保存混淆名
                                                            fs.writeFileSync(mangleFile, JSON.stringify(that.nameCache), "utf8")
                                                            // 版本号
                                                            that.modifyJsVersion(compressPath, modNames)
                                                        }
                                                    })
                                            }
                                        }
                                    }
                                    else {
                                        that.compressProgress += result

                                        if (that.compressProgress == that.compressMax) {
                                            // 版本号
                                            that.modifyJsVersion(compressPath, modNames)
                                        }
                                    }
                                })
                        }
                    }
                }
                else {
                    this.$toast.error(this.lang['Error Compress JS Path Empty'])
                }
            }
        }
    }
</script>
