import { loadConfig, renderHeader, renderFooter } from './main.js';

function groupServicesByPlatform(services) {
  const groups = {};
  const platformPatterns = [
    { key: 'Instagram', match: /instagram/i },
    { key: 'TikTok', match: /tiktok/i },
    { key: 'YouTube', match: /youtube/i },
    { key: 'Facebook', match: /facebook/i },
    { key: 'Twitter / X', match: /twitter| x /i },
    { key: 'Telegram', match: /telegram/i },
    { key: 'Snapchat', match: /snapchat/i },
    { key: 'LinkedIn', match: /linkedin/i },
    { key: 'Spotify', match: /spotify/i },
    { key: 'Discord', match: /discord/i },
    { key: 'WhatsApp', match: /whatsapp/i },
    { key: 'Other', match: /.*/ },
  ];

  services.forEach((service) => {
    if (service.enabled === false) return;
    const name = service.name;
    let group = 'Other';
    for (const p of platformPatterns) {
      if (p.key !== 'Other' && p.match.test(name)) {
        group = p.key;
        break;
      }
    }
    if (!groups[group]) groups[group] = [];
    groups[group].push(service);
  });

  return groups;
}

function renderServiceSections(config) {
  const container = document.getElementById('service-sections');
  const pageTitle = document.getElementById('services-title');
  const pageSubtitle = document.getElementById('services-subtitle');
  const nav = document.getElementById('services-nav');

  if (pageTitle) pageTitle.textContent = config.servicesPage?.title || 'Our Services';
  if (pageSubtitle) pageSubtitle.textContent = config.servicesPage?.subtitle || '';

  const sections = (config.serviceSections || []).filter((s) => s.services?.some((svc) => svc.enabled !== false));
  if (!container) return;

  if (nav) {
    nav.innerHTML = sections
      .map(
        (s) =>
          `<a href="#section-${s.id}">${s.icon || ''} ${s.title}</a>`
      )
      .join('');
  }

  container.innerHTML = sections
    .map((section) => {
      const services = (section.services || []).filter((s) => s.enabled !== false);
      const isBoosting = section.id === 'boosting';
      let servicesHtml;

      if (isBoosting && services.length > 20) {
        const groups = groupServicesByPlatform(services);
        servicesHtml = Object.entries(groups)
          .map(([platform, items]) => {
            if (!items.length) return '';
            return `
              <div class="service-group" style="margin-bottom:1.25rem">
                <h3 style="margin:0 0 0.75rem;font-size:1rem;color:var(--sable)">${platform}</h3>
                <div class="service-list">
                  ${items
                    .map(
                      (svc) => `
                    <div class="service-item">
                      <span class="service-item-name">${svc.name}</span>
                      <a href="${getTelegramLink(config, svc.name)}" target="_blank" rel="noopener" class="btn btn-telegram btn-sm">Order</a>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('');
      } else {
        servicesHtml = `
          <div class="service-list">
            ${services
              .map(
                (svc) => `
              <div class="service-item">
                <span class="service-item-name">${svc.name}</span>
                <a href="${getTelegramLink(config, svc.name)}" target="_blank" rel="noopener" class="btn btn-telegram btn-sm">Order</a>
              </div>
            `
              )
              .join('')}
          </div>
        `;
      }

      return `
        <section class="service-section" id="section-${section.id}">
          <div class="service-section-header">
            <span class="service-section-icon">${section.icon || ''}</span>
            <h2>${section.title}</h2>
          </div>
          ${servicesHtml}
        </section>
      `;
    })
    .join('');
}

function getTelegramLink(config, serviceName) {
  const base = config.telegram?.url || 'https://t.me/vacsuri';
  const message = encodeURIComponent(`Hi, I'd like to order: ${serviceName}`);
  return `${base}?text=${message}`;
}

function renderCtaBanner(config) {
  const el = document.getElementById('purchase-cta');
  if (!el) return;

  el.innerHTML = `
    <p>${config.telegram?.purchaseNote || 'Contact us on Telegram to purchase and pay.'}</p>
    <a href="${config.telegram?.url || 'https://t.me/vacsuri'}" target="_blank" rel="noopener" class="btn btn-telegram">
      ${config.telegram?.purchaseCta || 'Contact on Telegram'}
    </a>
  `;
}

async function initServicesPage() {
  const config = await loadConfig();
  renderHeader(config, 'services');
  renderFooter(config);
  renderCtaBanner(config);
  renderServiceSections(config);
}

document.addEventListener('DOMContentLoaded', initServicesPage);
