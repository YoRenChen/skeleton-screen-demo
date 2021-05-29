<template>
  <div class="base">
    <div class="side-bar">
      <router-link to="/" class="link">去首页</router-link>
      <router-link to="/about" class="link">去到about页面</router-link>
      <router-link to="/" class="link">去百度</router-link>
    </div>
    <div class="wrapper">
      <div class="header">我这里是header</div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BasicLayout'
}
</script>

<style lang="less">
.base {
  display: flex;
  .side-bar {
    width: 200px;
    background-color: #1792ed;

    .link {
      width: 100%;
      line-height: 80px;
      display: block;
      color: white;
      text-decoration: none;
    }
  }
  .wrapper {
    flex: 1;
    .header {
      width: 100%;
      height: 80px;
      color: white;
      line-height: 80px;
      background-color: #64b2eb;
    }
  }
}
</style>
