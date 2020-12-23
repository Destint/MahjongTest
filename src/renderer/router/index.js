import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'app-git',
            component: require('@/components/Git').default
        },
        {
            path: '/laya',
            name: 'app-laya',
            component: require('@/components/Laya').default
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
})
