<template>
    <mu-flex direction="column" style="width: 100%">
        <mu-appbar style="width: 100%; height: 40px;" :title="lang['Tip1']" color="primary" z-depth="0"></mu-appbar>
        <mu-flex style="padding: 0 15px; width: 100%;">
            <mu-button @click="onTinyImg" full-width large color="success" style="margin-top: 30px">{{lang['Compress Img']}}</mu-button>
        </mu-flex>
        <mu-dialog :title="lang['Compress Img']" :open="compressing" :width=550 :overlay-close=false :esc-press-close=false>
            <mu-stepper :active-step="tinyStep">
                <mu-step><mu-step-label>
                    {{lang['Checking Img']}}
                </mu-step-label></mu-step>
                <mu-step><mu-step-label>
                    {{lang['Tiny Img']}}
                </mu-step-label></mu-step>
                <mu-step><mu-step-label>
                    {{lang['Img Version']}}
                </mu-step-label></mu-step>
                <mu-step><mu-step-label>
                    {{lang['Tiny Finish']}}
                </mu-step-label></mu-step>
            </mu-stepper>
            <mu-flex>
                <span>{{curProgress}}/{{progressMax}}</span>
                <span style="margin-left: 20px;">{{compressingImg}}</span>
            </mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="curProgress" :max="progressMax" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-button slot="actions" flat color="primary" @click="compressing = false">{{lang['Close']}}</mu-button>
        </mu-dialog>
    </mu-flex>
</template>

