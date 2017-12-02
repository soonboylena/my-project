import Vue from 'vue'
import BootstrapVue from "bootstrap-vue"
import App from './App.vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import axios from 'axios'
import Icon from 'vue-awesome'

Vue.component('icon', Icon);
Vue.use(BootstrapVue);
Vue.prototype.$http = axios;

new Vue({
  el: '#app',
  render: h => h(App)
});
