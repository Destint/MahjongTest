<template>
    <mu-flex direction="column" style="padding: 30px 50px">
        <mu-flex>
            <mu-select :label="lang['Platform Select']" filterable v-model="platformNameSelected">
                <mu-option v-for="(platformName,index) in platformNames" :key="index" :label="platformAliasList[index] + '(' + platformName + ')'" :value="platformName"></mu-option>
            </mu-select>
            <mu-select :label="lang['Run Env']" filterable v-model="runEnv" style="margin-left: 10px;">
                <mu-option :label="lang['Run Env Inter']" value="InterNet"></mu-option>
                <mu-option :label="lang['Run Env Outer Test']" value="OuterNetTest"></mu-option>
                <mu-option :label="lang['Run Env Outer']" value="OuterNet"></mu-option>
            </mu-select>
        </mu-flex>
        <mu-button large full-width color="primary" @click="onResourceVersion">{{lang['Resource Version']}}</mu-button>
        <mu-button large full-width color="primary" @click="onCompressJS" style="margin-top: 10px">{{lang['Compress JS']}}</mu-button>
        <mu-button large full-width color="primary" @click="onPackageJS" style="margin-top: 10px">{{lang['Package JS']}}</mu-button>
        <mu-button large full-width color="secondary" @click="onOneClick" style="margin-top: 10px">{{lang['One Click']}}</mu-button>
        <mu-flex style="margin-top: 30px">
            <mu-select :label="lang['SDK']" filterable v-model="sdk">
                <mu-option :label="lang['SDK WeChat']" value="WeChat"></mu-option>
            </mu-select>
        </mu-flex>
        <mu-button large full-width color="lime800" @click="onUpload">{{lang['Upload']}}</mu-button>
        <!-- 打包JS进度框 -->
        <mu-dialog :title="lang['Compress JS']" :open="compressing" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-flex>{{curProgress}}/{{progressMax}}</mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="curProgress" :max="progressMax" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-alert color="info" style="margin-top: 5px">{{lang['Info Running']}}</mu-alert>
            <mu-button slot="actions" flat color="primary" @click="compressing = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
        <!-- 合并JSON进度框 -->
        <mu-dialog :title="lang['Merge JSON']" :open="merging" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-flex>{{curMergeProgress}}/{{mergeProgressMax}}</mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="curMergeProgress" :max="mergeProgressMax" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-alert color="info" style="margin-top: 5px">{{lang['Info Running']}}</mu-alert>
            <mu-button slot="actions" flat color="primary" @click="merging = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
        <!-- 资源版本进度框 -->
        <mu-dialog :title="lang['Resource Version']" :open="recordingVersion" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-alert v-if="!recordingVersionFinish" color="info">{{lang['Info Running']}}</mu-alert>
            <mu-alert v-else color="success">{{lang['Finish']}}</mu-alert>
            <mu-button slot="actions" flat color="primary" @click="recordingVersion = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
        <!-- 上传进度框 -->
        <mu-dialog :title="lang['Upload']" :open="uploading" :width=800 :overlay-close=false :esc-press-close=false>
            <mu-alert v-if="uploadFinish" color="success">
                <mu-icon left value="check_circle"></mu-icon>
                {{lang['Uploading Finish']}}
            </mu-alert>
            <div v-else style="width: 100%">
                <mu-flex>
                    <span>{{lang['Server Count']}}: {{uploadServerCurNum}}/{{uploadServerTotalCount}}</span>
                    <span style="margin-left: 50px">{{lang['Uploading To']}}: {{targetServer}}</span>
                </mu-flex>
                <mu-flex>
                    <mu-linear-progress mode="determinate" :value="uploadServerCurNum" :max="uploadServerTotalCount" :size="15" color="green"></mu-linear-progress>
                </mu-flex>
                <!-- 单服务器进度 -->
                <mu-stepper :active-step="uploadStep">
                    <mu-step><mu-step-label>
                        {{lang['Checking Path']}}
                    </mu-step-label></mu-step>
                    <mu-step><mu-step-label>
                        {{lang['Uploading Resource']}}
                    </mu-step-label></mu-step>
                    <mu-step><mu-step-label>
                        {{lang['Uploading Code']}}
                    </mu-step-label></mu-step>
                    <mu-step><mu-step-label>
                        {{lang['Updating Version']}}
                    </mu-step-label></mu-step>
                </mu-stepper>
                <mu-flex v-if="uploadStep == 1">{{curProgress}}/{{progressMax}}</mu-flex>
                <mu-flex v-else>&nbsp;</mu-flex><!-- 空行占位 -->
                <mu-flex>
                    <mu-linear-progress :mode="uploadProgressMode" :value="curProgress" :max="progressMax" :size="15" color="green"></mu-linear-progress>
                </mu-flex>
            </div>
            <mu-button slot="actions" flat color="primary" @click="uploading = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
    </mu-flex>
</template>

