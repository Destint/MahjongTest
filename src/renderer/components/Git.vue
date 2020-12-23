<template>
    <mu-flex direction="column" fill style="height: 100%">
        <git-header :lang="lang['Header']" :langMsg="langMsg"></git-header>
        <mu-flex fill style="flex: 1 !important; width: 100%;">
            <git-left :lang="lang['LeftBar']" :langMsg="langMsg"></git-left>
            <git-content></git-content>
        </mu-flex>
    </mu-flex>
</template>

<script>
    import GitHeader from "./Git/Header"
    import GitLeft from "./Git/Left"
    import GitContent from "./Git/Content"

    export default {
        name: "app-git",
        components: { GitHeader, GitLeft, GitContent },
        data () {
            return {
                lang: this.i18n.__('Git'),
                langMsg: this.i18n.__('Message')
            }
        }
    }
</script>

<style>
    .mu-snackbar-top {
        left: 50.2%;
        -webkit-transform: translate3d(-50.1%,0,0);
        transform: translate3d(-50.1%,0,0);
    }
    .mu-dialog-body .mu-modal-content {
        white-space: pre-wrap;
    }
</style>
