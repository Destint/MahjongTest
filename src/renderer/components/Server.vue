<template>
    <div>
        <mu-appbar style="width: 100%; height: 40px;" :title="lang['Tip1']" color="primary" z-depth="0"></mu-appbar>
        <!-- 服务器信息表单 -->
        <mu-flex style="padding: 0 10px;">
            <mu-select :label="lang['Environment']" filterable v-model="serverEnv" style="margin-right: 10px;">
                <mu-option label="" value=""></mu-option>
                <mu-option :label="lang['Run Env Inter']" value="InterNet"></mu-option>
                <mu-option :label="lang['Run Env Outer Test']" value="OuterNetTest"></mu-option>
                <mu-option :label="lang['Run Env Outer']" value="OuterNet"></mu-option>
            </mu-select>
            <mu-select :label="lang['Server Type']" filterable v-model="serverType" style="margin-right: 10px;">
                <mu-option label="" value=""></mu-option>
                <mu-option :label="lang['Server Type Index']" value="Index"></mu-option>
                <mu-option :label="lang['Server Type Resource']" value="Resource"></mu-option>
            </mu-select>
            <mu-text-field :label="lang['Server Name']" v-model="serverName" :suffix="serverNameSuffix" style="margin-right: 10px;"></mu-text-field>
            <mu-text-field :label="lang['Host']" v-model="serverHost" style="margin-right: 10px;"></mu-text-field>
            <mu-text-field :label="lang['Port']" v-model="serverPort" style="margin-right: 10px;"></mu-text-field>
        </mu-flex>
        <mu-flex style="padding: 0 10px; width: 100%;">
            <mu-text-field :label="lang['User']" v-model="serverUser" style="margin-right: 10px; width: 150px;"></mu-text-field>
            <mu-text-field :label="lang['Password']" v-model="serverPassword" style="margin-right: 10px; width: 150px;"></mu-text-field>
            <mu-flex style="margin-right: 10px; width: 150px;">
                <mu-select v-show="serverType == 'Index'" :label="lang['SDK']" filterable v-model="serverSDK" full-width>
                    <mu-option :label="lang['SDK WeChat']" value="WeChat"></mu-option>
                </mu-select>
            </mu-flex>
            <mu-button v-if="serverOldName.length == 0" large color="primary" style="margin-left: 30px;" @click="addServer">{{lang['Add']}}</mu-button>
            <mu-button v-else large color="success" style="margin-left: 30px;" @click="saveServer">{{lang['Save']}}</mu-button>
            <mu-select :label="lang['Filtrate Env']" filterable v-model="filtrateServerEnv" style="margin-left: 30px;">
                <mu-option label="" value=""></mu-option>
                <mu-option :label="lang['Run Env Inter']" value="InterNet"></mu-option>
                <mu-option :label="lang['Run Env Outer Test']" value="OuterNetTest"></mu-option>
                <mu-option :label="lang['Run Env Outer']" value="OuterNet"></mu-option>
            </mu-select>
        </mu-flex>
        <!-- 服务器信息表单 结束 -->
        <!-- 服务器列表 -->
        <mu-container fluid style="padding: 0;">
            <mu-row>
                <mu-col span="6">
                    <mu-data-table :height="tableHeight" :columns="columnsIndex" :sort.sync="sort" @sort-change="handleSortChange" :data="serversIndex" :no-data-text="lang['Empty']">
                        <template slot-scope="scope">
                            <td>{{scope.row.name}}</td>
                            <td>{{scope.row.host}}</td>
                            <td>
                                <mu-button icon small @click="editServer(scope.row.name)"><mu-icon value="edit"></mu-icon></mu-button>
                                <mu-button icon small @click="copyServer(scope.row.name)"><mu-icon value="note_add"></mu-icon></mu-button>
                                <mu-button icon small @click="deleteServer(scope.row.name)"><mu-icon value="delete"></mu-icon></mu-button>
                            </td>
                        </template>
                    </mu-data-table>
                </mu-col>
                <mu-col span="6">
                    <mu-data-table :height="tableHeight" :columns="columnsResource" :sort.sync="sort" @sort-change="handleSortChange" :data="serversResource" :no-data-text="lang['Empty']">
                        <template slot-scope="scope">
                            <td>{{scope.row.name}}</td>
                            <td>{{scope.row.host}}</td>
                            <td>
                                <mu-button icon small @click="editServer(scope.row.name)"><mu-icon value="edit"></mu-icon></mu-button>
                                <mu-button icon small @click="copyServer(scope.row.name)"><mu-icon value="note_add"></mu-icon></mu-button>
                                <mu-button icon small @click="deleteServer(scope.row.name)"><mu-icon value="delete"></mu-icon></mu-button>
                            </td>
                        </template>
                    </mu-data-table>
                </mu-col>
            </mu-row>
        </mu-container>
        <!-- 服务器信息表单 结束 -->
    </div>
