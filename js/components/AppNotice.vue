<template>
  <div
    class="toast"
    :class="'toast-' + kind"
    :role="kind === 'error' ? 'alert' : 'status'"
  >
    <app-icon :name="kind === 'error' ? 'alert' : 'check'" :size="19" /><span>{{
      message
    }}</span>
    <button
      class="icon-button"
      aria-label="通知を閉じる"
      @click="$emit('close')"
    >
      <app-icon name="close" :size="17" />
    </button>
  </div>
</template>
<script>
import AppIcon from './AppIcon.vue';
export default {
  components: { AppIcon },
  props: { message: String, kind: { type: String, default: 'success' } },
  emits: ['close'],
};
</script>
