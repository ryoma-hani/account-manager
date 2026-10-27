<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @cancel.prevent="cancel"
  >
    <span class="confirm-icon"><app-icon name="trash" :size="24" /></span>
    <h2 id="confirm-title">{{ title }}</h2>
    <p id="confirm-message">{{ message }}</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div class="confirm-actions">
      <button
        class="button button-secondary"
        autofocus
        :disabled="busy"
        @click="cancel"
      >
        キャンセル</button
      ><button
        class="button button-danger"
        :disabled="busy"
        @click="$emit('confirm')"
      >
        {{ busy ? '削除しています…' : '台帳から削除' }}
      </button>
    </div>
  </dialog>
</template>
<script>
import AppIcon from './AppIcon.vue';
export default {
  components: { AppIcon },
  props: { title: String, message: String, busy: Boolean, error: String },
  emits: ['cancel', 'confirm'],
  mounted() {
    this.$refs.dialog.showModal();
  },
  beforeUnmount() {
    this.$refs.dialog?.close();
  },
  methods: {
    cancel() {
      if (!this.busy) this.$emit('cancel');
    },
  },
};
</script>
