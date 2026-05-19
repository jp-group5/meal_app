<template>
  <div class="skeleton-list" aria-hidden="true">
    <div v-for="index in 3" :key="index" class="skeleton-card">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-tags">
        <div class="skeleton-pill"></div>
        <div class="skeleton-pill"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
      <div class="skeleton-metrics">
        <div v-for="metric in 4" :key="metric" class="skeleton-metric"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: grid;
  gap: 0.8rem;
}

.skeleton-card {
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.skeleton-line,
.skeleton-pill,
.skeleton-metric {
  background: linear-gradient(90deg, #e6ebf0 25%, #dce3ea 37%, #e6ebf0 63%);
  background-size: 400% 100%;
  animation: pulse-loading 1.1s ease infinite;
}

.skeleton-title {
  height: 18px;
  width: 65%;
  border-radius: 6px;
}

.skeleton-tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.skeleton-pill {
  width: 82px;
  height: 24px;
  border-radius: 999px;
}

.skeleton-content {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
}

.skeleton-line.short {
  width: 80%;
}

.skeleton-metrics {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.skeleton-metric {
  border-radius: 8px;
  height: 46px;
}

@keyframes pulse-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
