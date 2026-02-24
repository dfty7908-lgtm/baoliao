import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import uviewPlus from 'uview-plus'

// Global Interceptor
const whiteList = [
  '/pages/login/login',
  '/pages/register/register',
  '/pages/login/reset-password'
]

function hasPermission(url) {
  // Pass if in whiteList
  const path = url.split('?')[0]
  if (whiteList.includes(path)) return true

  // Check login status
  const userInfo = uni.getStorageSync('userInfo')
  return !!userInfo
}

['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].forEach(item => {
  uni.addInterceptor(item, {
    invoke(e) {
      if (!hasPermission(e.url)) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
        return false
      }
      return true
    },
    fail(err) {
      console.log(err)
    }
  })
})

export function createApp() {
  const app = createSSRApp(App)
  app.use(uviewPlus)
  return {
    app
  }
}
// #endif