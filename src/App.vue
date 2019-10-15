<template>
  <div id="app">
    <router-view name="MenuView" />
    <router-view/>
  </div>
</template>

<style lang="less">
* {
  box-sizing: border-box;
}
html, body {
  width: 100%;
}

#app {
  width: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
