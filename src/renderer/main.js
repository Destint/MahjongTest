import Vue from 'vue'
import 'muse-ui/dist/muse-ui.css'
import 'typeface-roboto/index.css'
import 'muse-ui-toast/dist/muse-ui-toast.all.css'
import 'muse-ui-message/dist/muse-ui-message.all.css'
import 'muse-ui-loading/dist/muse-ui-loading.all.css'
import './utils/tooltip/tooltip.css'
import axios from 'axios'
import MuseUI from 'muse-ui'
import { theme } from 'muse-ui'
import Icon from 'vue-svg-icon/Icon.vue'
import Toast from 'muse-ui-toast/dist/muse-ui-toast.js'
import Message from 'muse-ui-message/dist/muse-ui-message.js'
import Loading from 'muse-ui-loading/dist/muse-ui-loading.js'
import VTooltip from 'v-tooltip'

import App from './App'
import router from './router'
import store from './store'
import { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const Remote = require('electron').remote

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.prototype.i18n = Remote.getGlobal('i18n')
Vue.prototype.JStorage = Remote.getGlobal('JStorage')
Vue.prototype.Git = require('simple-git')
Vue.prototype._AppConfig = Remote.getGlobal('_AppConfig')
Vue.prototype._PathSeperater = process.platform == "win32" ? "\\" : "/"
Vue.prototype._PathMaxWidth = 254.5
Vue.prototype._GmmConfigFileOrigin = "gmmconfig_origin.json"
Vue.prototype._GmmConfigFilePlatform = "gmmconfig_platform.json"
Vue.prototype._GmmMangleFile = "gmm_mangle.json"
Vue.prototype._GmmServerFile = "gmmconfig_server.json"
Vue.prototype._GmmNoComPressImgFile = "gmmconfig_noCompressImgPath.json"

Vue.use(MuseUI)
Vue.use(Toast, { position: "top", time: 3000 })
Vue.use(Message, { okLabel: Vue.prototype.i18n.__("Message")['OkLabel'], cancelLabel: Vue.prototype.i18n.__("Message")['CancelLabel'] })
Vue.use(Loading)
Vue.use(VTooltip, { defaultPlacement: 'bottom' })
Vue.component('svg-icon', Icon)

theme.use("light")

/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>',
    beforeCreate () {
        Vue.prototype.gmm = this
    }
}).$mount('#app')

// --------------------------- 页面加载后处理 开始 ---------------------------
let _Observers = {} // 所有监听器列表
window.onload = function() {
    /**
     * v-tooltip 渲染辅助处理
     * 插件使用translate3d会导致文字模糊
     * 监听tooltip添加到body，然后给新添加的tooltip添加style变化监听
     * tooltip被移除时关闭style监听
     */
    var config = { childList: true }
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            if (mutation.addedNodes.length > 0) { // 添加tooltip监听
                let node = mutation.addedNodes[0]
                if (node.className && node.className.indexOf("tooltip") > -1) { // 注释没有class
                    var observer = new MutationObserver(function(mutationsList, observer) { // style变化监听
                        let target = null
                        for(var mutation of mutationsList) {
                            if (mutation.attributeName == "style") {
                                target = mutation.target
                            }
                        }
                        if (target != null) {
                            observer.disconnect()
                            let transform = target.style.transform
                            let x = transform.substring(transform.indexOf('(') + 1, transform.indexOf(','))
                            let y = transform.substring(transform.indexOf(',') + 1, transform.lastIndexOf(','))
                            target.style.left = x
                            target.style.top = y
                            target.style.transform = "unset"
                            observer.observe(target, { attributes: true })
                        }
                    })
                    observer.observe(node, { attributes: true })
                    _Observers[node.id] = observer
                }
            }
            else if (mutation.removedNodes.length > 0) { // 移除tooltip监听
                let node = mutation.removedNodes[0]
                if (node.className && node.className.indexOf("tooltip") > -1) { // 注释没有class
                    _Observers[node.id].disconnect()
                    delete _Observers[node.id]
                }
            }
        }
    }
    var observer = new MutationObserver(callback)
    observer.observe(document.body, config)
    _Observers['body'] = observer
}

// --------------------------- 页面加载后处理 结束 ---------------------------

// --------------------------- 自定义函数 开始 ---------------------------

String.prototype.trim = function (char, type) {
    if (char) {
        if (type == 'left') {
            return this.replace(new RegExp('^\\'+char+'+', 'g'), '')
        } else if (type == 'right') {
            return this.replace(new RegExp('\\'+char+'+$', 'g'), '')
        }
        return this.replace(new RegExp('^\\'+char+'+|\\'+char+'+$', 'g'), '')
    }
    return this.replace(/^\s+|\s+$/g, '')
}

String.prototype.hidePath = function (seperater, maxWidth) { 
    if (typeof(this) == "undefined" || this.length == 0) {
        return ""
    }  
    seperater = seperater || Vue.prototype._PathSeperater
    maxWidth = maxWidth || Vue.prototype._PathMaxWidth
    let maxCharNum = Math.floor(33*maxWidth/Vue.prototype._PathMaxWidth)
    let index = this.lastIndexOf(seperater)
    let path = this
    if (this.length > maxCharNum)
    {
        path = this.substr(0,maxCharNum- 3 - this.length + index) + "..." + this.substr(index)
    }
    return path
}

Vue.prototype.isObjectEmpty = function (obj) {
    for (var key in obj) return false
    return true
}

Vue.prototype.deepCopyObj = function (obj) {
    return JSON.parse(JSON.stringify(obj))
}

// --------------------------- 自定义函数 结束 ---------------------------