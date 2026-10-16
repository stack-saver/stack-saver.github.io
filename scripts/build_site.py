import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DIST_DIR = ROOT_DIR / "dist"


def slugify(text: str) -> str:
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))


def esc(val) -> str:
    return html.escape(str(val if val is not None else ""), quote=True)


def write_page(rel_path: str, content: str) -> None:
    full_path = DIST_DIR / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")


def render_layout(title, description, canonical_path, site_config, body_content, json_ld=None, active_nav=""):
    base = site_config.get("basePath", "") or ""
    domain = site_config.get("domain", "https://stacksaver.example.com").rstrip("/")
    canonical_url = f"{domain}{base}{canonical_path}"
    current_year = datetime.now(timezone.utc).year
    ld_script = f'<script type="application/ld+json">{json.dumps(json_ld)}</script>' if json_ld else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}" />
  <link rel="canonical" href="{esc(canonical_url)}" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{esc(canonical_url)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="{base}/assets/styles.css" />
  {ld_script}
</head>
<body>
  <header class="site-header">
    <div class="container nav-inner">
      <a href="{base}/" class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-text">{esc(site_config["name"])}</span>
        <span class="brand-badge">2026 TCO Engine</span>
      </a>
      <nav class="main-nav">
        <a href="{base}/" class="{'active' if active_nav == 'home' else ''}">Stack Calculator</a>
        <a href="{base}/#directory" class="{'active' if active_nav == 'directory' else ''}">Self-Host Directory</a>
        <a href="{base}/#vps-benchmarks" class="{'active' if active_nav == 'vps' else ''}">Best VPS Deals</a>
        <a href="{base}/#comparisons" class="{'active' if active_nav == 'compare' else ''}">SaaS Comparisons</a>
      </nav>
    </div>
  </header>

  <main>
    {body_content}
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="brand footer-brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-text">{esc(site_config["name"])}</span>
        </div>
        <p class="footer-desc">
          Automated open-source vs. Cloud SaaS total cost of ownership (TCO) calculators, live GitHub telemetry, and VPS hardware sizing benchmarks.
        </p>
        <p class="disclosure">
          <strong>Affiliate Disclosure:</strong> Some links on {esc(site_config["name"])} (such as VPS hosting or cloud trial links) are referral links. We may earn a commission at no extra cost to you, and many links unlock exclusive free cloud credits ($100–$200) for new accounts.
        </p>
      </div>
      <div>
        <h4>Top Self-Hosted Calculators</h4>
        <ul class="footer-links">
          <li><a href="{base}/self-host/n8n/">Self-Host n8n vs Zapier</a></li>
          <li><a href="{base}/self-host/coolify/">Self-Host Coolify vs Vercel</a></li>
          <li><a href="{base}/self-host/supabase/">Self-Host Supabase Cost</a></li>
          <li><a href="{base}/self-host/chatwoot/">Self-Host Chatwoot vs Intercom</a></li>
          <li><a href="{base}/self-host/plausible/">Self-Host Plausible Analytics</a></li>
          <li><a href="{base}/self-host/immich/">Self-Host Immich Photo Cloud</a></li>
        </ul>
      </div>
      <div>
        <h4>Popular SaaS Alternatives</h4>
        <ul class="footer-links">
          <li><a href="{base}/alternatives-to/zapier/">Open-Source Zapier Alternatives</a></li>
          <li><a href="{base}/alternatives-to/notion/">Open-Source Notion Alternatives</a></li>
          <li><a href="{base}/alternatives-to/airtable/">Open-Source Airtable Alternatives</a></li>
          <li><a href="{base}/alternatives-to/intercom/">Open-Source Intercom Alternatives</a></li>
          <li><a href="{base}/alternatives-to/vercel/">Open-Source Vercel Alternatives</a></li>
          <li><a href="{base}/alternatives-to/calendly/">Open-Source Calendly Alternatives</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© {current_year} {esc(site_config["name"])}. Auto-updated via GitHub Actions API Pipeline.</span>
      <span><a href="{base}/sitemap.xml">XML Sitemap</a> · <a href="{base}/llms.txt">LLMs.txt</a></span>
    </div>
  </footer>
</body>
</html>"""


def render_vps_cards(vps_providers, base, recommended_ram_gb=4):
    cards = []
    for provider in vps_providers:
        plans = provider["plans"]
        matching_plan = next((p for p in plans if p["ramGb"] >= recommended_ram_gb), plans[-1])
        featured_cls = "vps-card-featured" if provider.get("highlight") else ""
        btn_cls = "btn-primary" if provider.get("highlight") else "btn-secondary"
        features_html = "".join(f"<li>✓ {esc(f)}</li>" for f in provider["features"])
        plans_json = esc(json.dumps(plans))

        cards.append(f"""
          <div class="vps-card {featured_cls}" data-provider-id="{esc(provider['id'])}" data-plans="{plans_json}">
            <div class="vps-card-top">
              <div>
                <span class="vps-badge">{esc(provider['badge'])}</span>
                <h3 class="vps-name">{esc(provider['name'])}</h3>
              </div>
              <div class="vps-price-box">
                <span class="vps-price-val" data-role="plan-price">${matching_plan['monthlyUsd']:.2f}</span>
                <span class="vps-price-period">/mo</span>
              </div>
            </div>
            <div class="vps-matched-plan" data-role="plan-specs">
              Matched Tier: <strong>{esc(matching_plan['name'])}</strong> ({matching_plan['vcpu']} vCPU · {matching_plan['ramGb']}GB RAM · {matching_plan['storageGb']}GB NVMe)
            </div>
            <ul class="vps-features">
              {features_html}
            </ul>
            <a href="{base}/go/{esc(provider['id'])}/" target="_blank" rel="nofollow sponsored noopener" class="btn {btn_cls} vps-cta">
              {esc(provider['promoText'])} →
            </a>
          </div>
        """)
    return f'<div class="vps-grid">{"".join(cards)}</div>'


def render_tool_calculator_page(tool, all_tools, affiliates, last_updated_date):
    base = affiliates["site"].get("basePath", "") or ""
    calc = tool["calculator"]
    req = tool["vpsRequirements"]
    related_tools = [t for t in all_tools if t["slug"] != tool["slug"] and t["categorySlug"] == tool["categorySlug"]][:4]

    default_saas_mo = round(calc["saasBaseUsd"] + max(0, calc["defaultUnits"] - calc["saasIncludedUnits"]) * calc["saasPerUnitUsd"])
    default_managed_mo = round(calc["managedBaseUsd"] + max(0, calc["defaultUnits"] - calc["managedIncludedUnits"]) * calc["managedPerUnitUsd"])
    default_self_mo = 6.99
    default_annual_savings = max(0, round((default_saas_mo - default_self_mo) * 12))

    faq_schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": tool["name"],
                "applicationCategory": tool["category"],
                "operatingSystem": "Linux, Docker",
                "offers": {"@type": "Offer", "price": "0.00", "priceCurrency": "USD"},
                "description": tool["shortDescription"],
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": f"How much RAM and CPU do I need to self-host {tool['name']}?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": f"To self-host {tool['name']} with Docker, the minimum requirement is {req['minVcpu']} vCPU, {req['minRamGb']}GB RAM, and {req['minStorageGb']}GB SSD storage. For production team workloads, we recommend {req['recVcpu']} vCPU and {req['recRamGb']}GB RAM.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": f"How much money does self-hosting {tool['name']} save vs {calc['saasName']}?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": f"At {calc['defaultUnits']} {calc['unitSuffix']}, {calc['saasName']} costs approximately ${default_saas_mo}/month (${default_saas_mo * 12}/year), whereas self-hosting {tool['name']} on a {req['recRamGb']}GB KVM VPS costs around ${default_self_mo:.2f}/month—saving roughly ${default_annual_savings:,} per year.",
                        },
                    },
                ],
            },
        ],
    }

    pros_html = "".join(f"<li>{esc(p)}</li>" for p in tool["pros"])
    cons_html = "".join(f"<li>{esc(c)}</li>" for c in tool["cons"])
    replaces_tags = "".join(
        f'<a href="{base}/alternatives-to/{slugify(r)}/" class="tag-link">{esc(r)} Alternatives</a>'
        for r in tool["replaces"]
    )

    related_html = ""
    if related_tools:
        rel_cards = "".join(
            f"""
            <a href="{base}/self-host/{esc(rt['slug'])}/" class="tool-card">
              <div class="tool-card-top">
                <h3>{esc(rt['name'])}</h3>
                <span class="star-badge">⭐ {rt['githubStats']['stars'] / 1000:.1f}k</span>
              </div>
              <p>{esc(rt['shortDescription'])}</p>
              <div class="tool-card-foot">
                <span>Min RAM: {rt['vpsRequirements']['minRamGb']}GB</span>
                <span class="text-emerald">Calculate Savings →</span>
              </div>
            </a>
            """
            for rt in related_tools
        )
        related_html = f"""
        <section class="section section-alt">
          <div class="container">
            <h2>Related Self-Hosted Tools in {esc(tool['category'])}</h2>
            <div class="tool-grid">{rel_cards}</div>
          </div>
        </section>
        """

    body = f"""
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="{base}/">Home</a> <span>/</span>
          <a href="{base}/category/{esc(tool['categorySlug'])}/">{esc(tool['category'])}</a> <span>/</span>
          <span>Self-Host {esc(tool['name'])}</span>
        </div>
        <div class="hero-title-row">
          <div>
            <span class="pill-badge">{esc(tool['category'])} · {esc(tool['license'])}</span>
            <h1>Self-Host {esc(tool['name'])}: Cost Calculator, VPS Specs & {esc(calc['saasName'].split(' ')[0])} Comparison</h1>
            <p class="lead">{esc(tool['shortDescription'])}</p>
          </div>
          <div class="github-card">
            <div class="gh-title">Live GitHub Telemetry</div>
            <div class="gh-stats">
              <div><strong>⭐ {tool['githubStats']['stars']:,}</strong><span>Stars</span></div>
              <div><strong>🍴 {tool['githubStats']['forks']:,}</strong><span>Forks</span></div>
              <div><strong>📦 {esc(tool['githubStats']['latestRelease'])}</strong><span>Release</span></div>
            </div>
            <div class="gh-updated">Verified: {esc(last_updated_date)} · <a href="https://github.com/{esc(tool['githubRepo'])}" target="_blank" rel="noopener">View Repo ↗</a></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="calc-card" id="tool-calculator"
          data-min-ram="{req['minRamGb']}"
          data-rec-ram="{req['recRamGb']}"
          data-min-vcpu="{req['minVcpu']}"
          data-rec-vcpu="{req['recVcpu']}"
          data-min-storage="{req['minStorageGb']}"
          data-ram-scale="{req['ramPer100UnitsGb']}"
          data-saas-base="{calc['saasBaseUsd']}"
          data-saas-inc="{calc['saasIncludedUnits']}"
          data-saas-per="{calc['saasPerUnitUsd']}"
          data-managed-base="{calc['managedBaseUsd']}"
          data-managed-inc="{calc['managedIncludedUnits']}"
          data-managed-per="{calc['managedPerUnitUsd']}"
          data-unit-suffix="{esc(calc['unitSuffix'])}">
          <div class="calc-header">
            <div>
              <h2>Interactive {esc(tool['name'])} vs. {esc(calc['saasName'])} Cost Calculator</h2>
              <p>Drag the slider to match your workload. We automatically calculate your monthly SaaS bill and size the exact Linux VPS hardware required.</p>
            </div>
            <div class="savings-pill">
              <span>Estimated Annual Savings</span>
              <strong id="annual-savings-display">${default_annual_savings:,}/yr</strong>
            </div>
          </div>

          <div class="slider-box">
            <div class="slider-label-row">
              <label for="workload-slider">{esc(calc['unitLabel'])}:</label>
              <span class="slider-current-val" id="slider-val-display">{calc['defaultUnits']} {esc(calc['unitSuffix'])}</span>
            </div>
            <input type="range" id="workload-slider" min="{calc['minUnits']}" max="{calc['maxUnits']}" step="{calc['stepUnits']}" value="{calc['defaultUnits']}" />
            <div class="slider-ticks">
              <span>Min: {calc['minUnits']} {esc(calc['unitSuffix'])}</span>
              <span>Mid: {round((calc['minUnits'] + calc['maxUnits']) / 2)} {esc(calc['unitSuffix'])}</span>
              <span>Scale: {calc['maxUnits']} {esc(calc['unitSuffix'])}</span>
            </div>
          </div>

          <div class="comparison-bars">
            <div class="bar-card bar-saas">
              <div class="bar-top">
                <div>
                  <span class="bar-tag">Incumbent SaaS</span>
                  <h3>{esc(calc['saasName'])}</h3>
                </div>
                <div class="bar-price">
                  <strong id="saas-monthly-val">${default_saas_mo}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-danger" id="saas-bar-fill" style="width: 100%"></div></div>
              <div class="bar-Sub" id="saas-annual-val">${default_saas_mo * 12:,} billed annually · Per-unit/seat restrictions apply</div>
            </div>

            <div class="bar-card bar-managed">
              <div class="bar-top">
                <div>
                  <span class="bar-tag">Zero-Maintenance Official Cloud</span>
                  <h3>{esc(calc['managedName'])}</h3>
                </div>
                <div class="bar-price">
                  <strong id="managed-monthly-val">${default_managed_mo}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-warn" id="managed-bar-fill" style="width: 45%"></div></div>
              <div class="bar-footer-row">
                <span id="managed-annual-val">${default_managed_mo * 12:,}/yr · Hosted by creators</span>
                <a href="{base}/go/{esc(tool['affiliateKey'])}/" target="_blank" rel="nofollow sponsored noopener" class="link-cta">Try Official Cloud →</a>
              </div>
            </div>

            <div class="bar-card bar-selfhost">
              <div class="bar-top">
                <div>
                  <span class="bar-tag badge-success">Winner: Self-Hosted Docker VPS</span>
                  <h3>Self-Hosted {esc(tool['name'])}</h3>
                </div>
                <div class="bar-price text-emerald">
                  <strong id="selfhost-monthly-val">${default_self_mo:.2f}</strong><span>/mo</span>
                </div>
              </div>
              <div class="bar-meter"><div class="bar-fill bar-fill-success" id="selfhost-bar-fill" style="width: 12%"></div></div>
              <div class="bar-footer-row">
                <span id="selfhost-specs-val">Recommended VPS: <strong>{req['recVcpu']} vCPU / {req['recRamGb']}GB RAM / {req['recStorageGb']}GB NVMe</strong></span>
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
          <h2>Best VPS Providers to Self-Host {esc(tool['name'])} (Auto-Sized)</h2>
          <p>The plans below automatically update as you move the workload slider above so you never overpay or under-provision RAM.</p>
        </div>
        {render_vps_cards(affiliates['vpsProviders'], base, req['recRamGb'])}
      </div>
    </section>

    <section class="section">
      <div class="container grid-2">
        <div class="card">
          <h2>⚡ Quickstart Docker Deployment ({tool['setupTimeMinutes']} Mins)</h2>
          <p>Setup Difficulty: <strong>{esc(tool['setupDifficulty'])}</strong>. Run the command below on any Ubuntu 24.04 VPS or deploy via Coolify/Hostinger 1-Click template:</p>
          <div class="code-block">
            <code id="docker-cmd">{esc(tool['dockerCommand'])}</code>
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('docker-cmd').innerText);this.innerText='Copied!';">Copy</button>
          </div>
          <div class="specs-table-wrap">
            <h4>Hardware Sizing Matrix for {esc(tool['name'])}</h4>
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
                  <td>{req['minVcpu']} Core</td>
                  <td>{req['minRamGb']} GB</td>
                  <td>{req['minStorageGb']} GB</td>
                  <td>$4.50 – $6.00/mo</td>
                </tr>
                <tr>
                  <td><strong>Production Team (Recommended)</strong></td>
                  <td><strong>{req['recVcpu']} Cores</strong></td>
                  <td><strong>{req['recRamGb']} GB</strong></td>
                  <td><strong>{req['recStorageGb']} GB</strong></td>
                  <td><strong>$6.99 – $14.00/mo</strong></td>
                </tr>
                <tr>
                  <td>High-Scale Enterprise</td>
                  <td>{req['recVcpu'] * 2} Cores</td>
                  <td>{req['recRamGb'] * 2} GB</td>
                  <td>{req['recStorageGb'] * 2} GB</td>
                  <td>$18.50 – $36.00/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h2>Why Self-Host {esc(tool['name'])} vs. Cloud SaaS?</h2>
          <h4 class="text-emerald">✅ Key Advantages</h4>
          <ul class="check-list">{pros_html}</ul>
          <h4 class="text-amber" style="margin-top:1.25rem;">⚠️ Honest Trade-offs to Consider</h4>
          <ul class="warn-list">{cons_html}</ul>
          <div class="replaces-box">
            <span>Replaces Paid SaaS Tools:</span>
            <div class="tag-row">{replaces_tags}</div>
          </div>
        </div>
      </div>
    </section>

    {related_html}

    <script>
      (function() {{
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

        function update() {{
          const units = parseFloat(slider.value);
          document.getElementById('slider-val-display').textContent = units + ' ' + unitSuffix;

          const saasMo = Math.round(saasBase + Math.max(0, units - saasInc) * saasPer);
          const managedMo = Math.round(managedBase + Math.max(0, units - managedInc) * managedPer);

          const neededRamRaw = Math.max(minRam, recRam + ((units / 100) * ramScale));
          const neededRam = neededRamRaw <= 2 ? 2 : neededRamRaw <= 4 ? 4 : neededRamRaw <= 8 ? 8 : neededRamRaw <= 16 ? 16 : 32;
          const neededVcpu = neededRam <= 2 ? minVcpu : neededRam <= 4 ? recVcpu : neededRam <= 8 ? Math.max(2, recVcpu) : 4;
          const neededStorage = neededRam <= 4 ? minStorage * 2 : minStorage * 4;

          let lowestVpsMo = 999;
          document.querySelectorAll('.vps-card').forEach(card => {{
            try {{
              const plans = JSON.parse(card.dataset.plans);
              const match = plans.find(p => p.ramGb >= neededRam) || plans[plans.length - 1];
              if (match.monthlyUsd < lowestVpsMo) lowestVpsMo = match.monthlyUsd;
              card.querySelector('[data-role="plan-price"]').textContent = '$' + match.monthlyUsd.toFixed(2);
              card.querySelector('[data-role="plan-specs"]').innerHTML =
                'Matched Tier: <strong>' + match.name + '</strong> (' + match.vcpu + ' vCPU · ' + match.ramGb + 'GB RAM · ' + match.storageGb + 'GB NVMe)';
            }} catch (e) {{}}
          }});

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
        }}

        slider.addEventListener('input', update);
        update();
      }})();
    </script>
    """

    return render_layout(
        title=f"Self-Host {tool['name']} Cost Calculator & VPS Requirements vs {calc['saasName']} (2026)",
        description=f"Calculate exact monthly savings when self-hosting {tool['name']} vs {calc['saasName']}. Compare Docker VPS RAM/CPU requirements, 1-click hosting plans, and {calc['managedName']} pricing.",
        canonical_path=f"/self-host/{tool['slug']}/",
        site_config=affiliates["site"],
        body_content=body,
        json_ld=faq_schema,
        active_nav="directory",
    )


def render_saas_alternative_page(saas_name, saas_slug, matching_tools, affiliates, last_updated_date):
    base = affiliates["site"].get("basePath", "") or ""
    primary_tool = matching_tools[0]
    cards_html = "".join(
        f"""
        <div class="card alternative-card">
          <div class="alt-card-head">
            <div>
              <span class="pill-badge">#{idx + 1} Best Replacement</span>
              <h2><a href="{base}/self-host/{esc(t['slug'])}/">{esc(t['name'])}</a></h2>
              <p class="alt-tagline">{esc(t['tagline'])}</p>
            </div>
            <div class="gh-mini">
              <strong>⭐ {t['githubStats']['stars']:,}</strong>
              <span>{esc(t['license'])}</span>
            </div>
          </div>
          <p>{esc(t['shortDescription'])}</p>
          <div class="alt-metrics">
            <div><span>Min VPS RAM</span><strong>{t['vpsRequirements']['minRamGb']} GB</strong></div>
            <div><span>Rec. VPS RAM</span><strong>{t['vpsRequirements']['recRamGb']} GB</strong></div>
            <div><span>Setup Time</span><strong>~{t['setupTimeMinutes']} mins</strong></div>
            <div><span>Est. VPS Cost</span><strong class="text-emerald">From $4.99/mo</strong></div>
          </div>
          <div class="alt-actions">
            <a href="{base}/self-host/{esc(t['slug'])}/" class="btn btn-primary">Open {esc(t['name'])} Savings Calculator →</a>
            <a href="{base}/go/{esc(t['affiliateKey'])}/" target="_blank" rel="nofollow sponsored noopener" class="btn btn-secondary">Try Official Cloud</a>
          </div>
        </div>
        """
        for idx, t in enumerate(matching_tools)
    )

    body = f"""
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="{base}/">Home</a> <span>/</span>
          <span>Open-Source {esc(saas_name)} Alternatives</span>
        </div>
        <span class="pill-badge">Verified {esc(last_updated_date)} · Self-Hosted & Open Source</span>
        <h1>Best Open-Source Self-Hosted Alternatives to {esc(saas_name)} in 2026</h1>
        <p class="lead">
          Stop paying escalating per-seat and per-usage SaaS taxes for {esc(saas_name)}. Compare the top {len(matching_tools)} open-source replacements you can self-host on a $5–$10/mo VPS with full data ownership.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="tool-grid">{cards_html}</div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <h2>Recommended 1-Click VPS Hosting for {esc(saas_name)} Replacements</h2>
          <p>Deploy {esc(primary_tool['name'])} and other open-source tools in under 5 minutes with pre-configured Docker & Coolify templates.</p>
        </div>
        {render_vps_cards(affiliates['vpsProviders'], base, primary_tool['vpsRequirements']['recRamGb'])}
      </div>
    </section>
    """

    return render_layout(
        title=f"Best Self-Hosted Open-Source {saas_name} Alternatives (2026 Cost Comparison)",
        description=f"Compare the best open-source, self-hosted alternatives to {saas_name} including {', '.join(t['name'] for t in matching_tools)}. Calculate your exact VPS hosting cost vs {saas_name} pricing.",
        canonical_path=f"/alternatives-to/{saas_slug}/",
        site_config=affiliates["site"],
        body_content=body,
        active_nav="directory",
    )


def render_comparison_page(tool_a, tool_b, affiliates, last_updated_date):
    base = affiliates["site"].get("basePath", "") or ""
    comp_slug = f"{tool_a['slug']}-vs-{tool_b['slug']}"
    rec_ram = max(tool_a["vpsRequirements"]["recRamGb"], tool_b["vpsRequirements"]["recRamGb"])

    body = f"""
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="{base}/">Home</a> <span>/</span>
          <span>Compare</span> <span>/</span>
          <span>{esc(tool_a['name'])} vs {esc(tool_b['name'])}</span>
        </div>
        <span class="pill-badge">Head-to-Head Benchmark · Updated {esc(last_updated_date)}</span>
        <h1>{esc(tool_a['name'])} vs. {esc(tool_b['name'])}: Self-Hosted Cost, RAM & Feature Comparison</h1>
        <p class="lead">
          Trying to choose between {esc(tool_a['name'])} and {esc(tool_b['name'])}? Compare live GitHub popularity, Docker memory consumption, licensing, and total cost of ownership.
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
                <th><a href="{base}/self-host/{esc(tool_a['slug'])}/">{esc(tool_a['name'])}</a></th>
                <th><a href="{base}/self-host/{esc(tool_b['slug'])}/">{esc(tool_b['name'])}</a></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Category</strong></td>
                <td>{esc(tool_a['category'])}</td>
                <td>{esc(tool_b['category'])}</td>
              </tr>
              <tr>
                <td><strong>GitHub Stars</strong></td>
                <td>⭐ {tool_a['githubStats']['stars']:,}</td>
                <td>⭐ {tool_b['githubStats']['stars']:,}</td>
              </tr>
              <tr>
                <td><strong>Open-Source License</strong></td>
                <td>{esc(tool_a['license'])}</td>
                <td>{esc(tool_b['license'])}</td>
              </tr>
              <tr>
                <td><strong>Minimum VPS RAM</strong></td>
                <td>{tool_a['vpsRequirements']['minRamGb']} GB ({tool_a['vpsRequirements']['minVcpu']} vCPU)</td>
                <td>{tool_b['vpsRequirements']['minRamGb']} GB ({tool_b['vpsRequirements']['minVcpu']} vCPU)</td>
              </tr>
              <tr>
                <td><strong>Recommended Production RAM</strong></td>
                <td><strong>{tool_a['vpsRequirements']['recRamGb']} GB ({tool_a['vpsRequirements']['recVcpu']} vCPU)</strong></td>
                <td><strong>{tool_b['vpsRequirements']['recRamGb']} GB ({tool_b['vpsRequirements']['recVcpu']} vCPU)</strong></td>
              </tr>
              <tr>
                <td><strong>Estimated Setup Time</strong></td>
                <td>~{tool_a['setupTimeMinutes']} mins ({esc(tool_a['setupDifficulty'])})</td>
                <td>~{tool_b['setupTimeMinutes']} mins ({esc(tool_b['setupDifficulty'])})</td>
              </tr>
              <tr>
                <td><strong>Replaces Paid SaaS</strong></td>
                <td>{esc(', '.join(tool_a['replaces']))}</td>
                <td>{esc(', '.join(tool_b['replaces']))}</td>
              </tr>
              <tr>
                <td><strong>Interactive TCO Calculator</strong></td>
                <td><a href="{base}/self-host/{esc(tool_a['slug'])}/" class="btn btn-primary btn-sm">{esc(tool_a['name'])} Calculator →</a></td>
                <td><a href="{base}/self-host/{esc(tool_b['slug'])}/" class="btn btn-primary btn-sm">{esc(tool_b['name'])} Calculator →</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <h2>Best VPS Servers to Run Both {esc(tool_a['name'])} & {esc(tool_b['name'])}</h2>
          <p>You can run both tools together on a single VPS using Docker Compose or Coolify.</p>
        </div>
        {render_vps_cards(affiliates['vpsProviders'], base, rec_ram)}
      </div>
    </section>
    """

    return render_layout(
        title=f"{tool_a['name']} vs {tool_b['name']} (2026): Self-Hosted RAM, Cost & Feature Comparison",
        description=f"Side-by-side comparison of {tool_a['name']} ({tool_a['githubStats']['stars']:,} GitHub stars) and {tool_b['name']} ({tool_b['githubStats']['stars']:,} GitHub stars). Compare VPS RAM requirements, Docker setup, and cloud pricing.",
        canonical_path=f"/compare/{comp_slug}/",
        site_config=affiliates["site"],
        body_content=body,
        active_nav="compare",
    )


def render_category_page(cat_name, cat_slug, cat_tools, affiliates, last_updated_date):
    base = affiliates["site"].get("basePath", "") or ""
    cards_html = "".join(
        f"""
        <a href="{base}/self-host/{esc(t['slug'])}/" class="tool-card">
          <div class="tool-card-top">
            <span class="pill-sm">{esc(t['license'])}</span>
            <span class="star-badge">⭐ {t['githubStats']['stars'] / 1000:.1f}k</span>
          </div>
          <h3>{esc(t['name'])}</h3>
          <p>{esc(t['shortDescription'])}</p>
          <div class="replaces-inline">Replaces: <strong>{esc(', '.join(t['replaces']))}</strong></div>
          <div class="tool-card-foot">
            <span>Rec. RAM: {t['vpsRequirements']['recRamGb']}GB</span>
            <span class="text-emerald">Calculate Savings →</span>
          </div>
        </a>
        """
        for t in cat_tools
    )

    body = f"""
    <section class="hero-sub">
      <div class="container">
        <div class="breadcrumbs">
          <a href="{base}/">Home</a> <span>/</span>
          <span>{esc(cat_name)}</span>
        </div>
        <span class="pill-badge">Category Hub · Updated {esc(last_updated_date)}</span>
        <h1>Best Self-Hosted Open-Source {esc(cat_name)} Software (2026)</h1>
        <p class="lead">Compare VPS RAM requirements, Docker setup commands, and annual cloud savings across the top {len(cat_tools)} open-source {esc(cat_name.lower())} platforms.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="tool-grid">{cards_html}</div>
      </div>
    </section>
    """
    return render_layout(
        title=f"Best Self-Hosted {cat_name} Tools & Cost Calculators (2026)",
        description=f"Compare self-hosted open-source {cat_name} tools including {', '.join(t['name'] for t in cat_tools)}. View VPS hardware specs and SaaS cost comparisons.",
        canonical_path=f"/category/{cat_slug}/",
        site_config=affiliates["site"],
        body_content=body,
        active_nav="directory",
    )


def render_home_page(tools, comparisons, saas_map, affiliates, last_updated_date):
    base = affiliates["site"].get("basePath", "") or ""
    stack_buttons = []
    for idx, t in enumerate(tools[:12]):
        calc = t["calculator"]
        default_saas_mo = round(
            calc["saasBaseUsd"] + max(0, calc["defaultUnits"] - calc["saasIncludedUnits"]) * calc["saasPerUnitUsd"]
        )
        active_cls = "active" if idx < 4 else ""
        stack_buttons.append(f"""
          <button type="button" class="stack-toggle {active_cls}"
            data-slug="{esc(t['slug'])}"
            data-saas-mo="{default_saas_mo}"
            data-ram="{t['vpsRequirements']['minRamGb']}">
            <div class="st-top">
              <span class="st-saas">Replace {esc(t['replaces'][0])}</span>
              <span class="st-check">✓</span>
            </div>
            <div class="st-name">{esc(t['name'])}</div>
            <div class="st-cost">Saves ~${default_saas_mo}/mo</div>
          </button>
        """)

    tool_cards = "".join(
        f"""
        <a href="{base}/self-host/{esc(t['slug'])}/" class="tool-card" data-search="{esc((t['name'] + ' ' + t['category'] + ' ' + ' '.join(t['replaces']) + ' ' + t['shortDescription']).lower())}">
          <div class="tool-card-top">
            <span class="pill-sm">{esc(t['category'])}</span>
            <span class="star-badge">⭐ {t['githubStats']['stars'] / 1000:.1f}k</span>
          </div>
          <h3>{esc(t['name'])}</h3>
          <p>{esc(t['shortDescription'])}</p>
          <div class="replaces-inline">Replaces: <strong>{esc(', '.join(t['replaces']))}</strong></div>
          <div class="tool-card-foot">
            <span>RAM: {t['vpsRequirements']['minRamGb']}–{t['vpsRequirements']['recRamGb']}GB</span>
            <span class="text-emerald">Open Calculator →</span>
          </div>
        </a>
        """
        for t in tools
    )

    saas_tags = "".join(
        f'<a href="{base}/alternatives-to/{esc(slug)}/" class="tag-link">{esc(info["name"])} Alternatives ({len(info["tools"])})</a>'
        for slug, info in saas_map.items()
    )
    comp_tags = "".join(
        f'<a href="{base}/compare/{esc(a["slug"])}-vs-{esc(b["slug"])}/" class="tag-link">{esc(a["name"])} vs {esc(b["name"])}</a>'
        for a, b in comparisons
    )

    body = f"""
    <section class="hero">
      <div class="container">
        <span class="pill-badge">⚡ Live 2026 SaaS vs. Self-Hosted TCO Engine · Updated {esc(last_updated_date)}</span>
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
              <label for="team-scale-slider">Team / Workload Scale: <strong id="team-scale-label">1.0x Workload Scale</strong></label>
              <input type="range" id="team-scale-slider" min="0.5" max="4.0" step="0.5" value="1.0" />
            </div>
          </div>

          <div class="stack-selector-grid" id="stack-selector">
            {"".join(stack_buttons)}
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
        {render_vps_cards(affiliates['vpsProviders'], base, 8)}
      </div>
    </section>

    <section class="section" id="directory">
      <div class="container">
        <div class="section-head-flex">
          <div>
            <h2>3. Open-Source Self-Hosted Calculators ({len(tools)} Verified Apps)</h2>
            <p>Click any tool for an interactive workload cost calculator, Docker quickstart command, and hardware sizing matrix.</p>
          </div>
          <div class="filter-box">
            <input type="search" id="tool-search" placeholder="Search n8n, Zapier, Notion, Analytics..." aria-label="Search tools" />
          </div>
        </div>

        <div class="tool-grid" id="directory-grid">
          {tool_cards}
        </div>
      </div>
    </section>

    <section class="section section-alt" id="comparisons">
      <div class="container grid-2">
        <div>
          <h2>Browse by Paid SaaS to Replace</h2>
          <p style="margin-bottom: 1rem; color: var(--muted);">Looking to cancel a specific SaaS bill? View open-source replacements:</p>
          <div class="tag-cloud">{saas_tags}</div>
        </div>
        <div>
          <h2>Head-to-Head Open-Source Benchmarks</h2>
          <p style="margin-bottom: 1rem; color: var(--muted);">Compare RAM usage, GitHub velocity, and licensing side-by-side:</p>
          <div class="tag-cloud">{comp_tags}</div>
        </div>
      </div>
    </section>

    <script>
      (function() {{
        const toggles = document.querySelectorAll('.stack-toggle');
        const scaleSlider = document.getElementById('team-scale-slider');
        const scaleLabel = document.getElementById('team-scale-label');

        function recalcMaster() {{
          const mult = parseFloat(scaleSlider.value || '1');
          scaleLabel.textContent = mult.toFixed(1) + 'x Workload Scale';

          let totalSaasMo = 0;
          let totalRamRaw = 1;
          toggles.forEach(btn => {{
            if (btn.classList.contains('active')) {{
              totalSaasMo += Math.round(parseFloat(btn.dataset.saasMo) * mult);
              totalRamRaw += parseFloat(btn.dataset.ram) * 0.75;
            }}
          }});

          const neededRam = totalRamRaw <= 2 ? 2 : totalRamRaw <= 4 ? 4 : totalRamRaw <= 8 ? 8 : totalRamRaw <= 16 ? 16 : 32;
          const neededVcpu = neededRam <= 2 ? 1 : neededRam <= 4 ? 2 : neededRam <= 8 ? 4 : 8;

          let bestVpsMo = 6.99;
          document.querySelectorAll('.vps-card').forEach(card => {{
            try {{
              const plans = JSON.parse(card.dataset.plans);
              const match = plans.find(p => p.ramGb >= neededRam) || plans[plans.length - 1];
              if (card.dataset.providerId === 'hostinger') bestVpsMo = match.monthlyUsd;
              card.querySelector('[data-role="plan-price"]').textContent = '$' + match.monthlyUsd.toFixed(2);
              card.querySelector('[data-role="plan-specs"]').innerHTML =
                'Matched Tier: <strong>' + match.name + '</strong> (' + match.vcpu + ' vCPU · ' + match.ramGb + 'GB RAM · ' + match.storageGb + 'GB NVMe)';
            }} catch (e) {{}}
          }});

          const netAnnual = Math.max(0, Math.round((totalSaasMo - bestVpsMo) * 12));
          document.getElementById('master-saas-mo').textContent = '$' + totalSaasMo.toLocaleString() + '/mo';
          document.getElementById('master-saas-yr').textContent = '$' + (totalSaasMo * 12).toLocaleString() + ' / year';
          document.getElementById('master-vps-specs').textContent = neededVcpu + ' vCPU / ' + neededRam + 'GB RAM';
          document.getElementById('master-vps-mo').textContent = '$' + bestVpsMo.toFixed(2) + '/mo';
          document.getElementById('master-vps-yr').textContent = '$' + (bestVpsMo * 12).toFixed(2) + ' / year';
          document.getElementById('master-net-savings').textContent = '$' + netAnnual.toLocaleString() + '/yr';
        }}

        toggles.forEach(btn => {{
          btn.addEventListener('click', () => {{
            btn.classList.toggle('active');
            recalcMaster();
          }});
        }});
        if (scaleSlider) scaleSlider.addEventListener('input', recalcMaster);
        recalcMaster();

        const searchInput = document.getElementById('tool-search');
        if (searchInput) {{
          searchInput.addEventListener('input', () => {{
            const q = searchInput.value.toLowerCase().trim();
            document.querySelectorAll('#directory-grid .tool-card').forEach(card => {{
              card.style.display = card.dataset.search.includes(q) ? '' : 'none';
            }});
          }});
        }}
      }})();
    </script>
    """

    return render_layout(
        title=f"{affiliates['site']['name']} — Self-Hosted vs. Cloud SaaS Cost Calculator & VPS Sizing Directory (2026)",
        description="Interactive SaaS vs. Self-Hosted Open-Source cost calculator. Compare Docker VPS RAM requirements, live GitHub stars, and 1-click deployment costs for n8n, Coolify, Supabase, Plausible, and 20+ tools.",
        canonical_path="/",
        site_config=affiliates["site"],
        body_content=body,
        active_nav="home",
    )


def render_redirect_page(target_url, site_config):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="refresh" content="0;url={esc(target_url)}" />
  <title>Redirecting to Partner Offer | {esc(site_config['name'])}</title>
  <script>window.location.replace({json.dumps(target_url)});</script>
</head>
<body style="font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="text-align:center;">
    <p>Redirecting you to the official partner page...</p>
    <p><a href="{esc(target_url)}" style="color:#10b981;">Click here if you are not redirected automatically</a></p>
  </div>
</body>
</html>"""