</template>

<script>
    export default {
        name: "app-server",
        data () {
            return {
                lang: this.i18n.__('Server'),
                serverType: "",
                serverName: "",
                serverHost: "",
                serverPort: 22,
                serverEnv: "",
                serverUser: "",
                serverPassword: "",
                serverSDK: "WeChat",
                serverOldName: "",
                tableHeight: 0,
                filtrateServerEnv: "InterNet",
                sort: { name: '', order: 'asc' },
                config: {
                    servers: []
                }
            }
        },
        computed: {
            columnsIndex () {
                return [
                    { title: this.lang['Server Name Index'],    name: 'name',       sortable: true  },
                    { title: this.lang['Host'],                 name: 'host'                        },
                    { title: this.lang['Operation'],            name: 'operation'                   }
                ]
            },
            columnsResource () {
                return [
                    { title: this.lang['Server Name Reource'],  name: 'name',       sortable: true  },
                    { title: this.lang['Host'],                 name: 'host'                        },
                    { title: this.lang['Operation'],            name: 'operation'                   }
                ]
            },
            serverNameSuffix () {
                if (this.serverType.length == 0 && this.serverEnv.length == 0) return ""
                let type = ""
                let env = ""
                let sdk = ""
                if (this.serverType.length > 0) {
                    if (this.serverType == "Index") {
                        type = this.lang['Server Type Index']
                        if (this.serverSDK == "WeChat") sdk = this.lang['SDK WeChat']
                    }
                    else if (this.serverType == "Resource") type = this.lang['Server Type Resource']
                }
                if (this.serverEnv.length > 0) {
                    if (this.serverEnv == "InterNet") env = this.lang['Run Env Inter']
                    else if (this.serverEnv == "OuterNetTest") env = this.lang['Run Env Outer Test']
                    else if (this.serverEnv == "OuterNet") env = this.lang['Run Env Outer']
                }
                let suffix = "(" + env + sdk + type + ")"
                if (this.serverName.indexOf(suffix) == -1) return suffix
                return ""
            },
            serversIndex () {
                let servers = []
                for (var server of this.config.servers) {
                    if (server.type == "Index" && server.env == this.filtrateServerEnv) {
                        servers.push(server)
                    }
                }
                this.initData()
                return servers
            },
            serversResource () {
                let servers = []
                for (var server of this.config.servers) {
                    if (server.type == "Resource" && server.env == this.filtrateServerEnv) {
                        servers.push(server)
                    }
                }
                this.initData()
                return servers
            }
        },
        mounted () {
            let that = this
            this.resizeTable()
            window.onresize = function() {
                that.resizeTable()
            }

            let projPath = this.$route.params.projPath
            if (!projPath) {
                this.$toast.error(this.lang['Error Project Path Empty'])
                return
            }
            this.JStorage.setDataPath(projPath)
            // 检测服务器配置文件
            this.JStorage.has(this._GmmServerFile, function (error, hasKey) {
                if (error) {
                    throw error
                }
                if (hasKey) {
                    that.JStorage.get(that._GmmServerFile, function (error, data) {
                        if (error) throw error
                        if (data) {
                            that.config = that.deepCopyObj(data)
                        }
                    })
                }
            })
        },
        methods: {
            handleSortChange ({name, order}) {
                this.config.servers = this.config.servers.sort((a, b) => {
                    if (order === 'asc') {
                        if (a[name] > b[name]) return 1
                        else if (a[name] < b[name]) return -1
                        else return 0
                    }
                    else {
                        if (a[name] > b[name]) return -1
                        else if (a[name] < b[name]) return 1
                        else return 0
                    }
                })
            },
            initData () {
                this.serverEnv = ""
                this.serverType = ""
                this.serverName = ""
                this.serverHost = ""
                this.serverPort = 22
                this.serverUser = ""
                this.serverPassword = ""
                this.serverOldName = ""
                this.serverSDK = "WeChat"
            },
            resizeTable () {
                this.tableHeight = document.documentElement.clientHeight - 40 - 88 - 88 // app-bar, 第一行输入, 第二行输入
            },
            addServer () {
                let projPath = this.$route.params.projPath
                if (!projPath) {
                    this.$toast.error(this.lang['Error Project Path Empty'])
                    return
                }

                if (this.serverEnv.length == 0) {
                    this.$$toast.error(this.lang['Error Server Env Empty'])
                    return
                }

                if (this.serverType.length == 0) {
                    this.$$toast.error(this.lang['Error Server Type Empty'])
                    return
                }

                let serverName = this.serverName + this.serverNameSuffix

                if (this.duplicatedServerName(serverName)) {
                    this.$toast.error(this.lang['Error Server Name Duplicated'])
                    return
                }
                
                let that = this
                this.config.servers.push({
                    type: this.serverType,
                    name: serverName,
                    host: this.serverHost,
                    port: this.serverPort,
                    user: this.serverUser,
                    password: this.serverPassword,
                    env: this.serverEnv,
                    sdk: this.serverSDK
                })
                // 保存到配置文件
                this.JStorage.setDataPath(projPath)
                this.JStorage.set(this._GmmServerFile, this.config, function (error) {
                    if (error) {
                        throw error
                    }
                    else {
                        that.$toast.success({message: that.lang['Finish'], time: 1000})
                        that.initData()
                    }
                })
            },
            editServer (name) {
                for (var server of this.config.servers) {
                    if (name == server.name) {
                        this.serverType = server.type
                        this.serverName = server.name
                        this.serverHost = server.host
                        this.serverPort = server.port
                        this.serverUser = server.user
                        this.serverPassword = server.password
                        this.serverOldName = server.name
                        this.serverEnv = server.env
                        this.serverSDK = server.sdk
                        break
                    }
                }
            },
            copyServer (name) {
                for (var server of this.config.servers) {
                    if (name == server.name) {
                        this.serverType = server.type
                        this.serverHost = server.host
                        this.serverPort = server.port
                        this.serverUser = server.user
                        this.serverPassword = server.password
                        this.serverEnv = server.env
                        this.serverSDK = server.sdk
                        break
                    }
                }
            },
            deleteServer (name) {
                let that = this
                let waring = this.lang['Comfirm Delete Server'].replace("%serverName%", name)
                this.$confirm(waring, '', {
                    width: 500,
                    type: 'warning'
                }).then(({result}) => {
                    if (result) {
                        // initData()会改掉以下变量，先记录
                        let serverType = this.serverType
                        
                        let index = 0
                        for (var server of this.config.servers) {
                            if (name == server.name) {
                                that.config.servers.splice(index, 1)
                                break
                            }
                            index++
                        }
                        let projPath = this.$route.params.projPath
                        // 保存到配置文件
                        that.JStorage.setDataPath(projPath)
                        that.JStorage.set(that._GmmServerFile, that.config, function (error) {
                            if (error) {
                                throw error
                            }
                            else {
                                that.$toast.success({message: that.lang['Finish'], time: 1000})
                                that.initData()
                            }
                        })
                        // 删除平台配置里保存的服务器名
                        that.JStorage.has(that._GmmConfigFilePlatform, function (error, hasKey) {
                            if (error) {
                                throw error
                            }
                            if (hasKey) {
                                that.JStorage.get(that._GmmConfigFilePlatform, function (error, data) {
                                    if (error) throw error
                                    if (data) {
                                        let platforms = that.deepCopyObj(data)
                                        let modified = false
                                        // 检测是否有需要删除的服务器名
                                        for (var platform of Object.keys(platforms)) {
                                            // 资源代码服务器
                                            if (serverType == "Resource" && platforms[platform].config.servers) {
                                                let index = 0
                                                for (var serverName of platforms[platform].config.servers) {
                                                    if (serverName == name) {
                                                        platforms[platform].config.servers.splice(index, 1)
                                                        modified = true
                                                        break
                                                    }
                                                    index++
                                                }
                                            }
                                            // 入口服务器
                                            if (serverType == "Index" && platforms[platform].config.indexServers) {
                                                let index = 0
                                                for (var serverName of platforms[platform].config.indexServers) {
                                                    if (serverName == name) {
                                                        platforms[platform].config.indexServers.splice(index, 1)
                                                        modified = true
                                                        break
                                                    }
                                                    index++
                                                }
                                            }
                                        }
                                        if (modified) {
                                            // 保存平台配置
                                            that.JStorage.set(that._GmmConfigFilePlatform, platforms, function (error) {
                                                if (error) {
                                                    that.$toast.error({message: that.lang['Error'], time: 1000})
                                                    throw error
                                                }
                                                else that.$toast.success({message: that.lang['Finish'], time: 1000})
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            },
            saveServer () {
                // initData()会改掉以下变量，先记录
                let oldName = this.serverOldName
                let newName = this.serverName + this.serverNameSuffix
                let serverType = this.serverType

                if (this.duplicatedServerName(newName, oldName)) {
                    this.$toast.error(this.lang['Error Server Name Duplicated'])
                    return
                }

                for (var server of this.config.servers) {
                    if (oldName == server.name) {
                        server.type = this.serverType
                        server.name = newName
                        server.host = this.serverHost
                        server.port = this.serverPort
                        server.user = this.serverUser
                        server.password = this.serverPassword
                        server.env = this.serverEnv
                        server.sdk = this.serverSDK
                        break
                    }
                }
                let projPath = this.$route.params.projPath
                let that = this
                // 保存到配置文件
                this.JStorage.setDataPath(projPath)
                this.JStorage.set(this._GmmServerFile, this.config, function (error) {
                    if (error) {
                        throw error
                    }
                    else {
                        that.$toast.success({message: that.lang['Finish'], time: 1000})
                        that.initData()
                    }
                })
                // 修改平台配置里保存的服务器名
                this.JStorage.has(this._GmmConfigFilePlatform, function (error, hasKey) {
                    if (error) {
                        throw error
                    }
                    if (hasKey) {
                        that.JStorage.get(that._GmmConfigFilePlatform, function (error, data) {
                            if (error) throw error
                            if (data) {
                                let platforms = that.deepCopyObj(data)
                                let modified = false
                                // 检测是否有需要更改的服务器名
                                for (var platform of Object.keys(platforms)) {
                                    // 资源代码服务器
                                    if (serverType == "Resource" && platforms[platform].config.servers) {
                                        let index = 0
                                        for (var serverName of platforms[platform].config.servers) {
                                            if (serverName == oldName) {
                                                platforms[platform].config.servers[index] = newName
                                                modified = true
                                                break
                                            }
                                            index++
                                        }
                                    }
                                    // 入口服务器
                                    if (serverType == "Index" && platforms[platform].config.indexServers) {
                                        let index = 0
                                        for (var serverName of platforms[platform].config.indexServers) {
                                            if (serverName == oldName) {
                                                platforms[platform].config.indexServers[index] = newName
                                                modified = true
                                                break
                                            }
                                            index++
                                        }
                                    }
                                }
                                if (modified) {
                                    // 保存平台配置
                                    that.JStorage.set(that._GmmConfigFilePlatform, platforms, function (error) {
                                        if (error) {
                                            that.$toast.error({message: that.lang['Error'], time: 1000})
                                            throw error
                                        }
                                        else that.$toast.success({message: that.lang['Finish'], time: 1000})
                                    })
                                }
                            }
                        })
                    }
                })
            },
            duplicatedServerName (name, oldName) {
                for (var server of this.config.servers) {
                    if (server.name == oldName) continue
                    if (name == server.name) return true
                }
                return false
            }
        }
    }
</script>