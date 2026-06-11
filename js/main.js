const API_BASE = '/.netlify/functions';

let siteConfig = null;

async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (res.ok) {
      siteConfig = await res.json();
      return siteConfig;
    }
  } catch (_) {
    /* fallback below */
  }

  const fallback = await fetch('/data/default-config.json');
  siteConfig = await fallback.json();
  return siteConfig;
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied successfully!');
  } catch {
    showToast('Could not copy — please copy manually.');
  }
}

function renderHeader(config, activePage) {
  const header = document.getElementById('site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="container nav">
      <a href="/" class="brand">${config.site.title}</a>
      <nav class="nav-links">
        <a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="/services.html" class="${activePage === 'services' ? 'active' : ''}">Services</a>
        <a href="${config.telegram.url}" target="_blank" rel="noopener">Telegram</a>
      </nav>
    </div>
  `;
}

function renderFooter(config) {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML = `<div class="container">${config.site.footer}</div>`;
}

function renderChannels(config) {
  const el = document.getElementById('channels');
  if (!el) return;

  const channels = (config.channels || []).filter((c) => c.enabled !== false);
  el.innerHTML = channels
    .map(
      (ch) => `
      <div class="card channel-link">
        <div>
          <div class="card-label">${ch.label}</div>
        </div>
        <a href="${ch.url}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Open</a>
      </div>
    `
    )
    .join('');
}

function renderPayments(config) {
  const cryptoEl = document.getElementById('crypto-payments');
  const wishEl = document.getElementById('wish-money-payment');
  if (!cryptoEl) return;

  const crypto = (config.payments?.crypto || []).filter((c) => c.enabled !== false);
  cryptoEl.innerHTML = crypto
    .map(
      (item) => `
      <div class="card copyable" data-copy="${item.value}">
        <div class="card-label">${item.label}</div>
        <div class="card-value">${item.value}</div>
      </div>
    `
    )
    .join('');

  cryptoEl.querySelectorAll('.copyable').forEach((card) => {
    card.addEventListener('click', () => copyText(card.dataset.copy));
  });

  if (wishEl && config.payments?.wishMoney?.enabled) {
    const w = config.payments.wishMoney;
    wishEl.innerHTML = `
      <div class="card wish-money-card copyable" data-copy="${w.phone}">
        <div class="card-label">${w.label}</div>
        <div class="card-value">${w.phone}</div>
        ${w.accountName ? `<div class="card-label" style="margin-top:0.75rem">Account: ${w.accountName}</div>` : ''}
        ${w.instructions ? `<p style="margin:0.75rem 0 0;font-size:0.88rem;color:var(--text-muted)">${w.instructions}</p>` : ''}
      </div>
    `;
    wishEl.querySelector('.copyable')?.addEventListener('click', () => copyText(w.phone));
  }
}

function initPaymentTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });
}

async function initHomePage() {
  const config = await loadConfig();
  renderHeader(config, 'home');
  renderFooter(config);

  const heroTitle = document.getElementById('hero-title');
  const heroTagline = document.getElementById('hero-tagline');
  if (heroTitle) heroTitle.textContent = config.site.title;
  if (heroTagline) heroTagline.textContent = config.site.tagline;

  renderChannels(config);
  renderPayments(config);
  initPaymentTabs();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'home') {
    initHomePage();
  }
});

export { loadConfig, copyText, showToast, renderHeader, renderFooter };
