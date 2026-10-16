import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writePage(relPath, html) {
  const fullPath = path.join(DIST_DIR, relPath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, html, 'utf8');
}

function renderLayout({
  title,
  description,
  canonicalPath,
  siteConfig,
  jsonLd = null,
  bodyContent,
  activeNav = ''
}) {
  const base = siteConfig.basePath || '';
  const canonicalUrl = `${siteConfig.domain.replace(/\/$/, '')}${base}${canonicalPath}`;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="${base}/assets/styles.css" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
  <header class="site-header">
    <div class="container nav-inner">
      <a href="${base}/" class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-text">${escapeHtml(siteConfig.name)}</span>
        <span class="brand-badge">2026 TCO Engine</span>
      </a>
      <nav class="main-nav">
        <a href="${base}/" class="${activeNav === 'home' ? 'active' : ''}">Stack Calculator</a>
        <a href="${base}/#directory" class="${activeNav === 'directory' ? 'active' : ''}">Self-Host Directory</a>
        <a href="${base}/#vps-benchmarks" class="${activeNav === 'vps' ? 'active' : ''}">Best VPS Deals</a>
        <a href="${base}/#comparisons" class="${activeNav === 'compare' ? 'active' : ''}">SaaS Comparisons</a>
      </nav>
    </div>
  </header>

  <main>
    ${bodyContent}
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="brand footer-brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-text">${escapeHtml(siteConfig.name)}</span>
        </div>
        <p class="footer-desc">
          Automated open-source vs. Cloud SaaS total cost of ownership (TCO) calculators, live GitHub telemetry, and VPS hardware sizing benchmarks.
        </p>
        <p class="disclosure">
          <strong>Affiliate Disclosure:</strong> Some links on ${escapeHtml(siteConfig.name)} (such as VPS hosting or cloud trial links) are referral links. We may earn a commission at no extra cost to you, and many links unlock exclusive free cloud credits ($100–$200) for new accounts.
        </p>
      </div>
      <div>
        <h4>Top Self-Hosted Calculators</h4>
        <ul class="footer-links">
          <li><a href="${base}/self-host/n8n/">Self-Host n8n vs Zapier</a></li>
          <li><a href="${base}/self-host/coolify/">Self-Host Coolify vs Vercel</a></li>
          <li><a href="${base}/self-host/supabase/">Self-Host Supabase Cost</a></li>
          <li><a href="${base}/self-host/chatwoot/">Self-Host Chatwoot vs Intercom</a></li>
          <li><a href="${base}/self-host/plausible/">Self-Host Plausible Analytics</a></li>
          <li><a href="${base}/self-host/immich/">Self-Host Immich Photo Cloud</a></li>
        </ul>
      </div>
      <div>
        <h4>Popular SaaS Alternatives</h4>
        <ul class="footer-links">
          <li><a href="${base}/alternatives-to/zapier/">Open-Source Zapier Alternatives</a></li>
          <li><a href="${base}/alternatives-to/notion/">Open-Source Notion Alternatives</a></li>
          <li><a href="${base}/alternatives-to/airtable/">Open-Source Airtable Alternatives</a></li>
          <li><a href="${base}/alternatives-to/intercom/">Open-Source Intercom Alternatives</a></li>
          <li><a href="${base}/alternatives-to/vercel/">Open-Source Vercel Alternatives</a></li>
          <li><a href="${base}/alternatives-to/calendly/">Open-Source Calendly Alternatives</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${currentYear} ${escapeHtml(siteConfig.name)}. Auto-updated via GitHub Actions API Pipeline.</span>
      <span><a href="${base}/sitemap.xml">XML Sitemap</a> · <a href="${base}/llms.txt">LLMs.txt</a></span>
    </div>
  </footer>
</body>
</html>`;
}

function renderVpsCards(vpsProviders, base, recommendedRamGb = 4) {
  return `
    <div class="vps-grid">
      ${vpsProviders
        .map((provider) => {
          const matchingPlan =
            provider.plans.find((p) => p.ramGb >= recommendedRamGb) ||
            provider.plans[provider.plans.length - 1];
          return `
          <div class="vps-card ${provider.highlight ? 'vps-card-featured' : ''}" data-provider-id="${escapeHtml(provider.id)}" data-plans='${JSON.stringify(provider.plans)}'>
            <div class="vps-card-top">
              <div>
                <span class="vps-badge">${escapeHtml(provider.badge)}</span>
                <h3 class="vps-name">${escapeHtml(provider.name)}</h3>
              </div>
              <div class="vps-price-box">
                <span class="vps-price-val" data-role="plan-price">$${matchingPlan.monthlyUsd.toFixed(2)}</span>
                <span class="vps-price-period">/mo</span>
              </div>
            </div>
            <div class="vps-matched-plan" data-role="plan-specs">
              Matched Tier: <strong>${escapeHtml(matchingPlan.name)}</strong> (${matchingPlan.vcpu} vCPU · ${matchingPlan.ramGb}GB RAM · ${matchingPlan.storageGb}GB NVMe)
            </div>
            <ul class="vps-features">
              ${provider.features.map((f) => `<li>✓ ${escapeHtml(f)}</li>`).join('')}
            </ul>
            <a href="${base}/go/${escapeHtml(provider.id)}/" target="_blank" rel="nofollow sponsored noopener" class="btn ${provider.highlight ? 'btn-primary' : 'btn-secondary'} vps-cta">
              ${escapeHtml(provider.promoText)} →
            </a>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

function renderToolCalculatorPage(tool, allTools, affiliates, lastUpdatedDate) {
  const base = affiliates.site.basePath || '';
  const calc = tool.calculator;
  const req = tool.vpsRequirements;
  const relatedTools = allTools
    .filter((t) => t.slug !== tool.slug && t.categorySlug === tool.categorySlug)
    .slice(0, 4);

  const defaultSaasMonthly = Math.round(
    calc.saasBaseUsd + Math.max(0, calc.defaultUnits - calc.saasIncludedUnits) * calc.saasPerUnitUsd
  );
  const defaultManagedMonthly = Math.round(
    calc.managedBaseUsd +
      Math.max(0, calc.defaultUnits - calc.managedIncludedUnits) * calc.managedPerUnitUsd
  );
  const defaultSelfHostMonthly = 6.99;
  const defaultAnnualSavings = Math.max(0, Math.round((defaultSaasMonthly - defaultSelfHostMonthly) * 12));

  const faqSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.name,
        applicationCategory: tool.category,
        operatingSystem: 'Linux, Docker',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD'
        },
        description: tool.shortDescription
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How much RAM and CPU do I need to self-host ${tool.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `To self-host ${tool.name} with Docker, the minimum requirement is ${req.minVcpu} vCPU, ${req.minRamGb}GB RAM, and ${req.minStorageGb}GB SSD storage. For production team workloads, we recommend ${req.recVcpu} vCPU and ${req.recRamGb}GB RAM.`
            }
          },
          {
            '@type': 'Question',
            name: `How much money does self-hosting ${tool.name} save vs ${calc.saasName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `At ${calc.defaultUnits} ${calc.unitSuffix}, ${calc.saasName} costs approximately $${defaultSaasMonthly}/month ($${defaultSaasMonthly * 12}/year), whereas self-hosting ${tool.name} on a ${req.recRamGb}GB KVM VPS costs around $${defaultSelfHostMonthly}/month—saving roughly $${defaultAnnualSavings} per year.`
            }
          }
        ]
      }
    ]
  };

  const bodyContent = `
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="${base}/">Home</a> <span>/</span>
          <a href="${base}/category/${escapeHtml(tool.categorySlug)}/">${escapeHtml(tool.category)}</a> <span>/</span>
          <span>Self-Host ${escapeHtml(tool.name)}</span>
        </div>
        <div class="hero-title-row">
          <div>
            <span class="pill-badge">${escapeHtml(tool.category)} · ${escapeHtml(tool.license)}</span>
            <h1>Self-Host ${escapeHtml(tool.name)}: Cost Calculator, VPS Specs & ${escapeHtml(calc.saasName.split(' ')[0])} Comparison</h1>
            <p class="lead">${escapeHtml(tool.shortDescription)}</p>
          </div>
          <div class="github-card">
            <div class="gh-title">Live GitHub Telemetry</div>
            <div class="gh-stats">
              <div><strong>⭐ ${tool.githubStats.stars.toLocaleString()}</strong><span>Stars</span></div>
              <div><strong>🍴 ${tool.githubStats.forks.toLocaleString()}</strong><span>Forks</span></div>
              <div><strong>📦 ${escapeHtml(tool.githubStats.latestRelease)}</strong><span>Release</span></div>
            </div>
            <div class="gh-updated">Verified: ${escapeHtml(lastUpdatedDate)} · <a href="https://github.com/${escapeHtml(tool.githubRepo)}" target="_blank" rel="noopener">View Repo ↗</a></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="calc-card" id="tool-calculator"
          data-min-ram="${req.minRamGb}"
          data-rec-ram="${req.recRamGb}"
          data-min-vcpu="${req.minVcpu}"
          data-rec-vcpu="${req.recVcpu}"
          data-min-storage="${req.minStorageGb}"
          data-ram-scale="${req.ramPer100UnitsGb}"
          data-saas-base="${calc.saasBaseUsd}"
          data-saas-inc="${calc.saasIncludedUnits}"
          data-saas-per="${calc.saasPerUnitUsd}"
          data-managed-base="${calc.managedBaseUsd}"
          data-managed-inc="${calc.managedIncludedUnits}"
          data-managed-per="${calc.managedPerUnitUsd}"
          data-unit-suffix="${escapeHtml(calc.unitSuffix)}">
          <div class="calc-header">
            <div>
              <h2>Interactive ${escapeHtml(tool.name)} vs. ${escapeHtml(calc.saasName)} Cost Calculator</h2>
              <p>Drag the slider to match your workload. We automatically calculate your monthly SaaS bill and size the exact Linux VPS hardware required.</p>
            </div>
            <div class="savings-pill">
              <span>Estimated Annual Savings</span>
              <strong id="annual-savings-display">$${defaultAnnualSavings.toLocaleString()}/yr</strong>
            </div>
          </div>

          <div class="slider-box">
            <div class="slider-label-row">
              <label for="workload-slider">${escapeHtml(calc.unitLabel)}:</label>
              <span class="slider-current-val" id="slider-val-display">${calc.defaultUnits} ${escapeHtml(calc.unitSuffix)}</span>
            </div>
            <input type="range" id="workload-slider" min="${calc.minUnits}" max="${calc.maxUnits}" step="${calc.stepUnits}" value="${calc.defaultUnits}" />
            <div class="slider-ticks">
              <span>Min: ${calc.minUnits} ${escapeHtml(calc.unitSuffix)}</span>
              <span>Mid: ${Math.round((calc.minUnits + calc.maxUnits) / 2)} ${escapeHtml(calc.unitSuffix)}</span>
              <span>Scale: ${calc.maxUnits} ${escapeHtml(calc.unitSuffix)}</span>
            </div>
          </div>

          <div class="comparison-bars">
            <div class="bar-card bar-saas">
              <div class="bar-top">
                <div>
                  <span class="bar-tag">Incumbent SaaS</span>
                  <h3>${escapeHtml(calc.saasName)}</h3>
                </div>
                <div class="bar-price">
                  <strong id="saas-monthly-val">$${defaultSaasMonthly}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-danger" id="saas-bar-fill" style="width: 100%"></div></div>
              <div class="bar-Sub" id="saas-annual-val">$${(defaultSaasMonthly * 12).toLocaleString()} billed annually · Per-unit/seat restrictions apply</div>
            </div>

            <div class="bar-card bar-managed">
              <div class="bar-top">
                <div>
                  <span class="bar-tag">Zero-Maintenance Official Cloud</span>
                  <h3>${escapeHtml(calc.managedName)}</h3>
                </div>
                <div class="bar-price">
                  <strong id="managed-monthly-val">$${defaultManagedMonthly}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-warn" id="managed-bar-fill" style="width: 45%"></div></div>
              <div class="bar-footer-row">
                <span id="managed-annual-val">$${(defaultManagedMonthly * 12).toLocaleString()}/yr · Hosted by creators</span>
                <a href="${base}/go/${escapeHtml(tool.affiliateKey)}/" target="_blank" rel="nofollow sponsored noopener" class="link-cta">Try Official Cloud →</a>
              </div>
            </div>

            <div class="bar-card bar-selfhost">
              <div class="bar-top">
                <div>
                  <span class="bar-tag badge-success">Winner: Self-Hosted Docker VPS</span>
                  <h3>Self-Hosted ${escapeHtml(tool.name)}</h3>
                </div>
                <div class="bar-price text-emerald">
                  <strong id="selfhost-monthly-val">$${defaultSelfHostMonthly.toFixed(2)}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-success" id="selfhost-bar-fill" style="width: 12%"></div></div>
              <div class="bar-footer-row">
                <span id="selfhost-specs-val">Recommended VPS: <strong>${req.recVcpu} vCPU / ${req.recRamGb}GB RAM / ${req.recStorageGb}GB NVMe</strong></span>
                <a href="#recommended-vps" class="link-cta text-emerald">Deploy in 1-Click ↓</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="recommended-vps">
      <div class="container">
        <div class="section-head">
          <h2>Best VPS Providers to Self-Host ${escapeHtml(tool.name)} (Auto-Sized)</h2>
          <p>The plans below automatically update as you move the workload slider above so you never overpay or under-provision RAM.</p>
        </div>
        ${renderVpsCards(affiliates.vpsProviders, base, req.recRamGb)}
      </div>
    </section>

    <section class="section">
      <div class="container grid-2">
        <div class="card">
          <h2>⚡ Quickstart Docker Deployment (${escapeHtml(tool.setupTimeMinutes)} Mins)</h2>
          <p>Setup Difficulty: <strong>${escapeHtml(tool.setupDifficulty)}</strong>. Run the command below on any Ubuntu 24.04 VPS or deploy via Coolify/Hostinger 1-Click template:</p>
          <div class="code-block">
            <code id="docker-cmd">${escapeHtml(tool.dockerCommand)}</code>
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('docker-cmd').innerText);this.innerText='Copied!';">Copy</button>
          </div>
          <div class="specs-table-wrap">
            <h4>Hardware Sizing Matrix for ${escapeHtml(tool.name)}</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Workload Tier</th>
                  <th>vCPU</th>
                  <th>RAM</th>
                  <th>NVMe Storage</th>
                  <th>Est. VPS Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Starter / Personal</td>
                  <td>${req.minVcpu} Core</td>
                  <td>${req.minRamGb} GB</td>
                  <td>${req.minStorageGb} GB</td>
                  <td>$4.50 – $6.00/mo</td>
                </tr>
                <tr>
                  <td><strong>Production Team (Recommended)</strong></td>
                  <td><strong>${req.recVcpu} Cores</strong></td>
                  <td><strong>${req.recRamGb} GB</strong></td>
                  <td><strong>${req.recStorageGb} GB</strong></td>
                  <td><strong>$6.99 – $14.00/mo</strong></td>
                </tr>
                <tr>
                  <td>High-Scale Enterprise</td>
                  <td>${req.recVcpu * 2} Cores</td>
                  <td>${req.recRamGb * 2} GB</td>
                  <td>${req.recStorageGb * 2} GB</td>
                  <td>$18.50 – $36.00/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h2>Why Self-Host ${escapeHtml(tool.name)} vs. Cloud SaaS?</h2>
          <h4 class="text-emerald">✅ Key Advantages</h4>
          <ul class="check-list">
            ${tool.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
          <h4 class="text-amber" style="margin-top:1.25rem;">⚠️ Honest Trade-offs to Consider</h4>
          <ul class="warn-list">
            ${tool.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
          <div class="replaces-box">
            <span>Replaces Paid SaaS Tools:</span>
            <div class="tag-row">
              ${tool.replaces
                .map(
                  (r) =>
                    `<a href="${base}/alternatives-to/${slugify(r)}/" class="tag-link">${escapeHtml(r)} Alternatives</a>`
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    ${
      relatedTools.length > 0
        ? `
    <section class="section section-alt">
      <div class="container">
        <h2>Related Self-Hosted Tools in ${escapeHtml(tool.category)}</h2>
        <div class="tool-grid">
          ${relatedTools
            .map(
              (rt) => `
            <a href="${base}/self-host/${escapeHtml(rt.slug)}/" class="tool-card">
              <div class="tool-card-top">
                <h3>${escapeHtml(rt.name)}</h3>
                <span class="star-badge">⭐ ${(rt.githubStats.stars / 1000).toFixed(1)}k</span>
              </div>
              <p>${escapeHtml(rt.shortDescription)}</p>
              <div class="tool-card-foot">
                <span>Min RAM: ${rt.vpsRequirements.minRamGb}GB</span>
                <span class="text-emerald">Calculate Savings →</span>
              </div>
            </a>
          `
            )
            .join('')}
        </div>
      </div>
    </section>
    `
        : ''
    }

    <script>
      (function() {
        const root = document.getElementById('tool-calculator');
        const slider = document.getElementById('workload-slider');
        if (!root || !slider) return;

        const minRam = parseFloat(root.dataset.minRam);
        const recRam = parseFloat(root.dataset.recRam);
        const minVcpu = parseInt(root.dataset.minVcpu, 10);
        const recVcpu = parseInt(root.dataset.recVcpu, 10);
        const minStorage = parseInt(root.dataset.minStorage, 10);
        const ramScale = parseFloat(root.dataset.ramScale);
        const saasBase = parseFloat(root.dataset.saasBase);
        const saasInc = parseFloat(root.dataset.saasInc);
        const saasPer = parseFloat(root.dataset.saasPer);
        const managedBase = parseFloat(root.dataset.managedBase);
        const managedInc = parseFloat(root.dataset.managedInc);
        const managedPer = parseFloat(root.dataset.managedPer);
        const unitSuffix = root.dataset.unitSuffix;

        function update() {
          const units = parseFloat(slider.value);
          document.getElementById('slider-val-display').textContent = units + ' ' + unitSuffix;

          const saasMo = Math.round(saasBase + Math.max(0, units - saasInc) * saasPer);
          const managedMo = Math.round(managedBase + Math.max(0, units - managedInc) * managedPer);

          const neededRamRaw = Math.max(minRam, recRam + ((units / 100) * ramScale));
          const neededRam = neededRamRaw <= 2 ? 2 : neededRamRaw <= 4 ? 4 : neededRamRaw <= 8 ? 8 : neededRamRaw <= 16 ? 16 : 32;
          const neededVcpu = neededRam <= 2 ? minVcpu : neededRam <= 4 ? recVcpu : neededRam <= 8 ? Math.max(2, recVcpu) : 4;
          const neededStorage = neededRam <= 4 ? minStorage * 2 : minStorage * 4;

          let lowestVpsMo = 999;
          document.querySelectorAll('.vps-card').forEach(card => {
            try {
              const plans = JSON.parse(card.dataset.plans);
              const match = plans.find(p => p.ramGb >= neededRam) || plans[plans.length - 1];
              if (match.monthlyUsd < lowestVpsMo) lowestVpsMo = match.monthlyUsd;
              card.querySelector('[data-role="plan-price"]').textContent = '$' + match.monthlyUsd.toFixed(2);
              card.querySelector('[data-role="plan-specs"]').innerHTML =
                'Matched Tier: <strong>' + match.name + '</strong> (' + match.vcpu + ' vCPU · ' + match.ramGb + 'GB RAM · ' + match.storageGb + 'GB NVMe)';
            } catch (e) {}
          });

          const annualSavings = Math.max(0, Math.round((saasMo - lowestVpsMo) * 12));

          document.getElementById('saas-monthly-val').textContent = '$' + saasMo.toLocaleString();
          document.getElementById('saas-annual-val').textContent = '$' + (saasMo * 12).toLocaleString() + ' billed annually';
          document.getElementById('managed-monthly-val').textContent = '$' + managedMo.toLocaleString();
          document.getElementById('managed-annual-val').textContent = '$' + (managedMo * 12).toLocaleString() + '/yr · Hosted by creators';
          document.getElementById('selfhost-monthly-val').textContent = '$' + lowestVpsMo.toFixed(2);
          document.getElementById('selfhost-specs-val').innerHTML =
            'Recommended VPS: <strong>' + neededVcpu + ' vCPU / ' + neededRam + 'GB RAM / ' + neededStorage + 'GB NVMe</strong>';
          document.getElementById('annual-savings-display').textContent = '$' + annualSavings.toLocaleString() + '/yr';

          const maxVal = Math.max(saasMo, managedMo, lowestVpsMo, 1);
          document.getElementById('saas-bar-fill').style.width = Math.max(8, Math.round((saasMo / maxVal) * 100)) + '%';
          document.getElementById('managed-bar-fill').style.width = Math.max(8, Math.round((managedMo / maxVal) * 100)) + '%';
          document.getElementById('selfhost-bar-fill').style.width = Math.max(6, Math.round((lowestVpsMo / maxVal) * 100)) + '%';
        }

        slider.addEventListener('input', update);
        update();
      })();
    </script>
  `;

  return renderLayout({
    title: `Self-Host ${tool.name} Cost Calculator & VPS Requirements vs ${calc.saasName} (2026)`,
    description: `Calculate exact monthly savings when self-hosting ${tool.name} vs ${calc.saasName}. Compare Docker VPS RAM/CPU requirements, 1-click hosting plans, and ${calc.managedName} pricing.`,
    canonicalPath: `/self-host/${tool.slug}/`,
    siteConfig: affiliates.site,
    jsonLd: faqSchema,
    bodyContent,
    activeNav: 'directory'
  });
}

