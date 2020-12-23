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

# install dependencies（1）
yarn 或 npm install

# serve with hot reload at localhost:9080（本机测试）
yarn run dev 或 npm run dev

# build electron application for production（工具打包，生成可运行文件）
yarn run win或mac（不要使用build，build会生成安装包） 
建议在package.json里查看打包脚本，打包必须在版本对应的系统才行
如果打包报错，很有可能的一个原因是VSCode占用了资源文件app.asar，关掉VSCode即可

# （1）install dependencies fail (安装失败时)
若pngquant-bin安装不成功,采用以下方法：
1、打开目录：C:/Windows/System32/drivers/etc/
    找到hosts文件，使用管理员模式打开记事本
    将hosts文件拖到管理员模式下的记事本中，然后在文件尾部添加以下文本：
    199.232.28.133 raw.githubusercontent.com
2、在此链接下载并安装所有最新的VC运行时库：
https://support.microsoft.com/zh-cn/help/2977003/the-latest-supported-visual-c-downloads


#yarn时若在advpng-bin中卡很久 结束后 看一下有没有../GitModulizeManager/node_modules/advpng-bin/vendor/advpng.exe这个文件
因为这个vendor下载路径 https://raw.github.com/imagemin/advpng-bin/v3.0.0/vendor/win32/advpng.exe 由于国内DNS污染可能打不开
没有这个文件 压缩图片的功能会报错
若没有 则采用以下方法：
1、打开目录：C:/Windows/System32/drivers/etc/
    找到hosts文件，使用管理员模式打开记事本
    将hosts文件拖到管理员模式下的记事本中，然后在文件尾部添加以下文本：
    151.101.184.133    raw.github.com
```

#### 开发注意事项

``` bash
· this.gmm.$on("事件名")
此类定义一般不止是在某个组件内使用，可能其它组件也会需要发送该事件，所以需要提供的数据必须以参数的方式，
而不能直接拿该函数所在组件内的数据，毕竟别的组件可能会提供不同的参数

. 多语言：
被写炸了，多语言会导致保存如服务器配置的时候改变服务器名字，主要是服务器后缀使用了语言文本，改变文本相当于改变了后缀，这点写的时候没考虑到
别的地方可能也会存在这个问题

· 项目与平台合并思路【ver2.0中已弃用，本工具不再关心git管理】：
项目与平台之间无历史树关联，因此无法直接merge，只能checkout，而checkout会直接覆盖文件，为防止这点，需要以下操作
项目与平台都有对应的合并分支（项目的合并分支对应每个平台都有一个），记录着上次合并，合并时checkout到该分支，然后再merge到对应主干，合并分支只有项目级拉取或推送的时候才更新至对应主干
比如平台推送到项目，项目由于别的平台的开发有所改动，首先项目合并分支checkout平台代码，然后merge到master，解决冲突，这样就不会把别的平台的改动覆盖掉了
平台拉取项目同理，只不过利用的是平台合并分支
详细流程自己看代码

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
