<template>
  <section class="ledger-page" aria-labelledby="home-title">
    <header class="page-heading">
      <div>
        <div class="eyebrow">マイワークスペース</div>
        <h1 id="home-title">アカウント一覧<span class="heading-dot"></span></h1>
        <p class="page-description">
          登録情報とパスワードの保管場所を、ひとつに。
        </p>
      </div>
      <button
        class="button button-primary add-button"
        :disabled="loading || !!loadError || saving"
        @click="$emit('create')"
      >
        <app-icon name="plus" :size="18" />アカウントを追加
      </button>
    </header>

    <div class="summary-grid">
      <button
        class="summary-card"
        :class="{ selected: !filters.review && !filters.billing }"
        @click="selectMetric('all')"
      >
        <span class="summary-icon mint"
          ><app-icon name="book" :size="22" /></span
        ><span class="summary-copy"
          ><span>登録アカウント</span
          ><strong
            >{{ unavailable ? '—' : accounts.length }}<small>件</small></strong
          ></span
        ><app-icon class="summary-arrow" name="chevron" :size="17" />
      </button>
      <button
        class="summary-card"
        :class="{ selected: filters.review === 'needed' }"
        @click="selectMetric('review')"
      >
        <span class="summary-icon sand"
          ><app-icon name="shield" :size="22" /></span
        ><span class="summary-copy"
          ><span>見直しが必要</span
          ><strong
            >{{ unavailable ? '—' : reviewCount }}<small>件</small></strong
          ></span
        ><span v-if="!unavailable && reviewCount" class="summary-hint"
          >要点検</span
        >
      </button>
      <button
        class="summary-card"
        :class="{ selected: filters.billing === '有料' }"
        @click="selectMetric('paid')"
      >
        <span class="summary-icon lavender"
          ><app-icon name="wallet" :size="22" /></span
        ><span class="summary-copy"
          ><span>有料サービス</span
          ><strong
            >{{ unavailable ? '—' : paidCount }}<small>件</small></strong
          ></span
        ><app-icon class="summary-arrow" name="chevron" :size="17" />
      </button>
    </div>

    <section class="ledger-panel" aria-label="登録アカウント">
      <div class="panel-heading">
        <h2>
          あなたのアカウント<span class="count-pill">{{
            unavailable ? '—' : accounts.length
          }}</span>
        </h2>
        <span class="panel-date"
          ><app-icon name="clock" :size="14" />{{ displayDate(today) }}</span
        >
      </div>
      <div class="toolbar">
        <div class="search-field">
          <app-icon name="search" :size="18" /><input
            v-model="filters.search"
            aria-label="アカウントを検索"
            placeholder="サービス名、ID、保管場所で検索"
          /><button
            v-if="filters.search"
            class="icon-button"
            aria-label="検索をクリア"
            @click="filters.search = ''"
          >
            <app-icon name="close" :size="16" /></button
          ><span v-else class="search-key" aria-hidden="true">検索</span>
        </div>
        <div class="filter-selects">
          <select v-model="filters.status" aria-label="状態で絞り込み">
            <option value="">すべての状態</option>
            <option v-for="status in statuses" :key="status">
              {{ status }}
            </option></select
          ><select v-model="filters.review" aria-label="点検状況で絞り込み">
            <option value="">すべての点検状況</option>
            <option value="needed">要点検のみ</option>
            <option value="ok">OKのみ</option>
          </select>
        </div>
      </div>
      <div class="category-row">
        <div class="category-tabs" aria-label="カテゴリで絞り込み">
          <button
            :class="{ active: !filters.category }"
            :aria-pressed="!filters.category"
            @click="filters.category = ''"
          >
            すべて<span>{{ accounts.length }}</span></button
          ><button
            v-for="category in categories"
            :key="category"
            :class="{ active: filters.category === category }"
            :aria-pressed="filters.category === category"
            @click="filters.category = category"
          >
            {{ category }}<span>{{ categoryCount(category) }}</span>
          </button>
        </div>
      </div>
      <div v-if="loading" class="loading-state" role="status">
        <span class="spinner"></span>台帳を読み込んでいます…
      </div>
      <div v-else-if="loadError" class="empty-state error-state" role="alert">
        <span class="empty-icon"><app-icon name="alert" :size="28" /></span>
        <h3>台帳を読み込めませんでした</h3>
        <p>{{ loadError }}</p>
        <button class="button button-secondary" @click="$emit('retry')">
          <app-icon name="refresh" :size="17" />もう一度読み込む
        </button>
      </div>
      <template v-else>
        <div class="results-bar">
          <span
            ><strong>{{ visibleAccounts.length }}</strong> 件を表示<span
              v-if="filters.billing"
              class="applied-filter"
              >{{ filters.billing
              }}<button
                aria-label="課金区分の絞り込みを解除"
                @click="filters.billing = ''"
              >
                <app-icon name="close" :size="13" /></button></span
            ><button
              v-if="hasFilters"
              class="text-button reset-filters"
              @click="resetFilters"
            >
              絞り込みを解除
            </button></span
          ><label class="sort-control"
            ><span>並び順</span
            ><select v-model="sort" aria-label="並び順">
              <option value="updated">更新が新しい順</option>
              <option value="name">サービス名順</option>
              <option value="review">要点検を優先</option>
            </select></label
          >
        </div>
        <div v-if="!accounts.length" class="empty-state">
          <span class="empty-icon"><app-icon name="book" :size="32" /></span>
          <h3>最初のアカウントを登録しましょう</h3>
          <p>
            よく使うサービスのIDや、パスワードの保管場所を<br />まとめておくと、探すのがぐっと楽になります。
          </p>
          <button class="button button-primary" @click="$emit('create')">
            <app-icon name="plus" :size="18" />アカウントを追加
          </button>
        </div>
        <div v-else-if="!visibleAccounts.length" class="empty-state">
          <span class="empty-icon"><app-icon name="search" :size="28" /></span>
          <h3>条件に合うアカウントがありません</h3>
          <p>検索ワードや絞り込み条件を変えてみてください。</p>
          <button class="button button-secondary" @click="resetFilters">
            すべてのアカウントを表示
          </button>
        </div>
        <div v-else class="table-wrap">
          <table class="accounts-table">
            <thead>
              <tr>
                <th scope="col">サービス</th>
                <th scope="col">ログインID</th>
                <th scope="col">パスワードの保管場所</th>
                <th scope="col">2段階認証</th>
                <th scope="col">状態</th>
                <th scope="col">点検状況</th>
                <th scope="col"><span class="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(account, index) in visibleAccounts" :key="account.id">
                <td class="service-cell">
                  <span class="service-avatar" :class="avatarColor(account)">{{
                    account.service_name.slice(0, 1).toUpperCase()
                  }}</span>
                  <div class="service-copy">
                    <button
                      class="service-name"
                      @click="$emit('edit', account)"
                    >
                      {{ account.service_name }}</button
                    ><span class="service-meta"
                      ><span>{{ account.category || '未分類' }}</span
                      ><span v-if="account.billing === '有料'" class="paid-dot"
                        >有料</span
                      ><a
                        v-if="safeUrl(account.login_url)"
                        :href="safeUrl(account.login_url)"
                        target="_blank"
                        rel="noopener noreferrer"
                        :aria-label="
                          account.service_name + 'のログイン画面を開く'
                        "
                        title="ログイン画面を開く"
                        ><app-icon name="external" :size="12" /></a
                    ></span>
                  </div>
                </td>
                <td class="id-cell" data-label="ログインID">
                  <div class="id-line">
                    <span :title="account.login_id">{{
                      account.login_id || '未設定'
                    }}</span
                    ><button
                      v-if="account.login_id"
                      class="icon-button copy-button"
                      :aria-label="
                        account.service_name + 'のログインIDをコピー'
                      "
                      @click="$emit('copy', account.login_id)"
                    >
                      <app-icon name="copy" :size="14" />
                    </button>
                  </div>
                  <span
                    v-if="
                      account.registered_email &&
                      account.registered_email !== account.login_id
                    "
                    class="cell-secondary"
                    :title="account.registered_email"
                    >{{ account.registered_email }}</span
                  >
                </td>
                <td class="storage-cell" data-label="保管場所">
                  <span
                    :class="{ 'missing-value': !account.storage_location }"
                    >{{ account.storage_location || '未設定' }}</span
                  ><span
                    v-if="account.storage_item"
                    class="cell-secondary"
                    :title="account.storage_item"
                    >{{ account.storage_item }}</span
                  >
                </td>
                <td class="factor-cell" data-label="2段階認証">
                  <span
                    :class="[
                      'factor-label',
                      account.two_factor === 'なし' ? 'factor-missing' : '',
                    ]"
                    ><app-icon
                      v-if="account.two_factor && account.two_factor !== 'なし'"
                      name="shield"
                      :size="14"
                    />{{ account.two_factor || '未設定' }}</span
                  >
                </td>
                <td class="state-cell" data-label="状態">
                  <span
                    class="state-label"
                    :class="{
                      'state-active': account.status === '利用中',
                      'state-cancel': account.status === '解約予定',
                    }"
                    ><i></i>{{ account.status || '未設定' }}</span
                  >
                </td>
                <td class="review-cell" data-label="点検状況">
                  <span
                    class="badge"
                    :class="'badge-' + reviewFor(account).tone"
                    ><app-icon
                      v-if="reviewFor(account).label === 'OK'"
                      name="check"
                      :size="12"
                    /><span>{{ reviewFor(account).label }}</span></span
                  ><span class="cell-secondary">{{
                    account.last_reviewed_on
                      ? displayDate(account.last_reviewed_on)
                      : 'まだ点検していません'
                  }}</span>
                </td>
                <td class="actions-cell">
                  <button
                    class="icon-button"
                    :disabled="saving"
                    :aria-label="
                      account.service_name + 'を今日点検したとして記録'
                    "
                    title="今日点検したとして記録"
                    @click="$emit('review', account)"
                  >
                    <app-icon name="check" :size="17" /></button
                  ><button
                    class="icon-button"
                    :disabled="saving"
                    :aria-label="account.service_name + 'を編集'"
                    title="編集"
                    @click="$emit('edit', account)"
                  >
                    <app-icon name="edit" :size="16" /></button
                  ><button
                    class="icon-button danger-hover"
                    :disabled="saving"
                    :aria-label="account.service_name + 'を台帳から削除'"
                    title="台帳から削除"
                    @click="$emit('delete', account)"
                  >
                    <app-icon name="trash" :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="accounts.length" class="table-footer">
          <span
            ><span class="status-dot"></span>全
            {{ accounts.length }} 件のアカウント</span
          ><span>「✓」で今日の点検を記録できます</span>
        </div>
      </template>
    </section>
    <div class="ledger-tip">
      <span class="tip-icon"><app-icon name="lock" :size="17" /></span>
      <div>
        <strong>パスワードは、ここには書かない。</strong>
        <p>
          保管場所と項目名だけを記録しましょう。パスワード・認証コード・リカバリーコードは、それぞれの保管先で管理してください。
        </p>
      </div>
    </div>
  </section>