function renderSaasAlternativePage(saasName, saasSlug, matchingTools, affiliates, lastUpdatedDate) {
  const base = affiliates.site.basePath || '';
  const primaryTool = matchingTools[0];
  const bodyContent = `
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="${base}/">Home</a> <span>/</span>
          <span>Open-Source ${escapeHtml(saasName)} Alternatives</span>
        </div>
        <span class="pill-badge">Verified ${escapeHtml(lastUpdatedDate)} · Self-Hosted & Open Source</span>
        <h1>Best Open-Source Self-Hosted Alternatives to ${escapeHtml(saasName)} in 2026</h1>
        <p class="lead">
          Stop paying escalating per-seat and per-usage SaaS taxes for ${escapeHtml(saasName)}. Compare the top ${matchingTools.length} open-source replacements you can self-host on a $5–$10/mo VPS with full data ownership.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="tool-grid">
          ${matchingTools
            .map(
              (t, idx) => `
            <div class="card alternative-card">
              <div class="alt-card-head">
                <div>
                  <span class="pill-badge">#${idx + 1} Best Replacement</span>
                  <h2><a href="${base}/self-host/${escapeHtml(t.slug)}/">${escapeHtml(t.name)}</a></h2>
                  <p class="alt-tagline">${escapeHtml(t.tagline)}</p>
                </div>
                <div class="gh-mini">
                  <strong>⭐ ${t.githubStats.stars.toLocaleString()}</strong>
                  <span>${escapeHtml(t.license)}</span>
                </div>
              </div>
              <p>${escapeHtml(t.shortDescription)}</p>
              <div class="alt-metrics">
                <div><span>Min VPS RAM</span><strong>${t.vpsRequirements.minRamGb} GB</strong></div>
                <div><span>Rec. VPS RAM</span><strong>${t.vpsRequirements.recRamGb} GB</strong></div>
                <div><span>Setup Time</span><strong>~${t.setupTimeMinutes} mins</strong></div>
                <div><span>Est. VPS Cost</span><strong class="text-emerald">From $4.99/mo</strong></div>
              </div>
              <div class="alt-actions">
                <a href="${base}/self-host/${escapeHtml(t.slug)}/" class="btn btn-primary">Open ${escapeHtml(t.name)} Savings Calculator →</a>
                <a href="${base}/go/${escapeHtml(t.affiliateKey)}/" target="_blank" rel="nofollow sponsored noopener" class="btn btn-secondary">Try Official Cloud</a>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <h2>Recommended 1-Click VPS Hosting for ${escapeHtml(saasName)} Replacements</h2>
          <p>Deploy ${escapeHtml(primaryTool.name)} and other open-source tools in under 5 minutes with pre-configured Docker & Coolify templates.</p>
        </div>
        ${renderVpsCards(affiliates.vpsProviders, base, primaryTool.vpsRequirements.recRamGb)}
      </div>
    </section>
  `;

  return renderLayout({
    title: `Best Self-Hosted Open-Source ${saasName} Alternatives (2026 Cost Comparison)`,
    description: `Compare the best open-source, self-hosted alternatives to ${saasName} including ${matchingTools.map((t) => t.name).join(', ')}. Calculate your exact VPS hosting cost vs ${saasName} pricing.`,
    canonicalPath: `/alternatives-to/${saasSlug}/`,
    siteConfig: affiliates.site,
    bodyContent,
    activeNav: 'directory'
  });
}

function renderComparisonPage(toolA, toolB, affiliates, lastUpdatedDate) {
  const base = affiliates.site.basePath || '';
  const compSlug = `${toolA.slug}-vs-${toolB.slug}`;
  const recRam = Math.max(toolA.vpsRequirements.recRamGb, toolB.vpsRequirements.recRamGb);

  const bodyContent = `
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="${base}/">Home</a> <span>/</span>
          <span>Compare</span> <span>/</span>
          <span>${escapeHtml(toolA.name)} vs ${escapeHtml(toolB.name)}</span>
        </div>
        <span class="pill-badge">Head-to-Head Benchmark · Updated ${escapeHtml(lastUpdatedDate)}</span>
        <h1>${escapeHtml(toolA.name)} vs. ${escapeHtml(toolB.name)}: Self-Hosted Cost, RAM & Feature Comparison</h1>
        <p class="lead">
          Trying to choose between ${escapeHtml(toolA.name)} and ${escapeHtml(toolB.name)}? Compare live GitHub popularity, Docker memory consumption, licensing, and total cost of ownership.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="card">
          <table class="data-table compare-matrix">
            <thead>
              <tr>
                <th>Metric / Specification</th>
                <th><a href="${base}/self-host/${escapeHtml(toolA.slug)}/">${escapeHtml(toolA.name)}</a></th>
                <th><a href="${base}/self-host/${escapeHtml(toolB.slug)}/">${escapeHtml(toolB.name)}</a></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Category</strong></td>
                <td>${escapeHtml(toolA.category)}</td>
                <td>${escapeHtml(toolB.category)}</td>
              </tr>
              <tr>
                <td><strong>GitHub Stars</strong></td>
                <td>⭐ ${toolA.githubStats.stars.toLocaleString()}</td>
                <td>⭐ ${toolB.githubStats.stars.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Open-Source License</strong></td>
                <td>${escapeHtml(toolA.license)}</td>
                <td>${escapeHtml(toolB.license)}</td>
              </tr>
              <tr>
                <td><strong>Minimum VPS RAM</strong></td>
                <td>${toolA.vpsRequirements.minRamGb} GB (${toolA.vpsRequirements.minVcpu} vCPU)</td>
                <td>${toolB.vpsRequirements.minRamGb} GB (${toolB.vpsRequirements.minVcpu} vCPU)</td>
              </tr>
              <tr>
                <td><strong>Recommended Production RAM</strong></td>
                <td><strong>${toolA.vpsRequirements.recRamGb} GB (${toolA.vpsRequirements.recVcpu} vCPU)</strong></td>
                <td><strong>${toolB.vpsRequirements.recRamGb} GB (${toolB.vpsRequirements.recVcpu} vCPU)</strong></td>
              </tr>
              <tr>
                <td><strong>Estimated Setup Time</strong></td>
                <td>~${toolA.setupTimeMinutes} mins (${escapeHtml(toolA.setupDifficulty)})</td>
                <td>~${toolB.setupTimeMinutes} mins (${escapeHtml(toolB.setupDifficulty)})</td>
              </tr>
              <tr>
                <td><strong>Replaces Paid SaaS</strong></td>
                <td>${escapeHtml(toolA.replaces.join(', '))}</td>
                <td>${escapeHtml(toolB.replaces.join(', '))}</td>
              </tr>
              <tr>
                <td><strong>Interactive TCO Calculator</strong></td>
                <td><a href="${base}/self-host/${escapeHtml(toolA.slug)}/" class="btn btn-primary btn-sm">${escapeHtml(toolA.name)} Calculator →</a></td>
                <td><a href="${base}/self-host/${escapeHtml(toolB.slug)}/" class="btn btn-primary btn-sm">${escapeHtml(toolB.name)} Calculator →</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <h2>Best VPS Servers to Run Both ${escapeHtml(toolA.name)} & ${escapeHtml(toolB.name)}</h2>
          <p>You can run both tools together on a single VPS using Docker Compose or Coolify.</p>
        </div>
        ${renderVpsCards(affiliates.vpsProviders, base, recRam)}
      </div>
    </section>
  `;

  return renderLayout({
    title: `${toolA.name} vs ${toolB.name} (2026): Self-Hosted RAM, Cost & Feature Comparison`,
    description: `Side-by-side comparison of ${toolA.name} (${toolA.githubStats.stars.toLocaleString()} GitHub stars) and ${toolB.name} (${toolB.githubStats.stars.toLocaleString()} GitHub stars). Compare VPS RAM requirements, Docker setup, and cloud pricing.`,
    canonicalPath: `/compare/${compSlug}/`,
    siteConfig: affiliates.site,
    bodyContent,
    activeNav: 'compare'
  });
}

function renderHomePage(tools, comparisons, saasMap, affiliates, lastUpdatedDate) {
  const base = affiliates.site.basePath || '';

  const stackClientData = tools.map((t) => ({
    slug: t.slug,
    name: t.name,
    saasName: t.calculator.saasName,
    replaces: t.replaces[0],
    category: t.category,
    defaultSaasMo: Math.round(
      t.calculator.saasBaseUsd +
        Math.max(0, t.calculator.defaultUnits - t.calculator.saasIncludedUnits) *
          t.calculator.saasPerUnitUsd
    ),
    saasBaseUsd: t.calculator.saasBaseUsd,
    saasPerUnitUsd: t.calculator.saasPerUnitUsd,
    recRamGb: t.vpsRequirements.recRamGb,
    minRamGb: t.vpsRequirements.minRamGb
  }));

  const bodyContent = `
    <section class="hero">
      <div class="container">
        <span class="pill-badge">⚡ Live 2026 SaaS vs. Self-Hosted TCO Engine · Updated ${escapeHtml(lastUpdatedDate)}</span>
        <h1>Stop Paying the <span class="text-gradient">$25,000/yr SaaS Tax</span>.<br/>Calculate Your Self-Hosted Stack Savings.</h1>
        <p class="lead">
          Select the Cloud SaaS subscriptions you currently pay for below. Our calculator sizes the exact consolidated Linux VPS you need to replace them with open-source Docker alternatives.
        </p>
      </div>
    </section>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="calc-card master-calc">
          <div class="calc-header">
            <div>
              <h2>1. Select Your Current Paid Cloud SaaS Tools</h2>
              <p>Click to toggle the tools your team or business uses. Adjust the team size multiplier to model your annual savings.</p>
            </div>
            <div class="team-multiplier-box">
              <label for="team-scale-slider">Team / Workload Scale: <strong id="team-scale-label">1.0x (Standard Team)</strong></label>
              <input type="range" id="team-scale-slider" min="0.5" max="4.0" step="0.5" value="1.0" />
            </div>
          </div>

          <div class="stack-selector-grid" id="stack-selector">
            ${stackClientData
              .slice(0, 12)
              .map(
                (item, idx) => `
              <button type="button" class="stack-toggle ${idx < 4 ? 'active' : ''}"
                data-slug="${escapeHtml(item.slug)}"
                data-saas-mo="${item.defaultSaasMo}"
                data-ram="${item.minRamGb}">
                <div class="st-top">
                  <span class="st-saas">Replace ${escapeHtml(item.replaces)}</span>
                  <span class="st-check">✓</span>
                </div>
                <div class="st-name">${escapeHtml(item.name)}</div>
                <div class="st-cost">Saves ~$${item.defaultSaasMo}/mo</div>
              </button>
            `
              )
              .join('')}
          </div>

          <div class="master-summary-bar">
            <div class="ms-metric">
              <span>Current Cloud SaaS Burn</span>
              <strong class="text-danger" id="master-saas-mo">$820/mo</strong>
              <small id="master-saas-yr">$9,840 / year</small>
            </div>
            <div class="ms-metric">
              <span>Consolidated VPS Hardware Needed</span>
              <strong id="master-vps-specs">4 vCPU / 8GB RAM</strong>
              <small>Runs all selected containers via Coolify/Docker</small>
            </div>
            <div class="ms-metric">
              <span>Self-Hosted VPS Cost</span>
              <strong class="text-emerald" id="master-vps-mo">$6.99/mo</strong>
              <small id="master-vps-yr">$83.88 / year</small>
            </div>
            <div class="ms-metric ms-highlight">
              <span>Net Annual Savings</span>
              <strong class="text-emerald" id="master-net-savings">$9,756/yr</strong>
              <a href="#vps-benchmarks" class="btn btn-primary btn-sm">Deploy Consolidated VPS ↓</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="vps-benchmarks">
      <div class="container">
        <div class="section-head">
          <h2>2. Best 1-Click Docker & Self-Hosting VPS Providers (2026 Benchmarks)</h2>
          <p>Automatically matched to your selected stack above. Includes instant 1-click templates for Coolify, n8n, Supabase, and Docker Compose.</p>
        </div>
        ${renderVpsCards(affiliates.vpsProviders, base, 8)}
      </div>
    </section>

    <section class="section" id="directory">
      <div class="container">
        <div class="section-head-flex">
          <div>
            <h2>3. Open-Source Self-Hosted Calculators (${tools.length} Verified Apps)</h2>
            <p>Click any tool for an interactive workload cost calculator, Docker quickstart command, and hardware sizing matrix.</p>
          </div>
          <div class="filter-box">
            <input type="search" id="tool-search" placeholder="Search n8n, Zapier, Notion, Analytics..." aria-label="Search tools" />
          </div>
        </div>

        <div class="tool-grid" id="directory-grid">
          ${tools
            .map(
              (t) => `
            <a href="${base}/self-host/${escapeHtml(t.slug)}/" class="tool-card" data-search="${escapeHtml((t.name + ' ' + t.category + ' ' + t.replaces.join(' ') + ' ' + t.shortDescription).toLowerCase())}">
              <div class="tool-card-top">
                <span class="pill-sm">${escapeHtml(t.category)}</span>
                <span class="star-badge">⭐ ${(t.githubStats.stars / 1000).toFixed(1)}k</span>
              </div>
              <h3>${escapeHtml(t.name)}</h3>
              <p>${escapeHtml(t.shortDescription)}</p>
              <div class="replaces-inline">Replaces: <strong>${escapeHtml(t.replaces.join(', '))}</strong></div>
              <div class="tool-card-foot">
                <span>RAM: ${t.vpsRequirements.minRamGb}–${t.vpsRequirements.recRamGb}GB</span>
                <span class="text-emerald">Open Calculator →</span>
              </div>
            </a>
          `
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="section section-alt" id="comparisons">
      <div class="container grid-2">
        <div>
          <h2>Browse by Paid SaaS to Replace</h2>
          <p style="margin-bottom: 1rem; color: var(--muted);">Looking to cancel a specific SaaS bill? View open-source replacements:</p>
          <div class="tag-cloud">
            ${Array.from(saasMap.entries())
              .map(
                ([slug, info]) =>
                  `<a href="${base}/alternatives-to/${escapeHtml(slug)}/" class="tag-link">${escapeHtml(info.name)} Alternatives (${info.tools.length})</a>`
              )
              .join('')}
          </div>
        </div>
        <div>
          <h2>Head-to-Head Open-Source Benchmarks</h2>
          <p style="margin-bottom: 1rem; color: var(--muted);">Compare RAM usage, GitHub velocity, and licensing side-by-side:</p>
          <div class="tag-cloud">
            ${comparisons
              .map(
                ([a, b]) =>
                  `<a href="${base}/compare/${escapeHtml(a.slug)}-vs-${escapeHtml(b.slug)}/" class="tag-link">${escapeHtml(a.name)} vs ${escapeHtml(b.name)}</a>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <script>
      (function() {
        const toggles = document.querySelectorAll('.stack-toggle');
        const scaleSlider = document.getElementById('team-scale-slider');
        const scaleLabel = document.getElementById('team-scale-label');

        function recalcMaster() {
          const mult = parseFloat(scaleSlider.value || '1');
          scaleLabel.textContent = mult.toFixed(1) + 'x Workload Scale';

          let totalSaasMo = 0;
          let totalRamRaw = 1; // base OS overhead
          toggles.forEach(btn => {
            if (btn.classList.contains('active')) {
              totalSaasMo += Math.round(parseFloat(btn.dataset.saasMo) * mult);
              totalRamRaw += parseFloat(btn.dataset.ram) * 0.75;
            }
          });

          const neededRam = totalRamRaw <= 2 ? 2 : totalRamRaw <= 4 ? 4 : totalRamRaw <= 8 ? 8 : totalRamRaw <= 16 ? 16 : 32;
          const neededVcpu = neededRam <= 2 ? 1 : neededRam <= 4 ? 2 : neededRam <= 8 ? 4 : 8;

          let bestVpsMo = 6.99;
          document.querySelectorAll('.vps-card').forEach(card => {
            try {
              const plans = JSON.parse(card.dataset.plans);
              const match = plans.find(p => p.ramGb >= neededRam) || plans[plans.length - 1];
              if (card.dataset.providerId === 'hostinger') bestVpsMo = match.monthlyUsd;
              card.querySelector('[data-role="plan-price"]').textContent = '$' + match.monthlyUsd.toFixed(2);
              card.querySelector('[data-role="plan-specs"]').innerHTML =
                'Matched Tier: <strong>' + match.name + '</strong> (' + match.vcpu + ' vCPU · ' + match.ramGb + 'GB RAM · ' + match.storageGb + 'GB NVMe)';
            } catch (e) {}
          });

          const netAnnual = Math.max(0, Math.round((totalSaasMo - bestVpsMo) * 12));
          document.getElementById('master-saas-mo').textContent = '$' + totalSaasMo.toLocaleString() + '/mo';
          document.getElementById('master-saas-yr').textContent = '$' + (totalSaasMo * 12).toLocaleString() + ' / year';
          document.getElementById('master-vps-specs').textContent = neededVcpu + ' vCPU / ' + neededRam + 'GB RAM';
          document.getElementById('master-vps-mo').textContent = '$' + bestVpsMo.toFixed(2) + '/mo';
          document.getElementById('master-vps-yr').textContent = '$' + (bestVpsMo * 12).toFixed(2) + ' / year';
          document.getElementById('master-net-savings').textContent = '$' + netAnnual.toLocaleString() + '/yr';
        }

        toggles.forEach(btn => {
          btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            recalcMaster();
          });
        });
        if (scaleSlider) scaleSlider.addEventListener('input', recalcMaster);
        recalcMaster();

        const searchInput = document.getElementById('tool-search');
        if (searchInput) {
          searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();
            document.querySelectorAll('#directory-grid .tool-card').forEach(card => {
              card.style.display = card.dataset.search.includes(q) ? '' : 'none';
            });
          });
        }
      })();
    </script>
  `;

  return renderLayout({
    title: `${affiliates.site.name} — Self-Hosted vs. Cloud SaaS Cost Calculator & VPS Sizing Directory (2026)`,
    description:
      'Interactive SaaS vs. Self-Hosted Open-Source cost calculator. Compare Docker VPS RAM requirements, live GitHub stars, and 1-click deployment costs for n8n, Coolify, Supabase, Plausible, and 20+ tools.',
    canonicalPath: '/',
    siteConfig: affiliates.site,
    bodyContent,
    activeNav: 'home'
  });
}

function renderCategoryPage(catName, catSlug, catTools, affiliates, lastUpdatedDate) {
  const base = affiliates.site.basePath || '';
  const bodyContent = `
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="${base}/">Home</a> <span>/</span>
          <span>${escapeHtml(catName)}</span>
        </div>
        <span class="pill-badge">Category Hub · Updated ${escapeHtml(lastUpdatedDate)}</span>
        <h1>Best Self-Hosted Open-Source ${escapeHtml(catName)} Software (2026)</h1>
        <p class="lead">Compare VPS RAM requirements, Docker setup commands, and annual cloud savings across the top ${catTools.length} open-source ${escapeHtml(catName.toLowerCase())} platforms.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="tool-grid">
          ${catTools
            .map(
              (t) => `
            <a href="${base}/self-host/${escapeHtml(t.slug)}/" class="tool-card">
              <div class="tool-card-top">
                <span class="pill-sm">${escapeHtml(t.license)}</span>
                <span class="star-badge">⭐ ${(t.githubStats.stars / 1000).toFixed(1)}k</span>
              </div>
              <h3>${escapeHtml(t.name)}</h3>
              <p>${escapeHtml(t.shortDescription)}</p>
              <div class="replaces-inline">Replaces: <strong>${escapeHtml(t.replaces.join(', '))}</strong></div>
              <div class="tool-card-foot">
                <span>Rec. RAM: ${t.vpsRequirements.recRamGb}GB</span>
                <span class="text-emerald">Calculate Savings →</span>
              </div>
            </a>
          `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
  return renderLayout({
    title: `Best Self-Hosted ${catName} Tools & Cost Calculators (2026)`,
    description: `Compare self-hosted open-source ${catName} tools including ${catTools.map((t) => t.name).join(', ')}. View VPS hardware specs and SaaS cost comparisons.`,
    canonicalPath: `/category/${catSlug}/`,
    siteConfig: affiliates.site,
    bodyContent,
    activeNav: 'directory'
  });
}

function renderRedirectPage(id, targetUrl, siteConfig) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
  <title>Redirecting to Partner Offer | ${escapeHtml(siteConfig.name)}</title>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body style="font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="text-align:center;">
    <p>Redirecting you to the official partner page...</p>
    <p><a href="${escapeHtml(targetUrl)}" style="color:#10b981;">Click here if you are not redirected automatically</a></p>
  </div>
</body>
</html>`;
}

function generateCss() {
  return `:root {
  --bg: #0b0f19;
  --bg-alt: #111827;
  --card: #161f33;
  --card-border: #26334d;
  --text: #f8fafc;
  --muted: #94a3b8;
  --emerald: #10b981;
  --emerald-dark: #059669;
  --amber: #f59e0b;
  --danger: #ef4444;
  --indigo: #6366f1;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}
a { color: inherit; text-decoration: none; }
.container { max-width: 1180px; margin: 0 auto; padding: 0 1.25rem; }
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(11, 15, 25, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--card-border);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4.25rem;
  gap: 1rem;
}
.brand { display: flex; align-items: center; gap: 0.55rem; font-weight: 800; font-size: 1.2rem; }
.brand-icon { font-size: 1.35rem; }
.brand-badge {
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.15);
  color: var(--emerald);
  border: 1px solid rgba(16, 185, 129, 0.35);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}
.main-nav { display: flex; gap: 1.5rem; font-size: 0.95rem; color: var(--muted); }
.main-nav a:hover, .main-nav a.active { color: var(--emerald); }

.hero { padding: 4rem 0 2.5rem; text-align: center; }
.hero h1 { font-size: clamp(2rem, 4.2vw, 3.25rem); line-height: 1.15; margin: 0.85rem auto; max-width: 900px; font-weight: 800; }
.hero-sub { padding: 2.75rem 0 2rem; border-bottom: 1px solid var(--card-border); background: var(--bg-alt); }
.hero-sub h1 { font-size: clamp(1.75rem, 3.4vw, 2.5rem); line-height: 1.2; margin: 0.65rem 0; font-weight: 800; }
.lead { color: var(--muted); font-size: 1.1rem; max-width: 780px; }
.hero .lead { margin: 0 auto; }
.text-gradient {
  background: linear-gradient(90deg, #ef4444, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.text-emerald { color: var(--emerald) !important; }
.text-amber { color: var(--amber) !important; }
.text-danger { color: var(--danger) !important; }

.pill-badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--emerald);
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.28rem 0.75rem;
  border-radius: 999px;
}
.breadcrumbs { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.85rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.breadcrumbs a:hover { color: var(--emerald); }
.hero-title-row { display: grid; grid-template-columns: 1fr 310px; gap: 2rem; align-items: center; }

.github-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 1.15rem;
}
.gh-title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 0.65rem; }
.gh-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; }
.gh-stats strong { display: block; font-size: 0.95rem; }
.gh-stats span { font-size: 0.75rem; color: var(--muted); }
.gh-updated { font-size: 0.75rem; color: var(--muted); margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px solid var(--card-border); }
.gh-updated a { color: var(--emerald); }

.section { padding: 3rem 0; }
.section-alt { background: var(--bg-alt); border-top: 1px solid var(--card-border); border-bottom: 1px solid var(--card-border); }
.section-head { margin-bottom: 2rem; }
.section-head h2 { font-size: 1.75rem; margin-bottom: 0.4rem; }
.section-head p { color: var(--muted); }
.section-head-flex { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
.filter-box input {
  background: var(--card);
  border: 1px solid var(--card-border);
  color: var(--text);
  padding: 0.65rem 1rem;
  border-radius: 8px;
  min-width: 280px;
  font-size: 0.95rem;
}

.calc-card, .card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}
.calc-header { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.calc-header h2 { font-size: 1.45rem; }
.calc-header p { color: var(--muted); font-size: 0.95rem; }
.savings-pill {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid var(--emerald);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  text-align: right;
}
.savings-pill span { display: block; font-size: 0.78rem; color: var(--muted); text-transform: uppercase; }
.savings-pill strong { font-size: 1.65rem; color: var(--emerald); }

.slider-box {
  background: rgba(11, 15, 25, 0.55);
  border: 1px solid var(--card-border);
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.slider-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; font-weight: 600; }
.slider-current-val { color: var(--emerald); font-size: 1.2rem; font-weight: 800; }
input[type="range"] { width: 100%; accent-color: var(--emerald); cursor: pointer; height: 8px; }
.slider-ticks { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--muted); margin-top: 0.45rem; }

.comparison-bars { display: grid; gap: 1rem; }
.bar-card {
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 1.15rem 1.35rem;
}
.bar-selfhost { border-color: var(--emerald); background: rgba(16, 185, 129, 0.06); }
.bar-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
.bar-tag { font-size: 0.74rem; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.badge-success { color: var(--emerald); }
.bar-price strong { font-size: 1.55rem; }
.bar-price span { color: var(--muted); font-size: 0.9rem; }
.bar-meter { height: 10px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-bottom: 0.6rem; }
.bar-fill { height: 100%; border-radius: 999px; transition: width 0.2s ease; }
.bar-fill-danger { background: linear-gradient(90deg, #f97316, #ef4444); }
.bar-fill-warn { background: linear-gradient(90deg, #eab308, #f59e0b); }
.bar-fill-success { background: linear-gradient(90deg, #34d399, #10b981); }
.bar-Sub, .bar-footer-row { font-size: 0.85rem; color: var(--muted); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.link-cta { font-weight: 700; color: var(--amber); }

.vps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1.25rem; }
.vps-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.vps-card-featured { border: 2px solid var(--emerald); box-shadow: 0 0 25px rgba(16, 185, 129, 0.15); }
.vps-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.85rem; }
.vps-badge { font-size: 0.72rem; font-weight: 700; color: var(--emerald); background: rgba(16, 185, 129, 0.14); padding: 0.2rem 0.55rem; border-radius: 6px; display: inline-block; margin-bottom: 0.35rem; }
.vps-name { font-size: 1.15rem; }
.vps-price-val { font-size: 1.5rem; font-weight: 800; color: var(--emerald); }
.vps-price-period { font-size: 0.82rem; color: var(--muted); }
.vps-matched-plan {
  background: rgba(11, 15, 25, 0.65);
  border: 1px solid var(--card-border);
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  font-size: 0.83rem;
  margin-bottom: 0.9rem;
}
.vps-features { list-style: none; font-size: 0.86rem; color: var(--muted); margin-bottom: 1.2rem; display: grid; gap: 0.4rem; }
.btn {
  display: inline-block;
  text-align: center;
  padding: 0.75rem 1.1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.92rem;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.btn:hover { transform: translateY(-1px); opacity: 0.95; }
.btn-primary { background: var(--emerald); color: #052e16; }
.btn-secondary { background: #1e293b; color: var(--text); border: 1px solid var(--card-border); }
.btn-sm { padding: 0.45rem 0.85rem; font-size: 0.82rem; }

.stack-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}
.stack-toggle {
  background: rgba(11, 15, 25, 0.65);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}
.stack-toggle.active {
  border-color: var(--emerald);
  background: rgba(16, 185, 129, 0.12);
}
.st-top { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem; }
.stack-toggle.active .st-check { color: var(--emerald); font-weight: 800; }
.st-name { font-weight: 700; font-size: 1.05rem; }
.st-cost { font-size: 0.8rem; color: var(--emerald); margin-top: 0.2rem; }

.master-summary-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  background: rgba(11, 15, 25, 0.85);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 1.25rem;
  align-items: center;
}
.ms-metric span { display: block; font-size: 0.76rem; text-transform: uppercase; color: var(--muted); }
.ms-metric strong { display: block; font-size: 1.45rem; margin: 0.15rem 0; }
.ms-metric small { font-size: 0.78rem; color: var(--muted); }

.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; }
.code-block {
  background: #050811;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin: 0.9rem 0 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
}
.code-block code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.82rem; color: #34d399; white-space: nowrap; }
.copy-btn { background: #1e293b; color: var(--text); border: 1px solid var(--card-border); padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; flex-shrink: 0; }

.data-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.9rem; }
.data-table th, .data-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--card-border); text-align: left; }
.data-table th { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; }

.check-list, .warn-list { list-style: none; display: grid; gap: 0.55rem; margin-top: 0.6rem; font-size: 0.92rem; }
.check-list li::before { content: "✓ "; color: var(--emerald); font-weight: bold; }
.warn-list li::before { content: "• "; color: var(--amber); font-weight: bold; }

.tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.2rem; }
.tool-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.tool-card:hover { border-color: var(--emerald); transform: translateY(-2px); }
.tool-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
.pill-sm { font-size: 0.72rem; color: var(--muted); background: rgba(255,255,255,0.05); padding: 0.18rem 0.55rem; border-radius: 999px; }
.star-badge { font-size: 0.8rem; font-weight: 700; color: var(--amber); }
.tool-card h3 { font-size: 1.2rem; margin-bottom: 0.4rem; }
.tool-card p { font-size: 0.88rem; color: var(--muted); margin-bottom: 0.85rem; }
.replaces-inline { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.85rem; }
.tool-card-foot { display: flex; justify-content: space-between; font-size: 0.82rem; padding-top: 0.75rem; border-top: 1px solid var(--card-border); font-weight: 600; }

.tag-cloud, .tag-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.tag-link {
  background: var(--card);
  border: 1px solid var(--card-border);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.82rem;
  color: var(--muted);
}
.tag-link:hover { border-color: var(--emerald); color: var(--emerald); }
.replaces-box { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--card-border); font-size: 0.85rem; }

.alt-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.alt-tagline { color: var(--emerald); font-size: 0.88rem; font-weight: 600; }
.alt-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; background: rgba(11,15,25,0.55); padding: 0.85rem; border-radius: 10px; margin: 1rem 0; font-size: 0.83rem; }
.alt-metrics span { display: block; color: var(--muted); font-size: 0.74rem; }
.alt-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; }

.site-footer { background: #070a12; border-top: 1px solid var(--card-border); padding: 3.5rem 0 2rem; margin-top: 3rem; color: var(--muted); font-size: 0.88rem; }
.footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 2.5rem; margin-bottom: 2.5rem; }
.footer-brand { color: var(--text); margin-bottom: 0.75rem; }
.footer-desc { margin-bottom: 1rem; }
.disclosure { font-size: 0.78rem; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--card-border); }
.site-footer h4 { color: var(--text); margin-bottom: 0.85rem; font-size: 0.95rem; }
.footer-links { list-style: none; display: grid; gap: 0.45rem; }
.footer-links a:hover { color: var(--emerald); }
.footer-bottom { display: flex; justify-content: space-between; padding-top: 1.5rem; border-top: 1px solid var(--card-border); font-size: 0.8rem; flex-wrap: wrap; gap: 1rem; }

@media (max-width: 820px) {
  .hero-title-row, .footer-grid { grid-template-columns: 1fr; }
  .main-nav { display: none; }
}
`;
}

async function main() {
  console.log('🏗️ Building Programmatic SEO static site...');
  const tools = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'tools.json'), 'utf8'));
  const affiliates = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'affiliates.json'), 'utf8'));

  let lastUpdatedDate = new Date().toISOString().slice(0, 10);
  try {
    const meta = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'last-updated.json'), 'utf8'));
    if (meta.lastUpdatedDate) lastUpdatedDate = meta.lastUpdatedDate;
  } catch {}

  await ensureDir(DIST_DIR);
  await writePage('assets/styles.css', generateCss());

  const sitemapUrls = ['/'];

  // 1. Build SaaS Alternative Map
  const saasMap = new Map();
  for (const tool of tools) {
    for (const saasName of tool.replaces) {
      const sSlug = slugify(saasName);
      if (!saasMap.has(sSlug)) {
        saasMap.set(sSlug, { name: saasName, slug: sSlug, tools: [] });
      }
      saasMap.get(sSlug).tools.push(tool);
    }
  }

  // 2. Build Category Map
  const categoryMap = new Map();
  for (const tool of tools) {
    if (!categoryMap.has(tool.categorySlug)) {
      categoryMap.set(tool.categorySlug, { name: tool.category, slug: tool.categorySlug, tools: [] });
    }
    categoryMap.get(tool.categorySlug).tools.push(tool);
  }

  // 3. Build Head-to-Head Comparisons within categories + popular cross-pairs
  const comparisons = [];
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      if (tools[i].categorySlug === tools[j].categorySlug) {
        comparisons.push([tools[i], tools[j]]);
      }
    }
  }

  // 4. Write Individual Self-Host Calculator Pages
  for (const tool of tools) {
    const html = renderToolCalculatorPage(tool, tools, affiliates, lastUpdatedDate);
    await writePage(`self-host/${tool.slug}/index.html`, html);
    sitemapUrls.push(`/self-host/${tool.slug}/`);
  }

  // 5. Write SaaS Alternatives Pages
  for (const [sSlug, info] of saasMap.entries()) {
    const html = renderSaasAlternativePage(info.name, sSlug, info.tools, affiliates, lastUpdatedDate);
    await writePage(`alternatives-to/${sSlug}/index.html`, html);
    sitemapUrls.push(`/alternatives-to/${sSlug}/`);
  }

  // 6. Write Head-to-Head Comparison Pages
  for (const [toolA, toolB] of comparisons) {
    const compSlug = `${toolA.slug}-vs-${toolB.slug}`;
    const html = renderComparisonPage(toolA, toolB, affiliates, lastUpdatedDate);
    await writePage(`compare/${compSlug}/index.html`, html);
    sitemapUrls.push(`/compare/${compSlug}/`);
  }

  // 7. Write Category Hub Pages
  for (const [cSlug, cat] of categoryMap.entries()) {
    const html = renderCategoryPage(cat.name, cSlug, cat.tools, affiliates, lastUpdatedDate);
    await writePage(`category/${cSlug}/index.html`, html);
    sitemapUrls.push(`/category/${cSlug}/`);
  }

  // 8. Write Outbound Affiliate Cloaker Redirect Pages (/go/[id]/)
  for (const vps of affiliates.vpsProviders) {
    const html = renderRedirectPage(vps.id, vps.affiliateUrl, affiliates.site);
    await writePage(`go/${vps.id}/index.html`, html);
  }
  for (const [key, url] of Object.entries(affiliates.saasAffiliates)) {
    const html = renderRedirectPage(key, url, affiliates.site);
    await writePage(`go/${key}/index.html`, html);
  }

  // 9. Write Home Page
  const homeHtml = renderHomePage(tools, comparisons, saasMap, affiliates, lastUpdatedDate);
  await writePage('index.html', homeHtml);

  // 10. Write sitemap.xml, robots.txt, and llms.txt
  const domain = affiliates.site.domain.replace(/\/$/, '') + (affiliates.site.basePath || '');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) => `  <url>
    <loc>${escapeHtml(domain + u)}</loc>
    <lastmod>${lastUpdatedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  await writePage('sitemap.xml', sitemapXml);

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /go/
Sitemap: ${domain}/sitemap.xml
`;
  await writePage('robots.txt', robotsTxt);

  const llmsTxt = `# ${affiliates.site.name} — ${affiliates.site.tagline}

> Automated open-source self-hosting vs. Cloud SaaS total cost of ownership (TCO) calculators and VPS hardware sizing guides. Last updated: ${lastUpdatedDate}.

## Self-Host Cost & VPS Sizing Calculators
${tools.map((t) => `- [Self-Host ${t.name} Cost & VPS Specs](${domain}/self-host/${t.slug}/): Replaces ${t.replaces.join(', ')}. Min RAM: ${t.vpsRequirements.minRamGb}GB, Rec RAM: ${t.vpsRequirements.recRamGb}GB.`).join('\n')}

## Open-Source SaaS Alternatives
${Array.from(saasMap.values()).map((s) => `- [Open-Source ${s.name} Alternatives](${domain}/alternatives-to/${s.slug}/)`).join('\n')}
`;
  await writePage('llms.txt', llmsTxt);

  console.log(`✅ Generated ${sitemapUrls.length} SEO content pages + affiliate redirects + sitemap.xml + llms.txt in /dist!`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