<script>
    const fs = require('fs')
    const pathMod = require("path")
    const Terser = require("terser")
    const md5File = require('md5-file/promise')
    const SFTPClient = require('ssh2-sftp-client')

    const exts = ['.png']
    var isMergeJSONSucceed = 0;
    export default {
        name: "app-laya",
        data () {
            return {
                lang: this.i18n.__('Laya'),
                langMsg: this.i18n.__('Message'),
                compressFolder: "js.min",
                compressing: false,
                merging: false,
                curProgress: 0,
                progressMax: 0,
                curMergeProgress: 0,
                mergeProgressMax: 0,
                doCompress: true,
                topLevel: false,
                nameCache: null,
                createMapJS: true,
                platformNameSelected: "",
                checkingConfig: 0,
                gmmConfigPlatform: {},
                gmmConfigServer: {},
                platformNames: [""],
                platformAliasList: [""],
                runEnv: "",
                sdk: "WeChat",
                recordingVersion: false,
                recordingVersionFinish: false,
                uploading: false,
                uploadStep: 0,
                uploadFinish: false,
                uploadProgressMode: "indeterminate",
                uploadServerTotalCount: 0,
                uploadServerCurNum: 0,
                targetServer: ""
            }
        },
        mounted () {
            this.checkingConfig = 2
            let that = this
            let projPath = this.$route.params.projPath
            if (!projPath) {
                this.$toast.error(this.lang['Error Compress JS Path Empty'])
                return
            }
            this.JStorage.setDataPath(projPath)
            // 检测平台配置文件
            this.JStorage.has(this._GmmConfigFilePlatform, function (error, hasKey) {
                if (error) {
                    that.checkingConfig--
                    throw error
                }
                if (hasKey) {
                    that.JStorage.get(that._GmmConfigFilePlatform, function (error, data) {
                        if (error) throw error
                        if (data) {
                            that.gmmConfigPlatform = that.deepCopyObj(data)
                            for(var platformName of Object.keys(that.gmmConfigPlatform)) {
                                let alias = that.gmmConfigPlatform[platformName].config.alias
                                alias = alias || platformName
                                that.platformNames.push(platformName)
                                that.platformAliasList.push(alias)
                            }
                            that.checkingConfig--
                        }
                    })
                }
                else {
                    that.checkingConfig--
                }
            })
            // 检测服务器配置文件
            this.JStorage.has(this._GmmServerFile, function (error, hasKey) {
                if (error) {
                    that.checkingConfig--
                    throw error
                }
                if (hasKey) {
                    that.JStorage.get(that._GmmServerFile, function (error, data) {
                        if (error) throw error
                        if (data) {
                            let servers = that.deepCopyObj(data).servers
                            for (var server of servers) {
                                that.gmmConfigServer[server.name] = server
                            }
                            that.checkingConfig--
                        }
                    })
                }
                else {
                    that.checkingConfig--
                }
            })
        },
        methods: {
            onCompressJS: function() {
                if (this.platformNameSelected.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect Platform'], time: 1000})
                    return
                }
                let that = this
                this.$confirm(this.lang['Comfirm Compress JS'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.compressFlow(true)
                    }
                })
            },
            onPackageJS: function() { // 不压缩
                if (this.platformNameSelected.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect Platform'], time: 1000})
                    return
                }
                let that = this
                this.$confirm(this.lang['Comfirm Package JS'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.compressFlow(false)
                    }
                })
            },
            compressFlow: function(doCompress) {
                doCompress = doCompress || false
                this.doCompress = doCompress
                this.topLevel = doCompress
                this.nameCache = {}
                this.modifyPlatform(this.compressJS)
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

                            let terserConfig = {}
                            if (that.createMapJS) {
                                terserConfig['sourceMap'] = {
                                    filename: outFile,
                                    url: mapFile
                                }
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
            modifyJsVersion: function(compressPath, modNames) { // 打包后修改main.min.js
                let mainJs = pathMod.join(compressPath, "main.min.js")
                if (fs.existsSync(mainJs)) {
                    let content = fs.readFileSync(mainJs).toString()
                    // JS版本
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
                    // version.json版本
                    let versionJson = pathMod.join(compressPath, "../version.json")
                    if (fs.existsSync(versionJson)) {
                        let platformName = this.platformNameSelected
                        let platformConfig = this.gmmConfigPlatform[platformName]
                        let suffix = platformConfig.config.suffix ? "." + platformConfig.config.suffix : ""
                        let index = content.indexOf("PreRunMode==RunMode." + platformName + suffix)
                        index = content.indexOf("version.json?v=", index)
                        let index2 = content.indexOf("\"", index)
                        content = content.substring(0, index) + "version.json?v=" + md5File.sync(versionJson).substr(0, 16) + content.substr(index2)
                    }
                    // 写入文件
                    fs.writeFileSync(mainJs, content)
                }
                this.$toast.success(this.lang['Finish'])
            },
            compressJS: function() {
                let that = this
                let projPath = this.$route.params.projPath
                if (projPath) {
                    // 根据 bin/indexGmm.html 打包JS
                    let fileIndex = pathMod.join(projPath, "bin/indexGmm.html")
                    if (fs.existsSync(fileIndex)) {
                        projPath = pathMod.join(projPath, "/bin/")
                        // 检查压缩目录是否存在
                        let compressPath = pathMod.join(projPath, this.compressFolder)
                        if (!fs.existsSync(compressPath)) {
                            fs.mkdirSync(compressPath)
                        }
                        else {
                            let files = fs.readdirSync(compressPath)
                            files.forEach(function(file, index) {
                                var curPath = pathMod.join(compressPath, file)
                                if (fs.statSync(curPath).isFile()) {
                                    fs.unlink(curPath, () => {})
                                }
                            })
                        }

                        // 开始处理模块
                        let content = fs.readFileSync(fileIndex).toString().split("\n")
                        // 计算总量
                        let isComment = false
                        this.progressMax = 0
                        for (var line of content) {
                            line = line.trim()
                            if (isComment) {
                                if (line.indexOf("-->") > -1) isComment = false
                            }
                            else if (line.indexOf("<!--") == 0) {
                                if (line.indexOf("-->") == -1) {
                                    isComment = true
                                }
                            }
                            else if (line.indexOf("<script ") == 0 && line.indexOf("src=") > -1) {
                                this.progressMax++
                            }
                        }
                        // 获取各模块文件名
                        let modList = []
                        let modNames = []
                        let modFiles = []
                        let modName = ""
                        isComment = false
                        for (var line of content) {
                            line = line.trim()
                            if (isComment) {
                                if (line.indexOf("-->") > -1) isComment = false
                            }
                            else if (line.indexOf("<!--") == 0) {
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
                            else if (line.indexOf("<script ") == 0) {
                                // 案例：script src="libs/laya.core.js?v=1.0.11" ><\/script>
                                // 第一次截取：src="libs/laya.core.js?v=1.0.11" >
                                let platformName = this.platformNameSelected
                                let thirdPartysNoPackSelected = this.gmmConfigPlatform[platformName].config.thirdPartyNoPack
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

                                let isNoPackName = false
                                if (modName.length > 0) {
                                    if(modName == "third_party"){
                                        for(var noPackName of thirdPartysNoPackSelected){
                                            if(noPackName == fileName) {
                                                isNoPackName = true 
                                                this.progressMax --
                                                break
                                            }
                                        }
                                        if(!isNoPackName) modFiles.push(file)
                                    }
                                    else modFiles.push(file) // 模块代码
                                }
                                else { // 非模块代码
                                    modList.push([file])
                                    modNames.push(fileName)
                                }
                            }
                        }
                        // 压缩
                        let progress = 0
                        let mangleFile = that.doCompress ? pathMod.join(projPath, "../" + that._GmmMangleFile) : ""
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
                                        if (progress == that.progressMax) {
                                            // 第一次压缩获取所有混淆名，第二次真正压缩
                                            for (var index = 0; index < modList.length; index++) {
                                                let files = modList[index]
                                                modName = modNames[index]
                                                this.uglifyJS(files, compressPath, modName)
                                                    .then((result) => {
                                                        that.curProgress += result
                                                        
                                                        if (that.curProgress == that.progressMax) {
                                                            // 保存混淆名
                                                            fs.writeFileSync(mangleFile, JSON.stringify(that.nameCache), "utf8")
                                                            // 版本号
                                                            that.modifyJsVersion(compressPath, modNames)
                                                            that.clear()
                                                        }
                                                    })
                                            }
                                        }
                                    }
                                    else {
                                        that.curProgress += result

                                        if (that.curProgress == that.progressMax) {
                                            // 版本号
                                            that.modifyJsVersion(compressPath, modNames)
                                            that.clear()
                                        }
                                    }
                                })
                        }
                    }
                }
                else {
                    this.$toast.error(this.lang['Error Compress JS Path Empty'])
                }
            },
            mergeJSON: function() {  
                isMergeJSONSucceed = 1;
                let that = this;
                let projPath = this.$route.params.projPath; //获取项目路径
                if (projPath) {
                    that.curMergeProgress = 0;
                    that.mergeProgressMax = 0;
                    let jsonConfigPath = pathMod.join(projPath, "/gmmconfig_mergejson.json"); //获取json合并的配置文件路径
                    if (fs.existsSync(jsonConfigPath)) {
                        let configContent = fs.readFileSync(jsonConfigPath).toString(); //读取json配置文件的内容
                        if (!configContent) return;
                        configContent = configContent.replace(/\/\/.*/g,''); //去除配置文件中的注释
                        configContent = JSON.parse(configContent); //转为数组
                        findJSONAndMerge(configContent);
                    } else {
                        return;
                    }
                } else {
                    isMergeJSONSucceed = 0;
                    this.$toast.error({message: this.lang['Error Compress JS Path Empty'], time: 1000});
                }

                function findJSONAndMerge(content) {
                    let jsonList = [];
                    let i = -1;
                    let flag = 0;
                    //将json配置文件里的信息转为二维数组
                    content.forEach( (item, index) => {
                        if (item.indexOf("saveTheFileAs:") != -1) {
                            i++;
                            that.mergeProgressMax++;
                            jsonList[i] = new Array();
                            jsonList[i].push(item);
                        }
                        else {
                            jsonList[i].push(item);
                        }
                    });
                    if (that.mergeProgressMax == 0) {
                        return;
                    }
                    that.merging = true;
                    jsonList.forEach( (item, index) => {
                        let allJSONContent = ''; //要合并的json内容
                        let jsonMergeName = ''; //合并生成的json文件名字
                        jsonList[index].forEach( (item1, index1) => {
                            if (index1 == 0) {
                                jsonMergeName = item1.substr(14);
                            } else {
                                let jsonPath = pathMod.join(projPath, "/bin/" + item1); //获取要合并的json路径
                                //截取路径的一段生成json的key C:\project\BjGame_JS\bin\com\MessageTipBar.json => com/MessageTipBar
                                let startIndex = jsonPath.indexOf("bin\\");
                                let endIndex = jsonPath.lastIndexOf(".json")
                                let jsonFlag = jsonPath.substring(startIndex + 4, endIndex);
                                jsonFlag = jsonFlag.replace(/\\/g, "/");
                                // 检测要合并的文件路径是否存在 fs.existsSync
                                if (fs.existsSync(jsonPath)) {
                                    let jsonContent = fs.readFileSync(jsonPath).toString(); //读取JSON文件中的内容
                                    if (index1 == 1 && index1 == jsonList[index].length - 1) {
                                        allJSONContent += "{" + "\"" + jsonFlag + "\":" + jsonContent + "}";
                                    } else {
                                        if (index1 == 1) {
                                            allJSONContent += "{" + "\"" + jsonFlag + "\":" + jsonContent + ",";
                                        }
                                        else if (index1 == jsonList[index].length - 1) {
                                            allJSONContent += "\"" + jsonFlag + "\":" + jsonContent + "}";
                                        }
                                        else {
                                            allJSONContent += "\"" + jsonFlag + "\":" + jsonContent + ",";
                                        }
                                    }
                                } else {
                                    that.$toast.error({message: that.lang['Error Not JSON Path'], time: 1000});
                                    console.log(jsonPath);
                                    flag = 1;
                                    return;
                                }
                            }
                        })
                        if (flag) {
                            isMergeJSONSucceed = 0;
                            return;
                        }
                        let outJSONPath = pathMod.join(projPath, "/bin/json");
                        //判断bin目录里是否有json文件夹 若无则新建一个
                        if (!fs.existsSync(outJSONPath)) {
                            fs.mkdirSync(outJSONPath);
                        }
                        outJSONPath = pathMod.join(outJSONPath, jsonMergeName);
                        fs.writeFileSync(outJSONPath, allJSONContent, "utf8");
                        that.curMergeProgress++;
                    })
                }
            },
            modifyPlatform: function(callback) {
                // 修改平台文件，比如bin/index和AppMacros
                let that = this
                let projPath = this.$route.params.projPath
                let platformName = this.platformNameSelected
                let platformConfig = this.gmmConfigPlatform[platformName]
                // 获取项目配置
                this.JStorage.setDataPath(projPath)
                this.JStorage.get(this._GmmConfigFileOrigin, function (error, data) {
                    if (error) throw error
                    if (data) {
                        let moduleConfig = data
                        let mods = that.getPlatformRequiredModules(platformConfig.dependencies, moduleConfig)

                        // 修改 bin/index.html
                        let fileIndex = pathMod.join(projPath, "bin/index.html")
                        let newFileIndex = pathMod.join(projPath, "bin/indexGmm.html")
                        if (fs.existsSync(fileIndex)) {
                            let content = fs.readFileSync(fileIndex).toString().split("\n")
                            let newContent = []
                            let isModContent = true
                            for (var line of content) {
                                if (line.indexOf("<!--") > -1 && line.indexOf("Mod:") > -1) { // 模块标签
                                    let index = line.indexOf("Mod:")
                                    if (isModContent) {
                                        if (line.indexOf(":start", index + 4) > -1) { // 判断平台依赖模块开头
                                            let index2 = line.indexOf(":start", index + 4)
                                            let mod = line.substring(index + 4, index2).trim()
                                            if (mods.indexOf(mod) == -1) isModContent = false // 不是平台依赖模块
                                            else newContent.push(line) // 是平台依赖模块
                                        }
                                        else if (line.indexOf(":end", index + 4) > -1) { // 平台依赖模块结尾
                                            newContent.push(line)
                                        }
                                        else newContent.push(line) // 普通注释
                                    }
                                    else if (!isModContent && line.indexOf(":end", index + 4) > -1) { // 非平台依赖模块结尾
                                        isModContent = true
                                    }
                                }
                                else if (isModContent) newContent.push(line) // 非模块标签内容
                            }
                            newContent = newContent.join("\n")
                            fs.writeFileSync(newFileIndex, newContent)
                        }

                        // 修改 AppMacros
                        let fileAppMacros = pathMod.join(projPath, "src/AppMacros.js")
                        if (fs.existsSync(fileAppMacros)) {
                            // 修改 RunMode
                            let content = fs.readFileSync(fileAppMacros).toString()
                            let mode = "var PreRunMode = RunMode." + platformName
                            mode += platformConfig.config.suffix ? "." + platformConfig.config.suffix : ""
                            mode += ";"
                            let newContent = content.replace(/var PreRunMode = RunMode\.[^;]+;/, mode)
                            // 修改 RunEnv
                            let env = "var PreRunEnv = RunEnv." + (that.runEnv == "OuterNetTest" ? "OuterNet" : that.runEnv)
                            env += ";"
                            newContent = newContent.replace(/var PreRunEnv = RunEnv\.[^;]+;/, env)
                            // 写入文件
                            fs.writeFileSync(fileAppMacros, newContent)
                        }

                        // 修改 main.js
                        let fileMain = pathMod.join(projPath, "src/main.js")
                        if (fs.existsSync(fileMain)) {
                            // 修改 cdnPath
                            let content = fs.readFileSync(fileMain).toString()
                            let cdn = "var cdnPath = \""
                            if (that.runEnv == "OuterNet") cdn += platformConfig.config.cdn
                            else if (that.runEnv == "OuterNetTest") cdn += platformConfig.config.cdnOuterTest
                            else if (that.runEnv == "InterNet") cdn += platformConfig.config.cdnInnerTest
                            cdn += "\";"
                            let newContent = content.replace(/var cdnPath = "[^;]*";/, cdn)
                            // 写入文件
                            fs.writeFileSync(fileMain, newContent)
                        }

                        that.compressing = true
                        that.curProgress = 0
                        setTimeout(callback, 100) // 延迟是为了UI能够响应
                    }
                })
            },
            getPlatformRequiredModules: function(dependencies, allmods) {
                let mods = []
                for (var modName of dependencies) { // 选中的模块
                    if (mods.indexOf(modName) < 0) mods.push(modName)
                }
                for (var modName of mods) { // 选中模块的依赖
                    for (var parentName of allmods[modName].dependencies) {
                        if (mods.indexOf(parentName) < 0) mods.push(parentName)
                    }
                }
                return mods
            },
            clear: function() {
                // 清理压缩JS过程中的临时文件
                let projPath = this.$route.params.projPath
                let fileIndex = pathMod.join(projPath, "bin/indexGmm.html")
                fs.unlink(fileIndex, () => {})
            },
            onResourceVersion: function() {
                let that = this
                this.$confirm(this.lang['Comfirm Resource Version'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        // that.optimizeVersion()
                        that.mergeJSON();
                        if (isMergeJSONSucceed == 1) {
                            setTimeout( () => {
                                that.merging = false;
                                that.recordResourceVersion();
                            }, 100)
                        }
                    }
                })
            },

            // //瘦身version
            // optimizeVersion: function() {
            //     let projPath = this.$route.params.projPath; //获取项目路径
            //     if (projPath) {
            //         //获取项目version路径
            //         let versionPath = pathMod.join(projPath, "bin/version.json");
            //         //检测version路径是否存在
            //         if (fs.existsSync(versionPath)) {
            //             let versionContent = fs.readFileSync(versionPath);//.toString(); //读取version文件的内容
            //             versionContent = JSON.parse(versionContent); //转为json格式
            //             let newVersionContent = '{';
            //             for (var version in versionContent) {
            //                 if (version.indexOf(".json") != -1)
            //                 {
            //                     if (version.indexOf("json/") != -1) {
            //                         newVersionContent += "\"" + version + "\":" + "\"" + versionContent[version] + "\",";
            //                     }
            //                 } 
            //                 else if (version.indexOf(".js") != -1) continue;
            //                 else
            //                 {
            //                     newVersionContent += "\"" + version + "\":" + "\"" + versionContent[version] + "\",";
            //                 }
            //             }
            //             newVersionContent = newVersionContent.substring(0, newVersionContent.length - 1)
            //             newVersionContent += '}';
            //             let outVersionPath = pathMod.join(projPath, "/bin/version1.json");
            //             fs.writeFileSync(outVersionPath, newVersionContent, "utf8");
            //         } else {
            //             console.log("检测不到路径" + versionPath);
            //         }
            //     } else {
            //         console.log("检测不到路径" + projPath);
            //         this.$toast.error({message: this.lang['Error Compress JS Path Empty'], time: 1000});
            //     }
            // },

            recordResourceVersion: function() {
                this.recordingVersion = true
                this.recordingVersionFinish = false
                let that = this
                setTimeout(() => { // 延迟是为了UI能够响应
                    try {
                        let projPath = that.$route.params.projPath
                        let binPath = pathMod.join(projPath, "bin")
                        let versionFile = pathMod.join(binPath, "version.json")
                        let versionJson = {}
                        let oldVersionJson = JSON.parse(fs.readFileSync(versionFile).toString())
                        let paths = fs.readdirSync(binPath)
                        for (var path of paths) {
                            if (path == that.compressFolder) continue // 排除JS压缩目录
                            path = pathMod.join(binPath, path)
                            if (fs.statSync(path).isDirectory()) that.recordResourceVersionHandler(versionJson, path, binPath, oldVersionJson)
                        }
                        // 保存version.json
                        that.JStorage.setDataPath(binPath)
                        that.JStorage.set(versionFile, versionJson, function (error) {
                            if (error) throw error
                            that.recordingVersionFinish = true
                        })
                    } catch(err) {
                        that.$alert(err, this.langMsg['Title'])
                    }
                }, 100)
            },
            recordResourceVersionHandler: function(versionJson, dir, binPath, oldVersionJson) {
                let paths = fs.readdirSync(dir)
                for (var path of paths) {
                    if (path.indexOf('.DS_Store') >= 0) continue
                    path = pathMod.join(dir, path)
                    if (fs.statSync(path).isDirectory()) this.recordResourceVersionHandler(versionJson, path, binPath, oldVersionJson)
                    else {
                        var relativePath = pathMod.relative(binPath, path).replace(/\\/g, "/")
                        if (exts.includes(pathMod.extname(path))) { // 检查是否有图片需要压缩
                            var newVersion = relativePath + "?v=" + md5File.sync(path).substr(0, 20)
                            var oldVersion = oldVersionJson[relativePath]
                            if (!oldVersion || oldVersion != newVersion) {
                                throw this.lang['Error Found Img Need Update']
                            }
                        }
                        versionJson[relativePath] = relativePath + "?v=" + md5File.sync(path).substr(0, 20)
                    }
                }
            },
            onOneClick: function() {
                if (this.platformNameSelected.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect Platform'], time: 1000})
                    return
                }
                let that = this
                this.$confirm(this.lang['Comfirm One Click'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.mergeJSON()
                        if (isMergeJSONSucceed == 1) {
                            setTimeout( () => {
                                that.merging = false;
                                that.recordResourceVersion();
                                let timerId = setInterval(() => { // 延迟是为了UI能够响应
                                    if (that.recordingVersionFinish) {
                                        clearInterval(timerId)
                                        that.recordingVersion = false
                                        that.compressFlow(true)
                                    }
                                }, 100)
                            }, 100)
                        }
                    }
                })
            },
            onUpload: function() {
                if (this.platformNameSelected.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect Platform'], time: 1000})
                    return
                }
                if (this.runEnv.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect RunEnv'], time: 1000})
                    return
                }
                if (this.sdk.length == 0) {
                    this.$toast.error({message: this.lang['Error Unselect SDK'], time: 1000})
                    return
                }

                let that = this
                this.$confirm(this.lang['Comfirm Upload'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.doUpload()
                    }
                })
            },
            doUpload: async function() {
                // 进度框初始化
                this.uploading = true
                this.uploadFinish = false
                this.uploadStep = 0
                this.uploadProgressMode = "indeterminate"
                this.progressMax = 0
                this.curProgress = 0
                this.targetServer = ""
                this.uploadServerTotalCount = 0
                this.uploadServerCurNum = 0

                let that = this
                let projPath = this.$route.params.projPath
                let binPath = pathMod.join(projPath, "bin")
                let versionFile = pathMod.join(binPath, "version.json")
                let platformConfig = this.gmmConfigPlatform[this.platformNameSelected].config
                let serverPath = platformConfig.serverPathInner
                if (this.runEnv == "OuterNetTest") serverPath = platformConfig.serverPathOuter
                else if (this.runEnv == "OuterNet") serverPath = platformConfig.serverPath
                let serverBinPath = "/" + serverPath
                let serverJsPath = serverBinPath + "/" + this.compressFolder
                let servers = this.getServersByEnv(platformConfig.servers, this.runEnv)
                let unfinishCount = servers.length // 上传资源未完成的服务器数量
                let checkedPaths = [] // 已检查过的服务器路径
                let downloadedVersionFile = pathMod.join(projPath, "version.json")

                if (unfinishCount == 0) {
                    this.$toast.error(this.lang['Error Zero Servers'])
                    return
                }

                this.uploadServerTotalCount = unfinishCount

                for (var server of servers) {
                    that.targetServer = server.name
                    that.uploadStep = 0
                    that.curProgress = 0
                    that.progressMax = 0

                    let sftp = new SFTPClient()
                    let pm = new Promise((resolve, reject) => {
                        sftp.connect({
                            host: server.host,
                            port: server.port,
                            username: server.user,
                            password: server.password
                        }).then(() => { // 获取version.json
                            return sftp.get(serverBinPath + "/version.json", downloadedVersionFile)
                        }).then((serverVersionFile) => {
                            let oldList = JSON.parse(fs.readFileSync(serverVersionFile, "utf8"))
                            let newList = JSON.parse(fs.readFileSync(versionFile, "utf8"))
                            let promises = []

                            // 收集服务器不存在的目录
                            let notExistServerPaths = []
                            // 收集JS目录
                            let promise = that.getNotExistServerPath(sftp, serverJsPath + "/", checkedPaths, notExistServerPaths)
                            promises.push(promise)
                            // 收集资源目录
                            for (var file of Object.keys(newList)) {
                                if (!oldList[file] || oldList[file] != newList[file]) { // 判断服务器是否存在该文件或版本是否最新
                                    that.progressMax++

                                    let filePath = serverBinPath + "/" + file
                                    promise = that.getNotExistServerPath(sftp, filePath, checkedPaths, notExistServerPaths)
                                    promises.push(promise)
                                }
                            }
                            Promise.all(promises) // 目录收集完成
                                .then(() => {
                                    that.newServerPaths(sftp, notExistServerPaths) // 创建服务器不存在的目录
                                        .then(async function () { // 目录创建完成
                                            that.uploadStep++
                                            that.uploadProgressMode = "determinate"

                                            // 上传资源
                                            for (var file of Object.keys(newList)) {
                                                if (!oldList[file] || oldList[file] != newList[file]) { // 判断服务器是否存在该文件或版本是否最新
                                                    let filePath = serverBinPath + "/" + file
                                                    await that.uploadFile(sftp, filePath, pathMod.join(binPath, file), checkedPaths)
                                                    that.curProgress++
                                                }
                                            }

                                            that.uploadStep++
                                            that.uploadProgressMode = "indeterminate"

                                            // 上传代码
                                            let compressPath = pathMod.join(binPath, that.compressFolder)
                                            let jsPaths = fs.readdirSync(compressPath)
                                            for (var jsFile of jsPaths) {
                                                if (jsFile.indexOf(".min.js") > -1) { // 只上传 *.min.js 文件
                                                    if (jsFile == "main.min.js") continue // main里面有版本号，最后传
                                                    let filePath = serverJsPath + "/" + jsFile
                                                    await that.uploadFile(sftp, filePath, pathMod.join(compressPath, jsFile), checkedPaths)
                                                }
                                            }
                                            // 上传main.min.js
                                            let mainFile = "main.min.js"
                                            let filePath = serverJsPath + "/" + mainFile
                                            await that.uploadFile(sftp, filePath, pathMod.join(compressPath, mainFile), checkedPaths)

                                            that.uploadServerCurNum++

                                            sftp.end()
                                            unfinishCount--
                                            if (unfinishCount == 0) { // 所有服务器上传完毕
                                                that.uploadStep++
                                                that.updateVersionInServer(servers, serverBinPath, versionFile)
                                                fs.unlink(downloadedVersionFile, () => {})
                                            }
                                            resolve(true)
                                        })
                                })
                                .catch((err) => {
                                    throw err
                                })
                        }).catch((err) => {
                            sftp.end()
                            console.log("Err: Uploading to " + server.name)
                            console.log(err)
                            that.$toast.error(that.lang['Error SFTP'])
                            reject(err)
                        })
                    })

                    await pm
                }
            },
            updateVersionInServer: async function(servers, serverBinPath, localVersionFile) { // 更新版本号
                // 进度框初始化
                this.targetServer = ""
                this.uploadServerCurNum = 0

                // 更新version.json
                let that = this
                let projPath = this.$route.params.projPath
                let date = this.getFormatDate()
                let serverVersionFile = serverBinPath + "/version.json"

                for (var server of servers) {
                    that.targetServer = server.name

                    let sftp = new SFTPClient()
                    let pm = new Promise((resolve, reject) => {
                        sftp.connect({
                            host: server.host,
                            port: server.port,
                            username: server.user,
                            password: server.password
                        }).then(() => { // 备份服务器version.json
                            return sftp.rename(serverVersionFile, serverBinPath + "/version_" + date + ".json")
                        }).then(() => { // 上传version.json
                            return sftp.put(localVersionFile, serverVersionFile)
                        }).then(() => {
                            sftp.end()
                            that.uploadServerCurNum++
                            resolve(true)
                        }).catch((err) => {
                            sftp.end()
                            console.log("Err: Updating " + server.name)
                            console.log(err)
                            that.$toast.error(that.lang['Error SFTP'])
                            reject(err)
                        })
                    })

                    await pm
                }

                // 进度框初始化
                this.targetServer = ""
                this.uploadServerCurNum = 0

                // 更新bin/index.html
                let platformConfig = this.gmmConfigPlatform[this.platformNameSelected]
                let indexFile = platformConfig.config.indexInner
                if (this.runEnv == "OuterNetTest") indexFile = platformConfig.config.indexOuter
                else if (this.runEnv == "OuterNet")
                {
                    indexFile = platformConfig.config.index
                }
                let lastIndex = indexFile.lastIndexOf("/");
                let localIndexFile = indexFile.substring(lastIndex + 1, indexFile.length);
                let localIndex = pathMod.join(projPath, localIndexFile)
                servers = this.getServersByEnvAndSdk(platformConfig.config.indexServers, this.runEnv, this.sdk)
                let unfinishCount = servers.length

                if (unfinishCount == 0) {
                    this.$toast.error(this.lang['Error Zero Servers'])
                    return
                }

                this.uploadServerTotalCount = unfinishCount

                for (var server of servers) {
                    that.targetServer = server.name

                    let serverIndex = "/" + indexFile;
                    let sftp = new SFTPClient()
                    let pm = new Promise((resolve, reject) => {
                        sftp.connect({
                            host: server.host,
                            port: server.port,
                            username: server.user,
                            password: server.password
                        }).then(() => { // 下载bin/index.html
                            return sftp.get(serverIndex, localIndex)
                        }).then(() => { // 更改下载的bin/index.html
                            let compressPath = pathMod.join(projPath, "bin")
                            compressPath = pathMod.join(compressPath, that.compressFolder)

                            let content = fs.readFileSync(localIndex).toString()
                            let newContent = content.toLowerCase()
                            let oldStr = that.compressFolder + "/main.min.js?v="
                            let index = newContent.indexOf(oldStr)
                            if (index > -1) {
                                let index2 = content.indexOf("\"", index)
                                let newStr = oldStr + md5File.sync(pathMod.join(compressPath, "main.min.js"))
                                oldStr = content.substring(index, index2)
                                content = content.replace(oldStr, newStr)
                                fs.writeFileSync(localIndex, content)
                            }
                        }).then(() => { // 上传修改的bin/index.html
                            return sftp.put(localIndex, serverIndex)
                        }).then(() => {
                            sftp.end()

                            that.uploadServerCurNum++

                            unfinishCount--
                            if (unfinishCount == 0) { // 所有服务器更新完毕
                                fs.unlink(localIndex, () => {})
                                that.uploadFinish = true
                            }
                            resolve(true)
                        }).catch((err) => {
                            sftp.end()
                            console.log("Err: Updating " + server.name)
                            console.log(err)
                            that.$toast.error(that.lang['Error SFTP'])
                            reject(err)
                        })
                    })

                    await pm
                }
            },
            existsServerPath: function(sftp, path, checkedPaths) {
                return new Promise((resolve, reject) => {
                    if (checkedPaths.indexOf(path) > -1) {
                        resolve(true)
                    }
                    else {
                        // 判断是否有子路径已经包含了父路径，有就不用在服务器检查父路径
                        let doCheckPath = true
                        for (var checkedPath of checkedPaths) {
                            if (checkedPath.indexOf(path) > -1) {
                                doCheckPath = false
                                break
                            }
                        }
                        checkedPaths.push(path) // 记录已经检查过的路径
                        if (doCheckPath) {
                            sftp.list(path)
                                .then(() => {resolve(true)})
                                .catch(() => {resolve(false)})
                        }
                        else {
                            resolve(true)
                        }
                    }
                })
            },
            uploadFile: function(sftp, serverFile, localFile, checkedPaths) {
                let that = this
                return new Promise((resolve, reject) => {
                    var index = serverFile.lastIndexOf("/")
                    var parentPath = serverFile.substring(0, index) // 文件所在文件夹路径
                    that.existsServerPath(sftp, parentPath, checkedPaths) // 检测文件路径是否存在
                        .then((res) => {
                            if (res) {
                                sftp.put(localFile, serverFile)
                                    .then(() => {
                                        resolve(true)
                                    }).catch((err) => {
                                        console.log(err)
                                        reject(err)
                                    })
                            }
                            else { // 缺少路径，先创建后上传【一般遇不到，上传时会先创建好所有目录】
                                sftp.mkdir(parentPath, true)
                                    .then((res) => { // 创建目录成功
                                        return sftp.put(localFile, serverFile)
                                    }).then(() => {
                                        resolve(true)
                                    }).catch((err) => {
                                        reject(err)
                                    })
                            }
                        })
                })
            },
            getNotExistServerPath: function(sftp, serverFile, checkedPaths, notExistServerPaths) {
                // 获取服务器不存在的目录
                let that = this
                return new Promise((resolve, reject) => {
                    var index = serverFile.lastIndexOf("/")
                    var parentPath = serverFile.substring(0, index) // 文件所在文件夹路径
                    that.existsServerPath(sftp, parentPath, checkedPaths) // 检测文件路径是否存在
                        .then((res) => {
                            if (!res) {
                                notExistServerPaths.push(parentPath)
                            }
                            resolve(true)
                        })
                        .catch((err) => {
                            reject(err)
                        })
                })
            },
            newServerPaths: async function(sftp, notExistServerPaths) {
                // 创建服务器没有的目录
                try {
                    for (var path of notExistServerPaths) {
                        await sftp.mkdir(path, true)
                    }
                } catch (err) {
                    throw err
                }
            },
            getFormatDate: function() {
                // 返回 yyyymmddhhmmss
                let date = new Date()
                let year = date.getFullYear()
                let month = date.getMonth() + 1
                month = month < 10 ? "0" + month : month
                let day = date.getDate()
                day = day < 10 ? "0" + day : day
                let hour = date.getHours()
                hour = hour < 10 ? "0" + hour : hour
                let minute = date.getMinutes()
                minute = minute < 10 ? "0" + minute : minute
                let second = date.getSeconds()
                second = second < 10 ? "0" + second : second
                let formatDate = "" + year + month + day + hour + minute + second
                return formatDate
            },
            getServersByEnv: function(serverNames, env) {
                let servers = []
                for(var serverName of serverNames) {
                    let server = this.gmmConfigServer[serverName]
                    if (server.env == env) servers.push(server)
                }
                return servers
            },
            getServersByEnvAndSdk: function(serverNames, env, sdk) {
                let servers = []
                for(var serverName of serverNames) {
                    let server = this.gmmConfigServer[serverName]
                    if (server.env == env && server.sdk == sdk) servers.push(server)
                }
                return servers
            }
        }
    }
</script>