</template>

<script>
import AppIcon from '../components/AppIcon.vue';
import {
  reviewStatus,
  filterAccounts,
  safeUrl,
  displayDate,
  todayString,
} from '../utils/ledger.js';
export default {
  components: { AppIcon },
  props: {
    accounts: { type: Array, required: true },
    options: { type: Object, required: true },
    loading: Boolean,
    loadError: String,
    saving: Boolean,
  },
  emits: ['create', 'edit', 'delete', 'review', 'retry', 'copy'],
  data: () => ({
    filters: { search: '', category: '', status: '', review: '', billing: '' },
    sort: 'updated',
    today: todayString(),
    clock: null,
  }),
  computed: {
    unavailable() {
      return this.loading || !!this.loadError;
    },
    reviewCount() {
      return this.accounts.filter(
        (account) => reviewStatus(account, this.today).needsReview,
      ).length;
    },
    paidCount() {
      return this.accounts.filter((account) => account.billing === '有料')
        .length;
    },
    categories() {
      return [
        ...new Set([
          ...this.options.category,
          ...this.accounts.map((account) => account.category).filter(Boolean),
        ]),
      ];
    },
    statuses() {
      return [
        ...new Set([
          ...this.options.status,
          ...this.accounts.map((account) => account.status).filter(Boolean),
        ]),
      ];
    },
    hasFilters() {
      return Object.values(this.filters).some(Boolean);
    },
    visibleAccounts() {
      return filterAccounts(this.accounts, this.filters, this.today).sort(
        (a, b) => {
          if (this.sort === 'review') {
            const difference =
              Number(reviewStatus(b, this.today).needsReview) -
              Number(reviewStatus(a, this.today).needsReview);
            if (difference) return difference;
          }
          if (this.sort === 'updated')
            return (
              b.updated_at.localeCompare(a.updated_at) ||
              a.service_name.localeCompare(b.service_name, 'ja')
            );
          return a.service_name.localeCompare(b.service_name, 'ja');
        },
      );
    },
  },
  mounted() {
    this.clock = setInterval(() => {
      this.today = todayString();
    }, 60000);
  },
  beforeUnmount() {
    clearInterval(this.clock);
  },
  methods: {
    safeUrl,
    displayDate,
    reviewFor(account) {
      return reviewStatus(account, this.today);
    },
    categoryCount(category) {
      return this.accounts.filter((account) => account.category === category)
        .length;
    },
    resetFilters() {
      this.filters = {
        search: '',
        category: '',
        status: '',
        review: '',
        billing: '',
      };
    },
    selectMetric(metric) {
      this.resetFilters();
      if (metric === 'review') this.filters.review = 'needed';
      if (metric === 'paid') this.filters.billing = '有料';
    },
    avatarColor(account) {
      const colors = ['mint', 'violet', 'blue', 'amber', 'rose', 'slate'];
      return colors[
        [...account.service_name].reduce(
          (sum, char) => sum + char.codePointAt(0),
          0,
        ) % colors.length
      ];
    },
  },
};
</script>
