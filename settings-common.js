'use strict';
const SettingsUI = {
  message(key) { return chrome.i18n.getMessage('ui_' + key); },
  localize() {
    document.documentElement.lang = chrome.i18n.getUILanguage();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      el.setAttribute('aria-label', chrome.i18n.getMessage(el.dataset.i18nLabel));
    });
  },
  hostname(value) {
    const raw = value.trim();
    if (!raw || /\s/.test(raw)) throw new Error('invalid');
    const url = new URL(raw.includes('://') ? raw : 'https://' + raw);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('invalid');
    return url.hostname;
  }
};
