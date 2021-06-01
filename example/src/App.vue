<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Hello Vue 3 + Vite" />
    <ul class="icon">
      <li class="ic-buy"></li>
      <li class="ic-data"></li>
      <li class="ic-payment"></li>
      <li class="ic-safe"></li>
      <li class="ic-search"></li>
      <li class="ic-transition"></li>
    </ul>
    <ul class="icon-retina">
      <li class="ic-buy"></li>
      <li class="ic-data"></li>
      <li class="ic-payment"></li>
      <li class="ic-safe"></li>
      <li class="ic-search"></li>
      <li class="ic-transition"></li>
    </ul>
  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue';

// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/script-setup-2/active-rfcs/0000-script-setup.md
</script>

<style lang="scss">
@import "./sprite/style/sprite.scss";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.icon {
  @include sprites($spritesheet-sprites)
}
.icon-retina {
  @include retina-sprites($retina-groups)
}
</style>
