# Git modulize manager(GMM)

> An electron-vue project. Used for modulizing Git repository and managing these modules.

> 为开发本软件，你需要了解：

> [electron](https://electronjs.org/)

> [vue](https://cn.vuejs.org/)

> [electron-vue](https://simulatedgreg.gitbooks.io/electron-vue/content/cn/)

> [muse-ui](https://muse-ui.org/#/zh-CN)

> 大致了解NodeJS以及其配备的npm(或yarn)还有脚手架(cli)的概念

> 另外，npm有全局安装和局部安装两个概念，全局一般是命令行，局部一般是依赖库之类的，使用npm --global参数时要注意，yarn自行百度

> 注意1：yarn 和 npm 不要混用！

> 注意2：Muse-UI使用谷歌的[Material Icon](https://material.io/tools/icons/?style=baseline)，不仅被墙，而且本身包太大无法用yarn或npm下载，本软件做法为仅下载css相关文件，放入static目录，而图标本身muse-ui似乎是自带的，只要导入css就能驱动

> 参考（未列出的自己在代码里找库名，一般都在入口文件，然后自行百度）：

> [Electron-vue初始模板解析](https://blog.csdn.net/yi_master/article/details/84783502)

> [electron-json-storage 使用教程](https://github.com/electron-userland/electron-json-storage)

> [AntV/G6](https://antv.alipay.com/zh-cn/g6/2.x/index.html)

> [simple-git](https://www.npmjs.com/package/simple-git)

> [npm库大全，这里能找到所有的库](https://www.npmjs.com/)

> [Terser，压缩JS，ES6](https://www.npmjs.com/package/terser)


#### Build Setup

``` bash
强烈建议yarn，npm慢的要死，尤其是国内

# install dependencies
yarn 或 npm install

# serve with hot reload at localhost:9080
yarn run dev 或 npm run dev

# build electron application for production
yarn run win或mac（不要使用build，build会生成安装包） 
建议在package.json里查看打包脚本，打包必须在版本对应的系统才行
如果打包报错，很有可能的一个原因是VSCode占用了资源文件app.asar，关掉VSCode即可


```

#### 开发注意事项

``` bash
· this.gmm.$on("事件名")
此类定义一般不止是在某个组件内使用，可能其它组件也会需要发送该事件，所以需要提供的数据必须以参数的方式，
而不能直接拿该函数所在组件内的数据，毕竟别的组件可能会提供不同的参数

· 项目与平台合并思路：
项目与平台之间无历史树关联，因此无法直接merge，只能checkout，而checkout会直接覆盖文件，为防止这点，需要以下操作
项目与平台都有对应的合并分支（项目的合并分支对应每个平台都有一个），记录着上次合并，合并时checkout到该分支，然后再merge到对应主干，合并分支只有项目级拉取或推送的时候才更新至对应主干
比如平台推送到项目，项目由于别的平台的开发有所改动，首先项目合并分支checkout平台代码，然后merge到master，解决冲突，这样就不会把别的平台的改动覆盖掉了
平台拉取项目同理，只不过利用的是平台合并分支
详细流程自己看代码

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
