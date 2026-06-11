const API_BASE = '/.netlify/functions';
const TOKEN_KEY = 'adam_admin_token';

let config = null;
let activePanel = 'site';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showStatus(message, type = 'success') {
  const el = document.getElementById('admin-status');
  if (!el) return;
  el.className = `status-msg ${type}`;
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

function showLogin() {
  document.getElementById('login-view')?.classList.remove('hidden');
  document.getElementById('admin-view')?.classList.add('hidden');
}

function showAdmin() {
  document.getElementById('login-view')?.classList.add('hidden');
  document.getElementById('admin-view')?.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  try {
    const { token } = await api('/admin-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setToken(token);
    await loadAdmin();
    showAdmin();
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

async function loadAdmin() {
  config = await api('/config');
  renderAllPanels();
}

function switchPanel(panel) {
  activePanel = panel;
  document.querySelectorAll('.admin-nav button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.panel === panel);
  });
  document.querySelectorAll('.admin-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${panel}`);
  });
}

function renderAllPanels() {
  renderSitePanel();
  renderChannelsPanel();
  renderPaymentsPanel();
  renderTelegramPanel();
  renderServicesPanel();
}

function renderSitePanel() {
  const el = document.getElementById('panel-site');
  if (!el) return;
  el.innerHTML = `
    <h1>Site Settings</h1>
    <div class="form-group">
      <label>Site Title</label>
      <input id="site-title" value="${esc(config.site?.title || '')}">
    </div>
    <div class="form-group">
      <label>Tagline</label>
      <input id="site-tagline" value="${esc(config.site?.tagline || '')}">
    </div>
    <div class="form-group">
      <label>Footer Text</label>
      <input id="site-footer" value="${esc(config.site?.footer || '')}">
    </div>
    <div class="form-group">
      <label>Services Page Title</label>
      <input id="services-title" value="${esc(config.servicesPage?.title || '')}">
    </div>
    <div class="form-group">
      <label>Services Page Subtitle</label>
      <textarea id="services-subtitle">${esc(config.servicesPage?.subtitle || '')}</textarea>
    </div>
    <button class="btn btn-primary" onclick="window.adminSaveSite()">Save Site Settings</button>
  `;
}

function renderChannelsPanel() {
  const el = document.getElementById('panel-channels');
  if (!el) return;
  const rows = (config.channels || [])
    .map(
      (ch, i) => `
    <tr>
      <td><input data-ch-field="label" data-ch-index="${i}" value="${esc(ch.label)}"></td>
      <td><input data-ch-field="url" data-ch-index="${i}" value="${esc(ch.url)}"></td>
      <td><input type="checkbox" data-ch-field="enabled" data-ch-index="${i}" ${ch.enabled !== false ? 'checked' : ''}></td>
      <td><button class="btn btn-secondary btn-sm" onclick="window.adminRemoveChannel(${i})">Remove</button></td>
    </tr>
  `
    )
    .join('');

  el.innerHTML = `
    <h1>Channels</h1>
    <table class="admin-table">
      <thead><tr><th>Label</th><th>URL</th><th>Enabled</th><th></th></tr></thead>
      <tbody id="channels-tbody">${rows}</tbody>
    </table>
    <div class="admin-toolbar">
      <button class="btn btn-secondary" onclick="window.adminAddChannel()">Add Channel</button>
      <button class="btn btn-primary" onclick="window.adminSaveChannels()">Save Channels</button>
    </div>
  `;
}

function renderPaymentsPanel() {
  const el = document.getElementById('panel-payments');
  if (!el) return;
  const w = config.payments?.wishMoney || {};
  const cryptoRows = (config.payments?.crypto || [])
    .map(
      (c, i) => `
    <tr>
      <td><input data-cr-field="label" data-cr-index="${i}" value="${esc(c.label)}"></td>
      <td><input data-cr-field="value" data-cr-index="${i}" value="${esc(c.value)}"></td>
      <td><input type="checkbox" data-cr-field="enabled" data-cr-index="${i}" ${c.enabled !== false ? 'checked' : ''}></td>
      <td><button class="btn btn-secondary btn-sm" onclick="window.adminRemoveCrypto(${i})">Remove</button></td>
    </tr>
  `
    )
    .join('');

  el.innerHTML = `
    <h1>Payments</h1>
    <h2 style="font-size:1.1rem;color:var(--taupe);margin:1.5rem 0 1rem">Crypto</h2>
    <table class="admin-table">
      <thead><tr><th>Label</th><th>Value</th><th>Enabled</th><th></th></tr></thead>
      <tbody id="crypto-tbody">${cryptoRows}</tbody>
    </table>
    <div class="admin-toolbar">
      <button class="btn btn-secondary" onclick="window.adminAddCrypto()">Add Crypto</button>
      <button class="btn btn-primary" onclick="window.adminSavePayments()">Save Payments</button>
    </div>

    <h2 style="font-size:1.1rem;color:var(--taupe);margin:2rem 0 1rem">Wish Money</h2>
    <div class="form-group">
      <label><input type="checkbox" id="wish-enabled" ${w.enabled !== false ? 'checked' : ''}> Enabled</label>
    </div>
    <div class="form-group">
      <label>Label</label>
      <input id="wish-label" value="${esc(w.label || 'Wish Money (Whish)')}">
    </div>
    <div class="form-group">
      <label>Phone Number</label>
      <input id="wish-phone" value="${esc(w.phone || '')}">
    </div>
    <div class="form-group">
      <label>Account Name</label>
      <input id="wish-account" value="${esc(w.accountName || '')}">
    </div>
    <div class="form-group">
      <label>Instructions</label>
      <textarea id="wish-instructions">${esc(w.instructions || '')}</textarea>
    </div>
  `;
}

function renderTelegramPanel() {
  const el = document.getElementById('panel-telegram');
  if (!el) return;
  const t = config.telegram || {};
  el.innerHTML = `
    <h1>Telegram</h1>
    <div class="form-group">
      <label>Username (without @)</label>
      <input id="tg-username" value="${esc(t.username || '')}">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input id="tg-url" value="${esc(t.url || '')}">
    </div>
    <div class="form-group">
      <label>Purchase CTA Button Text</label>
      <input id="tg-cta" value="${esc(t.purchaseCta || '')}">
    </div>
    <div class="form-group">
      <label>Purchase Note</label>
      <textarea id="tg-note">${esc(t.purchaseNote || '')}</textarea>
    </div>
    <button class="btn btn-primary" onclick="window.adminSaveTelegram()">Save Telegram</button>
  `;
}

function renderServicesPanel() {
  const el = document.getElementById('panel-services');
  if (!el) return;

  const sections = config.serviceSections || [];
  el.innerHTML = `
    <h1>Services & Prices</h1>
    <p style="color:var(--text-muted);margin-bottom:1.5rem">Prices are managed here but hidden on the public services page. Customers order via Telegram.</p>
    ${sections
      .map((section, si) => {
        const rows = (section.services || [])
          .map(
            (svc, i) => `
          <tr>
            <td><input data-svc-section="${si}" data-svc-index="${i}" data-svc-field="name" value="${esc(svc.name)}"></td>
            <td><input data-svc-section="${si}" data-svc-index="${i}" data-svc-field="price" value="${esc(svc.price || '')}" placeholder="e.g. $10"></td>
            <td><input type="checkbox" data-svc-section="${si}" data-svc-index="${i}" data-svc-field="enabled" ${svc.enabled !== false ? 'checked' : ''}></td>
            <td><button class="btn btn-secondary btn-sm" onclick="window.adminRemoveService(${si}, ${i})">Remove</button></td>
          </tr>
        `
          )
          .join('');

        return `
          <div style="margin-bottom:2rem">
            <h2 style="font-size:1.15rem;color:var(--taupe);margin-bottom:0.75rem">${section.icon || ''} ${section.title}</h2>
            <table class="admin-table">
              <thead><tr><th>Service Name</th><th>Price (admin only)</th><th>Enabled</th><th></th></tr></thead>
              <tbody data-section="${si}">${rows}</tbody>
            </table>
            <button class="btn btn-secondary btn-sm" style="margin-top:0.5rem" onclick="window.adminAddService(${si})">Add Service</button>
          </div>
        `;
      })
      .join('')}
    <button class="btn btn-primary" onclick="window.adminSaveServices()">Save All Services</button>
  `;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function collectChannels() {
  const channels = [...(config.channels || [])];
  document.querySelectorAll('[data-ch-index]').forEach((el) => {
    const i = Number(el.dataset.chIndex);
    const field = el.dataset.chField;
    if (!channels[i]) channels[i] = { id: `ch-${i}`, enabled: true };
    if (field === 'enabled') channels[i][field] = el.checked;
    else channels[i][field] = el.value;
  });
  return channels;
}

function collectCrypto() {
  const crypto = [...(config.payments?.crypto || [])];
  document.querySelectorAll('[data-cr-index]').forEach((el) => {
    const i = Number(el.dataset.crIndex);
    const field = el.dataset.crField;
    if (!crypto[i]) crypto[i] = { id: `cr-${i}`, enabled: true };
    if (field === 'enabled') crypto[i][field] = el.checked;
    else crypto[i][field] = el.value;
  });
  return crypto;
}

function collectServices() {
  const sections = JSON.parse(JSON.stringify(config.serviceSections || []));
  document.querySelectorAll('[data-svc-section]').forEach((el) => {
    const si = Number(el.dataset.svcSection);
    const i = Number(el.dataset.svcIndex);
    const field = el.dataset.svcField;
    if (!sections[si]) return;
    if (!sections[si].services[i]) sections[si].services[i] = { enabled: true };
    if (field === 'enabled') sections[si].services[i][field] = el.checked;
    else sections[si].services[i][field] = el.value;
  });
  return sections;
}

async function saveConfig(partial) {
  config = { ...config, ...partial };
  await api('/config', { method: 'PUT', body: JSON.stringify(config) });
  showStatus('Saved successfully!');
  renderAllPanels();
}

window.adminSaveSite = async () => {
  await saveConfig({
    site: {
      title: document.getElementById('site-title').value,
      tagline: document.getElementById('site-tagline').value,
      footer: document.getElementById('site-footer').value,
    },
    servicesPage: {
      ...config.servicesPage,
      title: document.getElementById('services-title').value,
      subtitle: document.getElementById('services-subtitle').value,
      showPrices: false,
    },
  });
};

window.adminSaveChannels = async () => {
  await saveConfig({ channels: collectChannels() });
};

window.adminSavePayments = async () => {
  await saveConfig({
    payments: {
      crypto: collectCrypto(),
      wishMoney: {
        enabled: document.getElementById('wish-enabled').checked,
        label: document.getElementById('wish-label').value,
        phone: document.getElementById('wish-phone').value,
        accountName: document.getElementById('wish-account').value,
        instructions: document.getElementById('wish-instructions').value,
      },
    },
  });
};

window.adminSaveTelegram = async () => {
  const username = document.getElementById('tg-username').value.replace('@', '');
  await saveConfig({
    telegram: {
      username,
      url: document.getElementById('tg-url').value || `https://t.me/${username}`,
      purchaseCta: document.getElementById('tg-cta').value,
      purchaseNote: document.getElementById('tg-note').value,
    },
  });
};

window.adminSaveServices = async () => {
  await saveConfig({ serviceSections: collectServices() });
};

window.adminAddChannel = () => {
  config.channels = [...(config.channels || []), { id: `ch-${Date.now()}`, label: 'New Channel', url: '', enabled: true }];
  renderChannelsPanel();
};

window.adminRemoveChannel = (i) => {
  config.channels.splice(i, 1);
  renderChannelsPanel();
};

window.adminAddCrypto = () => {
  config.payments.crypto = [...(config.payments.crypto || []), { id: `cr-${Date.now()}`, label: '', value: '', enabled: true }];
  renderPaymentsPanel();
};

window.adminRemoveCrypto = (i) => {
  config.payments.crypto.splice(i, 1);
  renderPaymentsPanel();
};

window.adminAddService = (si) => {
  config.serviceSections[si].services.push({ name: 'New Service', price: '', enabled: true });
  renderServicesPanel();
};

window.adminRemoveService = (si, i) => {
  config.serviceSections[si].services.splice(i, 1);
  renderServicesPanel();
};

window.adminLogout = () => {
  clearToken();
  showLogin();
};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  document.querySelectorAll('.admin-nav button').forEach((btn) => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  if (getToken()) {
    try {
      await loadAdmin();
      showAdmin();
    } catch {
      clearToken();
      showLogin();
    }
  } else {
    showLogin();
  }
});
