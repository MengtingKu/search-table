import { createApp, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { loadSheetData } from './i18nLoader';
import './style.css';
import App from './App.vue';

async function init() {
  const app = createApp(App);

  try {
    const { messages, languages } = await loadSheetData();
    console.log(messages, languages)

    if (!Array.isArray(languages) || languages.length === 0) {
      throw new Error('Google Sheet 資料格式錯誤：找不到語言欄位');
    }

    const savedLang = localStorage.getItem('lang');
    const defaultLang =
      savedLang && languages.includes(savedLang) ? savedLang : languages[0];

    const i18n = createI18n({
      legacy: false,
      locale: defaultLang,
      fallbackLocale: languages[0],
      messages: (messages ?? {}) as unknown as Record<
        string,
        Record<string, string>
      >,
    });

    app.provide('languages', languages);

    app.use(i18n);
    app.mount('#app');
  } catch (err) {
    console.error('[i18n 初始化失敗]', err);
    const fallback = createApp({
      render() {
        return h(
          'div',
          { style: 'padding:20px;color:red' },
          '❌無法載入多語系資料，請稍後再試。❌'
        );
      },
    });
    fallback.mount('#app');
  }
}

init();
