// CDNのdeferスクリプトがすべて実行されてから共有ESMを初期化する。
if (document.readyState === 'loading')
  await new Promise((resolve) =>
    document.addEventListener('DOMContentLoaded', resolve, { once: true }),
  );

try {
  if (!window.Vue || !window['vue3-sfc-loader'])
    throw new Error(
      '画面ライブラリを読み込めませんでした。通信環境を確認して再読み込みしてください。',
    );
  const [
    { loadSfc },
    auth,
    repository,
    { errorMessage },
    ledger,
    { freshOptions },
    { demoAccounts },
  ] = await Promise.all([
    import('./sfc-loader.js'),
    import('./services/auth.js'),
    import('./services/accounts.js'),
    import('./services/supabase.js'),
    import('./utils/ledger.js'),
    import('./config/options.js'),
    import('./services/demo.js'),
  ]);
  const { createApp, defineAsyncComponent } = window.Vue;
  const component = (path) => defineAsyncComponent(() => loadSfc(path));
  let noticeTimer;
  let dataGeneration = 0;
  let unsubscribe;
  const app = createApp({
    components: {
      HomePage: component('js/pages/Home.vue'),
      SettingsPage: component('js/pages/Settings.vue'),
      LoginPanel: component('js/components/LoginPanel.vue'),
      AppNotice: component('js/components/AppNotice.vue'),
      AppIcon: component('js/components/AppIcon.vue'),
      AccountEditor: component('js/components/AccountEditor.vue'),
      ConfirmDialog: component('js/components/ConfirmDialog.vue'),
    },
    data: () => ({
      booting: true,
      session: null,
      isDemo: false,
      view: 'home',
      sidebarOpen: true,
      accounts: [],
      options: freshOptions(),
      loading: false,
      saving: false,
      authBusy: false,
      authError: '',
      loadError: '',
      formError: '',
      settingsError: '',
      deleteError: '',
      notice: null,
      editorOpen: false,
      editingAccount: null,
      deleteTarget: null,
    }),
    computed: {
      userInitial() {
        return (this.session?.user.email?.[0] ?? 'M').toUpperCase();
      },
    },
    mounted() {
      unsubscribe = auth.onSessionChange((event, session) => {
        if (this.isDemo && !session) {
          this.booting = false;
          return;
        }
        const previousId = this.session?.user.id;
        this.session = session;
        this.booting = false;
        if (session?.user.id !== previousId) {
          this.resetWorkspace();
          if (session) {
            this.isDemo = false;
            this.loadAccounts();
          }
        }
      });
    },
    beforeUnmount() {
      unsubscribe?.();
      clearTimeout(noticeTimer);
    },
    methods: {
      notify(message, kind = 'success') {
        clearTimeout(noticeTimer);
        this.notice = { message, kind };
        noticeTimer = setTimeout(() => {
          this.notice = null;
        }, 5000);
      },
      resetWorkspace() {
        dataGeneration += 1;
        this.accounts = [];
        this.options = freshOptions();
        this.view = 'home';
        this.loading = false;
        this.loadError = '';
        this.settingsError = '';
        this.formError = '';
        this.deleteError = '';
        this.editorOpen = false;
        this.editingAccount = null;
        this.deleteTarget = null;
        this.notice = null;
      },
      async login({ email, password }) {
        this.authBusy = true;
        this.authError = '';
        try {
          await auth.signIn(email, password);
        } catch (error) {
          this.authError = errorMessage(error);
        } finally {
          this.authBusy = false;
        }
      },
      startDemo() {
        this.resetWorkspace();
        this.isDemo = true;
        this.accounts = demoAccounts();
        this.booting = false;
      },
      async logout() {
        if (this.saving) return;
        this.authBusy = true;
        try {
          if (!this.isDemo) await auth.signOut();
          this.isDemo = false;
          this.session = null;
          this.resetWorkspace();
          this.authError = '';
        } catch (error) {
          this.notify(errorMessage(error), 'error');
        } finally {
          this.authBusy = false;
        }
      },
      async loadAccounts() {
        if (!this.session || this.isDemo) return;
        const generation = ++dataGeneration;
        const userId = this.session.user.id;
        this.loading = true;
        this.loadError = '';
        try {
          const [accounts, options] = await Promise.all([
            repository.listAccounts(userId),
            repository.readOptions(userId),
          ]);
          if (generation !== dataGeneration) return;
          this.accounts = accounts;
          this.options = options;
        } catch (error) {
          if (generation === dataGeneration) {
            this.accounts = [];
            this.loadError = errorMessage(error);
          }
        } finally {
          if (generation === dataGeneration) this.loading = false;
        }
      },
      openEditor(account = null) {
        if (this.loading || this.loadError || this.saving) return;
        this.editingAccount = account;
        this.formError = '';
        this.editorOpen = true;
      },
      closeEditor() {
        if (!this.saving) {
          this.editorOpen = false;
          this.editingAccount = null;
        }
      },
      async saveAccount(values) {
        if (this.saving) return;
        const validation = ledger.validateAccount(values);
        if (validation) {
          this.formError = validation;
          return;
        }
        const generation = dataGeneration;
        this.saving = true;
        this.formError = '';
        try {
          const account = this.isDemo
            ? {
                ...values,
                ...ledger.accountPayload(values),
                id: values.id ?? crypto.randomUUID(),
                user_id: 'sample',
                created_at: values.created_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : await repository.upsertAccount(values, this.session.user.id);
          if (generation !== dataGeneration) return;
          this.accounts = [
            account,
            ...this.accounts.filter((item) => item.id !== account.id),
          ];
          this.editorOpen = false;
          this.editingAccount = null;
          this.notify(
            values.id
              ? '登録情報を更新しました。'
              : 'アカウントを追加しました。',
          );
        } catch (error) {
          if (generation === dataGeneration)
            this.formError = errorMessage(error);
        } finally {
          this.saving = false;
        }
      },
      closeDelete() {
        if (!this.saving) {
          this.deleteTarget = null;
          this.deleteError = '';
        }
      },
      async deleteAccount() {
        if (this.saving || !this.deleteTarget) return;
        const generation = dataGeneration;
        const target = this.deleteTarget;
        this.saving = true;
        this.deleteError = '';
        try {
          if (!this.isDemo)
            await repository.removeAccount(target.id, this.session.user.id);
          if (generation !== dataGeneration) return;
          this.accounts = this.accounts.filter((item) => item.id !== target.id);
          this.deleteTarget = null;
          this.notify('台帳からアカウントを削除しました。');
        } catch (error) {
          if (generation === dataGeneration)
            this.deleteError = errorMessage(error);
        } finally {
          this.saving = false;
        }
      },
      async markReviewed(account) {
        if (this.saving) return;
        const generation = dataGeneration;
        this.saving = true;
        try {
          const updated = this.isDemo
            ? {
                ...account,
                last_reviewed_on: ledger.todayString(),
                updated_at: new Date().toISOString(),
              }
            : await repository.reviewAccount(
                account.id,
                this.session.user.id,
                ledger.todayString(),
              );
          if (generation !== dataGeneration) return;
          this.accounts = this.accounts.map((item) =>
            item.id === updated.id ? updated : item,
          );
          this.notify('最終点検日を今日に更新しました。');
        } catch (error) {
          if (generation === dataGeneration)
            this.notify(errorMessage(error), 'error');
        } finally {
          this.saving = false;
        }
      },
      async saveSettings(options) {
        if (this.saving || this.loading || this.loadError) return;
        const generation = dataGeneration;
        this.saving = true;
        this.settingsError = '';
        try {
          const updated = this.isDemo
            ? options
            : await repository.writeOptions(options, this.session.user.id);
          if (generation !== dataGeneration) return;
          this.options = updated;
          this.notify('選択肢を保存しました。');
        } catch (error) {
          if (generation === dataGeneration)
            this.settingsError = errorMessage(error);
        } finally {
          this.saving = false;
        }
      },
      async copyText(value) {
        try {
          await navigator.clipboard.writeText(value);
          this.notify('ログインIDをコピーしました。');
        } catch {
          this.notify(
            'コピーできませんでした。文字を選択してコピーしてください。',
            'error',
          );
        }
      },
    },
  });
  app.config.errorHandler = (error) => {
    console.error(error);
    const status = document.getElementById('boot-status');
    status.hidden = false;
    status.textContent =
      '画面を読み込めませんでした。通信環境を確認し、再読み込みしてください。';
  };
  app.mount('#app');
  document.getElementById('boot-status').hidden = true;
} catch (error) {
  console.error(error);
  document.getElementById('boot-status').textContent = error.message;
}