<script>
    const fs = require('fs')
    const pathMod = require('path')
    const md5File = require('md5-file/promise')
    const imagemin = require('imagemin')
    const imageminPngquant = require('imagemin-pngquant')
    const imageminOptipng = require('imagemin-optipng')
    const imageminAdvpng = require('imagemin-advpng')

    const exts = ['.png']

    export default {
        name: "app-img",
        data () {
            return {
                lang: this.i18n.__('Image'),
                compressFolder: "js.min",
                jsFolder: "js",
                maxImgHandleCount: 1, // 同时图片最大处理数
                compressing: false,
                curProgress: 0,
                progressMax: 0,
                tinyStep: 0,
                compressingImg: "",
                gmmConfigNoComPressImgPaths: []
            }
        },
        computed: {
            projPath () {
                return this.$route.params.projPath
            },
            binPath () {
                return pathMod.join(this.projPath, "bin")
            },
            bakPath () {
                return pathMod.join(this.projPath, "GmmImgBak")
            },
            savePath () {
                return pathMod.join(this.projPath, "GmmImgSave")
            },
            versionFile () {
                return pathMod.join(this.binPath, "version.json")
            }
        },
        mounted () {
            let that = this
            if (!this.projPath) {
                this.$toast.error(this.lang['Error Compress JS Path Empty'])
                return
            }
            this.JStorage.setDataPath(this.projPath)
            // 检测平台配置文件
            this.JStorage.has(this._GmmNoComPressImgFile, function (error, hasKey) {
                if (error) {
                    throw error
                }
                if (hasKey) {
                    that.JStorage.get(that._GmmNoComPressImgFile, function (error, data) {
                        if (error) throw error
                        if (data) {
                            that.gmmConfigNoComPressImgPaths = that.deepCopyObj(data)
                        }
                    })
                }
            })
        },
        methods: {
            onTinyImg () {
                if (!this.projPath) {
                    this.$toast.error(this.lang['Error Compress JS Path Empty'])
                    return
                }
                let that = this
                this.$confirm(this.lang['Comfirm Tiny Img'], '', {
                    width: 500,
                    type: 'warning'
                }).then(({ result }) => {
                    if (result) {
                        that.tinyImgFlow()
                    }
                })
            },
            tinyImgFlow () {
                // 图片备份路径【暂不备份】
                // if (!fs.existsSync(this.bakPath)) {
                //     fs.mkdirSync(this.bakPath)
                // }
                
                let that = this
                this.compressing = true
                this.curProgress = 0
                this.progressMax = 0
                this.tinyStep = 0
                this.compressingImg = ""
                setTimeout(() => { // 延迟是为了UI能够响应
                    let imgList = []
                    let paths = fs.readdirSync(that.binPath)
                    let version = JSON.parse(fs.readFileSync(that.versionFile).toString())
                    for (var path of paths) {
                        if (path == that.compressFolder || path == that.jsFolder) continue // 排除JS目录
                        path = pathMod.join(that.binPath, path)
                        if (fs.statSync(path).isDirectory()) that.getImgs(version, imgList, path, that.binPath)
                    }

                    if (imgList.length > 0) {
                        that.tinyStep++
                        that.progressMax = imgList.length
                        that.tinyImg(imgList)
                    }
                    else {
                        //没有要压缩的图片的话，原来存的版本号不会变，这里变一下
                        if(that.gmmConfigNoComPressImgPaths.length > 0)that.imgVersion(that.gmmConfigNoComPressImgPaths) 
                        that.tinyStep += 4
                    }
                }, 100)
            },
            getImgs (version, imgList, dir) {
                let paths = fs.readdirSync(dir)
                for (var path of paths) {
                    path = pathMod.join(dir, path)
                    let stat = fs.statSync(path)
                    if (stat.isDirectory()) {
                        this.getImgs(version, imgList, path)
                    }
                    else if (exts.includes(pathMod.extname(path))) {
                        var relativePath = pathMod.relative(this.binPath, path).replace(/\\/g, "/")
                        var newVersion = relativePath + "?v=" + md5File.sync(path).substr(0, 20)
                        var oldVersion = version[relativePath]
                        if (!oldVersion || oldVersion != newVersion) {
                            if(this.isNoCompressImg(relativePath)) continue
                            imgList.push(relativePath)
                        }
                    }
                }
            },
            async tinyImg (imgList) {
                try {
                    for (var img of imgList) {
                        if (!this.compressing) continue
                        this.compressingImg = img
                        let imgPath = pathMod.join(this.binPath, img)
                        await imagemin([imgPath], this.savePath, {
                            use: [
                                imageminOptipng(),
                                imageminPngquant({speed: 7, quality: '60-80'}),
                                imageminAdvpng({optimizationLevel: 4})
                            ]
                        })
                        let savedImg = pathMod.join(this.savePath, pathMod.basename(imgPath))
                        if (fs.existsSync(savedImg)) fs.renameSync(savedImg, imgPath)
                        this.curProgress++
                    }
                    this.tinyStep++
                    this.compressingImg = ""
                    this.imgVersion(imgList)
                } catch (err) {
                    this.clean()
                    this.$toast.error(this.lang['Error Tiny Fail'])
                    console.log(err)
                }
            },
            imgVersion (imgList) {
                let that = this
                setTimeout(() => { // 延迟是为了UI能够响应
                    let versionJson = JSON.parse(fs.readFileSync(that.versionFile).toString())
                    for (var img of imgList) {
                        let path = pathMod.join(that.binPath, img)
                        versionJson[img] = img + "?v=" + md5File.sync(path).substr(0, 20)
                    }
                    // 保存version.json
                    that.JStorage.setDataPath(that.binPath)
                    that.JStorage.set(that.versionFile, versionJson, function (error) {
                        if (error) throw error
                        // 清理临时文件
                        that.clean()
                    })
                }, 100)
            },
            clean () {
                if (fs.existsSync(this.savePath)) fs.rmdirSync(this.savePath)
                this.tinyStep += 2
            },
            mkdirsSync (dirname) {
                if (fs.existsSync(dirname)) {
                    return true
                }
                else if (mkdirsSync(path.dirname(dirname))) {
                    fs.mkdirSync(dirname)
                    return true
                }
            },
            bakImg (imgList) { // 备份原图【暂不备份】
                for (var img of imgList) {
                    //
                }
            },
            isNoCompressImg(path){
                for(var noCompressImgPath of this.gmmConfigNoComPressImgPaths)
                {
                    if(path == noCompressImgPath) return true
                }
                return false
            }
        }
    }
</script>