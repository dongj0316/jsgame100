<template>
  <div class="menu-view">
    <div @click="open = false" v-show="open" class="menu-view-mask"></div>

    <transition name="menu-view-slide">
      <div v-show="open" class="menu-view-list">
        <MenuList/>
      </div>
    </transition>

    <transition name="menu-view-trigger-slide">
      <div @click="open = true" v-show="!open" class="menu-view-trigger">
        <button></button>
      </div>
    </transition>
  </div>
</template>

<script>
import MenuList from './MenuList'

export default {
  name: 'menu-view',
  components: {
    MenuList
  },
  data () {
    return {
      open: false
    }
  },
  watch: {
    '$route.path' () {
      this.open = false
    }
  }
}
</script>

<style lang="less" scoped>
@menu-view-z-index: 5000;

.menu-view {
  &-list {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 220px;
    box-shadow: 0 0 15px #808B96;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    transform: translate3d(0, 0, 0);
    background: #ffffff;
    z-index: @menu-view-z-index;
  }
  &-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: @menu-view-z-index - 1;
  }

  &-trigger {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: @menu-view-z-index + 1;
    button {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      box-shadow: 0 0 15px #808B96;
      border: none;
      background: fade(#2c3e50, 50%);
    }
  }
}

@media (max-width: 768px) {
  .menu-view-list {
    width: 70vw;
  }
}

.menu-view-trigger-slide-enter-active {
  animation: slide-bottom .3s;
}
.menu-view-trigger-slide-leave-active {
  animation: slide-top .3s .3s;
}

.menu-view-slide-enter-active {
  animation: slide-right .3s;
}
.menu-view-slide-leave-active {
  animation: slide-left .3s;
}

@keyframes slide-right {
  from {
    transform: translate3d(-100%, 0, 0)
  }
}
@keyframes slide-left {
  to {
    transform: translate3d(-100%, 0, 0)
  }
}
@keyframes slide-bottom {
  from {
    transform: translate3d(0, -200%, 0)
  }
}
@keyframes slide-top {
  to {
    transform: translate3d(0, -200%, 0)
  }
}
</style>