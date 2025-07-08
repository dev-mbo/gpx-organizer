<script>
export default {
  data() {
    return {
      message: "Hello World",
      count: 0
    }
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
</template>
