<template>
  <section class="settings-page" aria-labelledby="settings-title">
    <header class="page-heading">
      <div>
        <div class="eyebrow">マイワークスペース</div>
        <h1 id="settings-title">設定<span class="heading-dot"></span></h1>
        <p class="page-description">自分の使い方に合わせて、台帳を整える。</p>
      </div>
      <button
        class="button button-primary"
        :disabled="saving || loading || !!loadError || !dirty"
        @click="save"
      >
        <app-icon name="check" :size="18" />{{
          saving ? '保存しています…' : '変更を保存'
        }}
      </button>
    </header>
    <div class="settings-profile">
      <span class="summary-icon mint"
        ><app-icon name="shield" :size="24"
      /></span>
      <div>
        <h2>あなたのワークスペース</h2>
        <p>{{ email }}</p>
      </div>
      <span class="badge badge-success">{{
        isDemo ? 'サンプルモード' : '個人用'
      }}</span>
    </div>
    <div v-if="loading" class="loading-state" role="status">
      <span class="spinner"></span>設定を読み込んでいます…
    </div>
    <div v-else-if="loadError" class="settings-panel error-state" role="alert">
      <p>{{ loadError }}</p>
      <button class="button button-secondary" @click="$emit('retry')">
        もう一度読み込む
      </button>
    </div>
    <template v-else>
      <section class="settings-panel">
        <div class="settings-panel-title">
          <h2>選択肢の管理</h2>
          <span v-if="dirty" class="unsaved-label">未保存の変更があります</span>
        </div>
        <p class="subtle">
          1行に1つずつ入力してください。空行と重複は保存時に取り除きます。
        </p>
        <p class="settings-help">
          選択肢を削除しても、登録済みのアカウントの値は変わりません。
        </p>
        <div class="options-grid">
          <label
            v-for="field in optionFields"
            :key="field.key"
            class="option-field"
            :for="'options-' + field.key"
            ><span>{{ field.label }}</span
            ><small>{{ field.description }}</small
            ><textarea
              :id="'options-' + field.key"
              v-model="draft[field.key]"
              :disabled="saving"
              rows="7"
              :aria-describedby="'options-help-' + field.key"
            ></textarea
            ><small :id="'options-help-' + field.key"
              >{{ splitOptions(draft[field.key]).length }} 個の選択肢</small
            ></label
          >
        </div>
        <p v-if="validation || saveError" class="form-error" role="alert">
          {{ validation || saveError }}
        </p>
        <div class="settings-bottom">
          <button class="text-button" :disabled="saving" @click="resetDefaults">
            初期の選択肢に戻す</button
          ><span>変更後は「変更を保存」を押してください。</span>
        </div>
      </section>
      <section class="settings-panel review-guide">
        <span class="summary-icon sand"
          ><app-icon name="clock" :size="22"
        /></span>
        <div>
          <h2>点検状況の判定について</h2>
          <p>次の順に確認し、最初に該当する状態を表示します。</p>
          <ol>
            <li>2段階認証が「なし」 → 2FAなし</li>
            <li>保管場所が空欄 → 保管場所未設定</li>
            <li>最終点検日が空欄 → 未点検</li>
            <li>最終点検日から90日超 → 90日超未点検</li>
            <li>それ以外 → OK</li>
          </ol>
          <p class="subtle">
            「OK」はこの点検ルールの結果です。サービスを見直したら、一覧の「✓」で最終点検日を更新できます。
          </p>
        </div>
      </section>
    </template>
  </section>
</template>
<script>
import AppIcon from '../components/AppIcon.vue';
import { optionFields, freshOptions } from '../config/options.js';
export default {
  components: { AppIcon },
  props: {
    options: { type: Object, required: true },
    accounts: Array,
    loading: Boolean,
    saving: Boolean,
    loadError: String,
    saveError: String,
    email: String,
    isDemo: Boolean,
  },
  emits: ['save', 'retry'],
  data() {
    return { optionFields, draft: this.toDraft(this.options), validation: '' };
  },
  computed: {
    dirty() {
      return (
        JSON.stringify(this.draft) !==
        JSON.stringify(this.toDraft(this.options))
      );
    },
  },
  watch: {
    options: {
      deep: true,
      handler(value) {
        this.draft = this.toDraft(value);
        this.validation = '';
      },
    },
  },
  methods: {
    toDraft(options) {
      return Object.fromEntries(
        optionFields.map(({ key }) => [key, options[key].join('\n')]),
      );
    },
    splitOptions(value) {
      return [
        ...new Set(
          value
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
    },
    resetDefaults() {
      this.draft = this.toDraft(freshOptions());
      this.validation = '';
    },
    save() {
      if (this.saving) return;
      const result = Object.fromEntries(
        optionFields.map(({ key }) => [
          key,
          this.splitOptions(this.draft[key]),
        ]),
      );
      for (const { key, label } of optionFields) {
        if (!result[key].length) {
          this.validation = label + 'の選択肢を1つ以上入力してください。';
          return;
        }
        if (
          result[key].length > 50 ||
          result[key].some((value) => value.length > 100)
        ) {
          this.validation =
            label + 'は50項目以内、1項目100文字以内で入力してください。';
          return;
        }
      }
      this.validation = '';
      this.$emit('save', result);
    },
  },
};
</script>
