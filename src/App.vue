<template>
  <div id="app">
    <div id="nav">
      {{ num }}
      <router-link to="/">Home</router-link>|
      <router-link to="/about">About</router-link>
    </div>
    <van-tabbar v-model="active">
      <van-tabbar-item v-for="(item, index) in items" :key="index" @click="tab(index, item.name)">
        <span :class="current == index ? active : ''">{{ item.title }}{{ active }}</span>
        <template slot="icon" slot-scope="aaaa">
          <img :src="aaaa.active ? item.a : item.n" alt />
        </template>
      </van-tabbar-item>
    </van-tabbar>
    <router-view />
  </div>
</template>
<script>
// import Impic from '@/assets/logo.png'
// import Impic2 from '@/assets/1.jpeg'
// import Impic2 from '@/assets/1.jpeg'
const Impic = require('@/assets/logo.png')
const Impic2 = require('@/assets/1.jpeg')

export default {
  name: 'App',
  data() {
    return {
      num: 0,
      active: 0,
      current: 0,
      items: [
        {
          name: '/',
          title: '111',
          n: Impic,
          a: Impic2
        },
        {
          name: 'about',
          title: '222',
          n: Impic,
          a: Impic2
        }
      ]
    }
  },
  mounted() {
    this.setNum()
  },
  methods: {
    tab(index, val) {
      this.current = index
      this.$router.push(val)
      console.log('*** 触发次数 ***')
    },
    setNum() {
      setTimeout(() => {
        ++this.num
        this.setNum()
      }, 1000)
    }
  }
}
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
