<template>
    <mu-flex>
        <module-graph :lang="lang" :moduleConfig="moduleConfig"
            @onDeleteModule="onDeleteModule" @onModifyModule="onModifyModule" @onSelectModule="onSelectModule"
            @onRemoveModule="onRemoveModule" @handleWrongDependence="handleWrongDependence">
        </module-graph>
        <module-free :lang="lang" :moduleConfig="moduleConfig"
            @onDeleteModule="onDeleteModule" @onModifyModule="onModifyModule" @onSelectModule="onSelectModule">
        </module-free>
    </mu-flex>
</template>

<script>
    import ModuleGraph from './ModuleSetting/ModuleGraph'
    import ModuleFree from './ModuleSetting/ModuleFree'

    export default {
        components: {
            ModuleGraph,
            ModuleFree
        },
        props: [
            "lang",
            "moduleConfig"
        ],
        data () {
            return {
            }
        },
        methods: {
            onDeleteModule: function(mod) {
                this.$emit("onDeleteModule", mod)
            },
            onModifyModule: function(mod) {
                this.$emit("onModifyModule", mod)
            },
            onSelectModule: function(mod) {
                this.$emit("onSelectModule", mod)
            },
            onRemoveModule: function(mod) {
                this.$emit("onRemoveModule", mod)
            },
            handleWrongDependence: function(list) {
                this.$emit("handleWrongDependence", list)
            }
        }
    }
</script>