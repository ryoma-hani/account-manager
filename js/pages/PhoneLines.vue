<template>
  <section class="phone-lines-page" aria-labelledby="phone-lines-title">
    <header class="page-heading">
      <div>
        <div class="eyebrow">マイワークスペース</div>
        <h1 id="phone-lines-title">電話番号<span class="heading-dot"></span></h1>
        <p class="page-description">
          SMS認証などで使う携帯電話の契約会社と電話番号を登録します。
        </p>
      </div>
    </header>

    <div class="phone-lines-note">
      <app-icon name="shield" :size="19" />
      <p>電話番号はアカウント台帳とは別に、このワークスペース内へ保存されます。</p>
    </div>

    <div v-if="loading" class="loading-state" role="status">
      <span class="spinner"></span>保存内容を読み込んでいます…
    </div>
    <div v-else-if="loadError" class="settings-panel error-state" role="alert">
      <p>{{ loadError }}</p>
      <button class="button button-secondary" @click="$emit('retry')">もう一度読み込む</button>
    </div>
    <template v-else>
      <section class="settings-panel phone-entry-panel">
        <div class="settings-panel-title">
          <h2>{{ editingId ? '電話番号を編集' : '電話番号を登録' }}</h2>
        </div>
        <form class="phone-entry-form" @submit.prevent="save">
          <label class="option-field" for="phone-carrier">
            <span>携帯会社</span>
            <select id="phone-carrier" v-model="carrierChoice" :disabled="saving" required>
              <option disabled value="">選択してください</option>
              <option v-for="carrier in carriers" :key="carrier" :value="carrier">{{ carrier }}</option>
              <option value="other">その他（手入力）</option>
            </select>
          </label>
          <label v-if="carrierChoice === 'other'" class="option-field" for="phone-carrier-other">
            <span>携帯会社名</span>
            <input id="phone-carrier-other" v-model="otherCarrier" maxlength="100" required placeholder="例：地域の通信会社" :disabled="saving" />
          </label>
          <label class="option-field" for="phone-number">
            <span>電話番号</span>
            <small>日本の電話番号を入力してください（ハイフン・空白は任意）。</small>
            <input id="phone-number" v-model="phoneNumber" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="例：090-1234-5678" required :disabled="saving" />
          </label>
          <p v-if="validation" class="form-error" role="alert">{{ validation }}</p>
          <div class="phone-entry-actions">
            <button class="button button-primary" type="submit" :disabled="saving">
              <app-icon name="check" :size="17" />{{ saving ? '保存しています…' : editingId ? '変更を保存' : '電話番号を登録' }}
            </button>
            <button v-if="editingId" class="button button-secondary" type="button" :disabled="saving" @click="resetForm">キャンセル</button>
          </div>
        </form>
      </section>

      <section class="settings-panel">
        <div class="settings-panel-title">
          <h2>登録済みの電話番号</h2>
          <span class="phone-lines-count">{{ phoneLines.length }} 件</span>
        </div>
        <div v-if="!phoneLines.length" class="phone-lines-empty">
          <span class="summary-icon mint"><app-icon name="phone" :size="22" /></span>
          <div><strong>電話番号はまだ登録されていません</strong><p>上のフォームから携帯会社と電話番号を登録できます。</p></div>
        </div>
        <ul v-else class="phone-lines-list">
          <li v-for="line in phoneLines" :key="line.id" class="phone-line-item">
            <span class="summary-icon mint"><app-icon name="phone" :size="21" /></span>
            <div class="phone-line-copy"><strong>{{ line.carrier }}</strong><span>{{ line.phone_number }}</span></div>
            <div class="phone-line-actions">
              <button class="icon-button" :disabled="saving" :aria-label="line.carrier + 'の電話番号を編集'" title="編集" @click="edit(line)"><app-icon name="edit" :size="17" /></button>
              <button class="icon-button danger-hover" :disabled="saving" :aria-label="line.carrier + 'の電話番号を削除'" title="削除" @click="remove(line)"><app-icon name="trash" :size="17" /></button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<script>
import AppIcon from '../components/AppIcon.vue';

const carrierChoices = [
  '楽天モバイル', 'Y!mobile', 'NTTドコモ', 'au', 'SoftBank',
  'UQ mobile', 'ahamo', 'povo', 'LINEMO', 'IIJmio',
];

export default {
  components: { AppIcon },
  props: {
    phoneLines: { type: Array, required: true },
    saving: Boolean,
    loading: Boolean,
    loadError: String,
  },
  emits: ['save', 'retry'],
  data() {
    return {
      carriers: carrierChoices,
      carrierChoice: '',
      otherCarrier: '',
      phoneNumber: '',
      editingId: '',
      validation: '',
      pendingSave: '',
    };
  },
  watch: {
    phoneLines(value) {
      if (this.pendingSave && JSON.stringify(value) === this.pendingSave) {
        this.pendingSave = '';
        this.resetForm();
      }
    },
  },
  methods: {
    save() {
      this.validation = '';
      const carrier = this.carrierChoice === 'other' ? this.otherCarrier.trim() : this.carrierChoice;
      const digits = this.phoneNumber.replace(/[\s-]/g, '');
      if (!carrier || carrier.length > 100) {
        this.validation = '携帯会社を選択するか、会社名を入力してください。';
        return;
      }
      if (!/^0\d{9,10}$/.test(digits)) {
        this.validation = '電話番号は0から始まる10桁または11桁で入力してください。';
        return;
      }
      const record = {
        id: this.editingId || crypto.randomUUID(),
        carrier,
        phone_number: this.phoneNumber.trim(),
      };
      const updated = this.editingId
        ? this.phoneLines.map((line) => line.id === this.editingId ? record : line)
        : [...this.phoneLines, record];
      this.pendingSave = JSON.stringify(updated);
      this.$emit('save', updated);
    },
    edit(line) {
      this.editingId = line.id;
      this.carrierChoice = this.carriers.includes(line.carrier) ? line.carrier : 'other';
      this.otherCarrier = this.carriers.includes(line.carrier) ? '' : line.carrier;
      this.phoneNumber = line.phone_number;
      this.validation = '';
      document.getElementById('phone-lines-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    remove(line) {
      if (!window.confirm(`「${line.carrier} ${line.phone_number}」を削除しますか？`)) return;
      const updated = this.phoneLines.filter((item) => item.id !== line.id);
      this.pendingSave = JSON.stringify(updated);
      this.$emit('save', updated);
    },
    resetForm() {
      this.editingId = '';
      this.carrierChoice = '';
      this.otherCarrier = '';
      this.phoneNumber = '';
      this.validation = '';
    },
  },
};
</script>
