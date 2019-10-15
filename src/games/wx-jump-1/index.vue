<template>
  <div class="jump-world">
    <canvas id="jump-world-canvas"></canvas>
  </div>
</template>

<script>
import JumpGameWorld from './index'

export default {
  mounted () {
    const game = new JumpGameWorld({
      container: document.querySelector('.jump-world'),
      canvas: document.querySelector('#jump-world-canvas'),
      axesHelper: true
    })
  }
}
</script>

<style lang="less" scoped>
@media (max-width: 768px) {
  .jump-world {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    canvas {
      width: 100%;
      height: 100%;
    }
  }
}
@media (min-width: 768px) {
  .jump-world {
    width: 375px;
    height: 667px;
    margin: auto;
    canvas {
      width: 100%;
      height: 100%;
    }
  }
}
</style>