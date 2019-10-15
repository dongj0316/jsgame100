<template>
  <ul class="menu-list">
    <li>
      <h1>临摹JS小游戏</h1>
    </li>
    <li>
      <router-link to="/">首页</router-link>
    </li>

    <template v-for="route in withMenuViewRoutes">
      <li :key="route.name">
        <router-link :to="route.path">{{route.meta.title}}</router-link>
      </li>
    </template>
  </ul>
</template>

<script>
import { withMenuViewRoutes } from '@/router'

export default {
  name: 'menu-list',
  data () {
    return {
      withMenuViewRoutes
    }
  }
}
</script>

<style lang="less" scoped>
.menu-list {
  padding: 30px;
  margin: 0;
  list-style: none;
  text-align: center;
  h1 {
    margin-top: 0;
    font-size: 24px;
  }
  li {
    padding: 5px 0;
  }
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>