def main() -> None:
    print("Building Programmatic SEO static site via Python 3...")
    tools = json.loads((DATA_DIR / "tools.json").read_text(encoding="utf-8"))
    affiliates = json.loads((DATA_DIR / "affiliates.json").read_text(encoding="utf-8"))

    last_updated_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    meta_file = DATA_DIR / "last-updated.json"
    if meta_file.exists():
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            last_updated_date = meta.get("lastUpdatedDate", last_updated_date)
        except Exception:
            pass

    # Extract CSS from build-site.mjs or write directly
    mjs_text = (ROOT_DIR / "scripts" / "build-site.mjs").read_text(encoding="utf-8")
    css_match = re.search(r"function generateCss\(\) \{\s*return `([\s\S]*?)`;\s*\}", mjs_text)
    if css_match:
        write_page("assets/styles.css", css_match.group(1))

    sitemap_urls = ["/"]

    saas_map = {}
    for tool in tools:
        for saas_name in tool["replaces"]:
            s_slug = slugify(saas_name)
            if s_slug not in saas_map:
                saas_map[s_slug] = {"name": saas_name, "slug": s_slug, "tools": []}
            saas_map[s_slug]["tools"].append(tool)

    category_map = {}
    for tool in tools:
        c_slug = tool["categorySlug"]
        if c_slug not in category_map:
            category_map[c_slug] = {"name": tool["category"], "slug": c_slug, "tools": []}
        category_map[c_slug]["tools"].append(tool)

    comparisons = []
    for i in range(len(tools)):
        for j in range(i + 1, len(tools)):
            if tools[i]["categorySlug"] == tools[j]["categorySlug"]:
                comparisons.append((tools[i], tools[j]))

    for tool in tools:
        html_out = render_tool_calculator_page(tool, tools, affiliates, last_updated_date)
        write_page(f"self-host/{tool['slug']}/index.html", html_out)
        sitemap_urls.append(f"/self-host/{tool['slug']}/")

    for s_slug, info in saas_map.items():
        html_out = render_saas_alternative_page(info["name"], s_slug, info["tools"], affiliates, last_updated_date)
        write_page(f"alternatives-to/{s_slug}/index.html", html_out)
        sitemap_urls.append(f"/alternatives-to/{s_slug}/")

    for tool_a, tool_b in comparisons:
        comp_slug = f"{tool_a['slug']}-vs-{tool_b['slug']}"
        html_out = render_comparison_page(tool_a, tool_b, affiliates, last_updated_date)
        write_page(f"compare/{comp_slug}/index.html", html_out)
        sitemap_urls.append(f"/compare/{comp_slug}/")

    for c_slug, cat in category_map.items():
        html_out = render_category_page(cat["name"], c_slug, cat["tools"], affiliates, last_updated_date)
        write_page(f"category/{c_slug}/index.html", html_out)
        sitemap_urls.append(f"/category/{c_slug}/")

    for vps in affiliates["vpsProviders"]:
        write_page(f"go/{vps['id']}/index.html", render_redirect_page(vps["affiliateUrl"], affiliates["site"]))
    for key, url in affiliates["saasAffiliates"].items():
        write_page(f"go/{key}/index.html", render_redirect_page(url, affiliates["site"]))

    write_page("index.html", render_home_page(tools, comparisons, saas_map, affiliates, last_updated_date))

    domain = affiliates["site"]["domain"].rstrip("/") + (affiliates["site"].get("basePath") or "")
    sitemap_entries = "\n".join(
        f"""  <url>
    <loc>{esc(domain + u)}</loc>
    <lastmod>{last_updated_date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{'1.0' if u == '/' else '0.8'}</priority>
  </url>"""
        for u in sitemap_urls
    )
    write_page(
        "sitemap.xml",
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sitemap_entries}\n</urlset>\n',
    )
    write_page("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /go/\nSitemap: {domain}/sitemap.xml\n")

    llms_tools = "\n".join(
        f"- [Self-Host {t['name']} Cost & VPS Specs]({domain}/self-host/{t['slug']}/): Replaces {', '.join(t['replaces'])}. Min RAM: {t['vpsRequirements']['minRamGb']}GB, Rec RAM: {t['vpsRequirements']['recRamGb']}GB."
        for t in tools
    )
    llms_alts = "\n".join(
        f"- [Open-Source {s['name']} Alternatives]({domain}/alternatives-to/{s['slug']}/)"
        for s in saas_map.values()
    )
    write_page(
        "llms.txt",
        f"# {affiliates['site']['name']} — {affiliates['site']['tagline']}\n\n> Automated open-source self-hosting vs. Cloud SaaS total cost of ownership (TCO) calculators and VPS hardware sizing guides. Last updated: {last_updated_date}.\n\n## Self-Host Cost & VPS Sizing Calculators\n{llms_tools}\n\n## Open-Source SaaS Alternatives\n{llms_alts}\n",
    )

    print(f"Generated {len(sitemap_urls)} SEO content pages + affiliate redirects + sitemap.xml + llms.txt in /dist!")


if __name__ == "__main__":
    main()
