<template>
  <dialog
    ref="dialog"
    class="site-picker-dialog"
    aria-labelledby="site-picker-title"
    @cancel.prevent="$emit('close')"
    @click="backdrop"
  >
    <header class="site-picker-header">
      <div>
        <span class="eyebrow">ログイン情報を追加</span>
        <h2 id="site-picker-title">サービスを選ぶ</h2>
      </div>
      <button class="icon-button" aria-label="閉じる" @click="$emit('close')">
        <app-icon name="close" />
      </button>
    </header>
    <div class="site-picker-search-area">
      <label class="site-picker-search" for="site-picker-search">
        <app-icon name="search" :size="21" />
        <input
          id="site-picker-search"
          ref="search"
          v-model="query"
          type="search"
          placeholder="Webサイト・アプリを検索"
          autocomplete="off"
        />
      </label>
      <p>選ぶとサービス名とログインURLが入力されます。</p>
    </div>
    <div class="site-picker-list" aria-label="よく使われるサービス">
      <button
        v-for="site in filteredSites"
        :key="site.name"
        class="site-picker-item"
        type="button"
        @click="$emit('select', site)"
      >
        <span class="site-picker-mark" aria-hidden="true">{{ site.name[0] }}</span>
        <span class="site-picker-copy">
          <strong>{{ site.name }}</strong>
          <small>{{ site.host }}</small>
        </span>
        <app-icon name="chevron" :size="18" />
      </button>
      <p v-if="!filteredSites.length" class="site-picker-empty">
        一致する候補はありません。「その他」から入力できます。
      </p>
    </div>
    <footer class="site-picker-footer">
      <span>一覧にないサービスは手入力できます。</span>
      <button class="button button-secondary" type="button" @click="manualEntry">
        その他（自分で入力）
      </button>
    </footer>
  </dialog>
</template>
<script>
import AppIcon from './AppIcon.vue';
export default {
  components: { AppIcon },
  props: { sites: { type: Array, required: true } },
  emits: ['close', 'select', 'manual'],
  data() {
    return { query: '' };
  },
  computed: {
    sitesWithHosts() {
      return this.sites.map((site) => ({
        ...site,
        host: new URL(site.url).hostname.replace(/^www\./, ''),
      }));
    },
    filteredSites() {
      const query = this.normalize(this.query);
      if (!query) return this.sitesWithHosts;
      return this.sitesWithHosts.filter(
        (site) =>
          this.normalize(site.name).includes(query) ||
          this.normalize(site.host).includes(query),
      );
    },
  },
  mounted() {
    this.$refs.dialog.showModal();
    this.$nextTick(() => this.$refs.search?.focus());
  },
  beforeUnmount() {
    this.$refs.dialog?.close();
  },
  methods: {
    normalize(value) {
      return value.normalize('NFKC').toLocaleLowerCase();
    },
    manualEntry() {
      this.$emit('manual', this.query.trim());
    },
    backdrop(event) {
      if (event.target === this.$refs.dialog) {
        const bounds = this.$refs.dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          this.$emit('close');
      }
    },
  },
};
</script>
