<template>
  <div class="about">
    <h1 v-for="(item, index) in arr" :key="index">{{ msg }} - {{ index }}</h1>
  </div>
</template>
<script>
export default {
  name: 'About',
  data() {
    return {
      msg: 'This is an about page',
      arr: 0
    }
  },
  mounted() {
    setTimeout(() => {
      this.arr = 5
    }, 3000)
  }
}
</script>
