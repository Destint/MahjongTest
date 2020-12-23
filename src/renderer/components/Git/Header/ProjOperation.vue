<template>
    <mu-flex class="header-item header-dark">
        <mu-list class="menu">
            <mu-list-item button :ripple=false ref="btnProj" @click="showProjMenu = !showProjMenu">
                <mu-list-item-action class="menu-icon">
                    <svg-icon name="mark-github" scale="150"></svg-icon>
                </mu-list-item-action>
                <mu-list-item-content>
                    <mu-list-item-title class="title">{{lang['Project']}}</mu-list-item-title>
                </mu-list-item-content>
                <mu-list-item-action style="min-width: 30px;">
                    <svg-icon class="toggle-icon" :class="{'toggle-open': showProjMenu}" name="chevron-down" scale="100"></svg-icon>
                </mu-list-item-action>
            </mu-list-item>
        </mu-list>
        <mu-popover placement="bottom-end" :open.sync="showProjMenu" :trigger="trigger_proj">
            <mu-list dense>
                <mu-list-item button @click="showModalProjSetting">
                    <mu-icon class="proj-icon" value="settings"></mu-icon>
                    <mu-list-item-title>{{lang['Project Module Setting']}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item button @click="showModalPlatformSetting('rel')">
                    <mu-icon class="proj-icon" value="launch"></mu-icon>
                    <mu-list-item-title>{{lang['Platform Setting']}}</mu-list-item-title>
                </mu-list-item>
            </mu-list>
        </mu-popover>
        <!-- -------------------------------- Proj Operation Modal -------------------------------- -->
        <modal-proj-setting :lang="lang" :langMsg="langMsg" :data="modalProjSettingData" @closeModal="showProjSetting = false"></modal-proj-setting>
        <modal-platform-setting :lang="lang" :langMsg="langMsg" :data="modalPlatformSettingData" @closeModal="showPlatformSetting = false"></modal-platform-setting>
        <!-- -------------------------------- Proj Operation End -------------------------------- -->
        <!-- ---------------------------- Proj Operation Process Modal ---------------------------- -->
        <mu-dialog :title="curOperation" :open="curOperation.length > 0" :width=500 :overlay-close=false :esc-press-close=false>
            <mu-flex>{{operationProgress + "%"}}</mu-flex>
            <mu-flex>
                <mu-linear-progress mode="determinate" :value="operationProgress" :size="15" color="green"></mu-linear-progress>
            </mu-flex>
            <mu-button slot="actions" flat color="primary" @click="curOperation = ''">{{lang['Close']}}</mu-button>
        </mu-dialog>
        <!-- ---------------------------- Proj Operation Process Modal End ---------------------------- -->
    </mu-flex>
</template>

<script>
    const fs = require('fs')
    const pathMod = require("path")

    // 项目级操作
    import ModalProjSetting from "./ProjOperation/ModalProjSetting.vue"
    import ModalPlatformSetting from "./ProjOperation/ModalPlatformSetting.vue"

    export default {
        props: ['lang', 'langMsg', 'data'],
        components: {
            ModalProjSetting,
            ModalPlatformSetting
        },
        data () {
            return {
                showProjMenu: false,
                showProjSetting: false,
                showPlatformSetting: false,
                trigger_proj: null,
                platformType: null,
                curOperation: "",
                operationProgress: 0
            }
        },
        computed: {
            modalProjSettingData () {
                return {
                    showProjSetting: this.showProjSetting,
                    repo: this.data.repo
                }
            },
            modalPlatformSettingData () {
                return {
                    showPlatformSetting: this.showPlatformSetting,
                    repoName: this.data.repoOpened,
                    repo: this.data.repo,
                    branch: this.data.branchSelected,
                    type: this.platformType
                }
            },
            repoPath () {
                return this.data.repo.path
            }
        },
        mounted () {
            this.trigger_proj = this.$refs.btnProj.$el
        },
        methods: {
            showModalProjSetting: function() {
                this.showProjSetting = true
                this.showProjMenu = false
            },
            showModalPlatformSetting: function(type) {
                this.platformType = type
                this.showPlatformSetting = true
                this.showProjMenu = false
            }
        }
    }
</script>
