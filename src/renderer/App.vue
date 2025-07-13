<script>
import Map from './components/Map.vue'
export default {
  data() {
    return {
      message: "Hello World",
      count: 0
    }
  },
  components: {
    Map
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<template>
  <h1>{{message}}</h1>
  <button @click="increment">{{ count }}</button>
  <Map />
</template>

<style>
h1 {
  color: red;
}
html, body {
  height: 100%;
  margin: 0;
}
#app {
  height: 100%
}
</style>
