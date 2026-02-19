/**
 * Main Application — Box 3 Tax Calculator
 *
 * Orchestrates the UI, charts, simulation, and data flow.
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

import { marketData, getAvailableYears, getReturns } from './marketData.js';
import { getDefaultConfigs } from './taxSystems.js';
import { runSimulation } from './simulation.js';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

// ── Globals ──
let charts = {};
let configs = getDefaultConfigs();

// ── System display config ──
const systemMeta = {
  noTax: { label: 'Geen belasting', color: '#00d68f', bg: 'rgba(0, 214, 143, 0.08)' },
  old:   { label: 'Oud systeem (vóór 2017)', color: '#4a90d9', bg: 'rgba(74, 144, 217, 0.08)' },
  current: { label: 'Huidig systeem (overbruggingswet)', color: '#f5a623', bg: 'rgba(245, 166, 35, 0.08)' },
  future: { label: 'Toekomstig (2028+)', color: '#ff4466', bg: 'rgba(255, 68, 102, 0.08)' }
};

// ── DOM Elements ──
const dom = {};

function cacheDom() {
  dom.startCapital = document.getElementById('startCapital');
  dom.indexSelect = document.getElementById('indexSelect');
  dom.yearStart = document.getElementById('yearStart');
  dom.yearEnd = document.getElementById('yearEnd');
  dom.fiscalPartner = document.getElementById('fiscalPartner');
  dom.summaryGrid = document.getElementById('summaryGrid');

  // Old system config
  dom.oldDeemedReturn = document.getElementById('oldDeemedReturn');
  dom.oldTaxRate = document.getElementById('oldTaxRate');
  dom.oldExemption = document.getElementById('oldExemption');

  // Current system config
  dom.curTaxRate = document.getElementById('curTaxRate');
  dom.curExemption = document.getElementById('curExemption');
  dom.curSavingsRate = document.getElementById('curSavingsRate');
  dom.curInvestRate = document.getElementById('curInvestRate');
  dom.curDebtRate = document.getElementById('curDebtRate');
  dom.curDebtThreshold = document.getElementById('curDebtThreshold');
  dom.curAllocSavings = document.getElementById('curAllocSavings');
  dom.curAllocInvest = document.getElementById('curAllocInvest');
  dom.curAllocDebt = document.getElementById('curAllocDebt');

  // Future system config
  dom.futTaxRate = document.getElementById('futTaxRate');
  dom.futFreeReturn = document.getElementById('futFreeReturn');
  dom.futLossThreshold = document.getElementById('futLossThreshold');

  // Future info modal
  dom.futInfoBtn = document.getElementById('futInfoBtn');
  dom.futureInfoModal = document.getElementById('futureInfoModal');
  dom.futureInfoClose = document.getElementById('futureInfoClose');
}

function openFutureInfoModal() {
  if (!dom.futureInfoModal) return;
  document.body.classList.add('modal-open');
  dom.futureInfoModal.classList.add('is-open');
  dom.futureInfoModal.setAttribute('aria-hidden', 'false');
  if (dom.futureInfoClose) dom.futureInfoClose.focus();
}

function closeFutureInfoModal() {
  if (!dom.futureInfoModal) return;
  document.body.classList.remove('modal-open');
  dom.futureInfoModal.classList.remove('is-open');
  dom.futureInfoModal.setAttribute('aria-hidden', 'true');
  if (dom.futInfoBtn) dom.futInfoBtn.focus();
}

// ── Get active (toggled-on) systems ──
function getActiveSystems() {
  const toggles = document.querySelectorAll('.system-toggle');
  const active = [];
  toggles.forEach(t => {
    if (t.checked) active.push(t.dataset.system);
  });
  return active;
}

// ── Sync accordion disabled visual state ──
function syncAccordionStates() {
  document.querySelectorAll('.config-accordion[data-system]').forEach(acc => {
    const sys = acc.dataset.system;
    const toggle = acc.querySelector('.system-toggle');
    if (toggle && !toggle.checked) {
      acc.classList.add('is-disabled');
    } else {
      acc.classList.remove('is-disabled');
    }
  });
}

// ── Year selectors ──
function populateYearSelectors(indexKey, preserveSelection) {
  const prevStart = dom.yearStart.value;
  const prevEnd = dom.yearEnd.value;

  let years;
  if (indexKey === 'custom') {
    const customData = loadCustomReturns();
    if (customData && Object.keys(customData).length > 0) {
      years = Object.keys(customData).map(Number).sort((a, b) => a - b);
    } else {
      years = getAvailableYears('sp500');
    }
  } else {
    years = getAvailableYears(indexKey);
  }

  dom.yearStart.innerHTML = '';
  dom.yearEnd.innerHTML = '';

  years.forEach(y => {
    const optS = document.createElement('option');
    optS.value = y;
    optS.textContent = y;
    dom.yearStart.appendChild(optS);

    const optE = document.createElement('option');
    optE.value = y;
    optE.textContent = y;
    dom.yearEnd.appendChild(optE);
  });

  if (preserveSelection && years.includes(parseInt(prevStart))) {
    dom.yearStart.value = prevStart;
    dom.yearEnd.value = prevEnd;
  } else {
    // Default: 2015 to last year
    const defaultStart = years.includes(2015) ? 2015 : years[0];
    dom.yearStart.value = defaultStart;
    dom.yearEnd.value = years[years.length - 1];
  }
}

// ── Read configs from DOM ──
function readConfigs() {
  const partnerMultiplier = dom.fiscalPartner.checked ? 2 : 1;

  configs.old = {
    deemedReturn: parseFloat(dom.oldDeemedReturn.value) || 4,
    taxRate: parseFloat(dom.oldTaxRate.value) || 30,
    exemption: parseFloat(dom.oldExemption.value) || 21139,
    partnerMultiplier
  };

  configs.current = {
    taxRate: parseFloat(dom.curTaxRate.value) || 36,
    exemption: parseFloat(dom.curExemption.value) || 59357,
    debtThreshold: parseFloat(dom.curDebtThreshold.value) || 3800,
    savingsRate: parseFloat(dom.curSavingsRate.value) || 1.28,
    investRate: parseFloat(dom.curInvestRate.value) || 6.00,
    debtRate: parseFloat(dom.curDebtRate.value) || 2.70,
    allocSavings: parseFloat(dom.curAllocSavings.value) || 0,
    allocInvest: parseFloat(dom.curAllocInvest.value) || 100,
    allocDebt: parseFloat(dom.curAllocDebt.value) || 0,
    partnerMultiplier
  };

  configs.future = {
    taxRate: parseFloat(dom.futTaxRate.value) || 36,
    freeReturn: parseFloat(dom.futFreeReturn.value) || 1800,
    lossThreshold: parseFloat(dom.futLossThreshold.value) || 500,
    partnerMultiplier
  };
}

// ── Load custom returns from localStorage ──
function loadCustomReturns() {
  try {
    const raw = localStorage.getItem('customReturns');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Get current returns data ──
function getCurrentReturns() {
  const indexKey = dom.indexSelect.value;
  const startYear = parseInt(dom.yearStart.value);
  const endYear = parseInt(dom.yearEnd.value);

  if (indexKey === 'custom') {
    const customData = loadCustomReturns();
    if (customData && Object.keys(customData).length > 0) {
      const years = Object.keys(customData)
        .map(Number)
        .filter(y => y >= startYear && y <= endYear)
        .sort((a, b) => a - b);
      return years.map(y => ({ year: y, return: customData[y] }));
    }
    return [];
  }

  return getReturns(indexKey, startYear, endYear);
}

// ── Format currency ──
function formatEUR(amount) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount);
}

// ── Create / Update Charts ──
function createChart(canvasId, title, yPrefix) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#8a8a9e',
            font: { family: 'Inter', size: 12, weight: '500' },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(19, 19, 31, 0.95)',
          titleColor: '#f0f0f5',
          bodyColor: '#8a8a9e',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return `${context.dataset.label}: ${formatEUR(val)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false
          },
          ticks: {
            color: '#55556a',
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false
          },
          ticks: {
            color: '#55556a',
            font: { family: 'Inter', size: 11 },
            callback: function(value) {
              if (value >= 1000000) return '€' + (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return '€' + (value / 1000).toFixed(0) + 'k';
              return '€' + value;
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.3,
          borderWidth: 2.5
        },
        point: {
          radius: 3,
          hoverRadius: 6,
          hitRadius: 10
        }
      }
    }
  });
}

function updateChartData(chart, labels, datasets) {
  chart.data.labels = labels;
  chart.data.datasets = datasets;
  chart.update('none'); // no animation on updates for snappiness
}

function buildDatasets(dataObj, systems, activeSystems) {
  return systems
    .filter(sys => activeSystems.includes(sys))
    .map(sys => ({
      label: systemMeta[sys].label,
      data: dataObj[sys],
      borderColor: systemMeta[sys].color,
      backgroundColor: systemMeta[sys].bg,
      fill: false,
      pointBackgroundColor: systemMeta[sys].color,
      pointBorderColor: 'transparent',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    }));
}

// ── Summary cards ──
function updateSummary(result, activeSystems) {
  const { systems, portfolioValues, cumulativeTax } = result;
  const filtered = systems.filter(sys => activeSystems.includes(sys));
  const startCap = parseFloat(dom.startCapital.value) || 150000;

  if (filtered.length === 0) {
    dom.summaryGrid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem; text-align: center;">Selecteer minstens één belastingsysteem</p>';
    return;
  }

  const resultCards = filtered.map(sys => {
    const finalValue = portfolioValues[sys][portfolioValues[sys].length - 1];
    const totalTax = cumulativeTax[sys].length > 0
      ? cumulativeTax[sys][cumulativeTax[sys].length - 1]
      : 0;
    const profit = finalValue - startCap;
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    const profitSign = profit >= 0 ? '+' : '';

    return `
      <div class="summary-result-card">
        <div class="result-label">
          <span class="config-dot" style="background: ${systemMeta[sys].color}"></span>
          ${systemMeta[sys].label}
        </div>
        <div class="result-value" style="color: ${systemMeta[sys].color}">${formatEUR(finalValue)}</div>
        <div class="result-details">
          <div class="result-detail">Rendement: <span class="${profitClass}">${profitSign}${formatEUR(profit)}</span></div>
          <div class="result-detail">Belasting: <span class="negative">${formatEUR(totalTax)}</span></div>
        </div>
      </div>
    `;
  }).join('');

  dom.summaryGrid.innerHTML = `
    <div class="summary-start">
      <div class="start-label">Startkapitaal</div>
      <div class="start-value">${formatEUR(startCap)}</div>
    </div>
    <div class="summary-arrow">→</div>
    <div class="summary-results">
      ${resultCards}
    </div>
  `;
}

// ── Main update function ──
function update() {
  readConfigs();
  syncAccordionStates();

  const startCapital = parseFloat(dom.startCapital.value) || 150000;
  const returns = getCurrentReturns();
  const activeSystems = getActiveSystems();

  if (returns.length === 0) return;

  const result = runSimulation(startCapital, returns, configs);

  // Update portfolio chart
  updateChartData(
    charts.portfolio,
    result.labels,
    buildDatasets(result.portfolioValues, result.systems, activeSystems)
  );

  // Update annual tax chart
  updateChartData(
    charts.annualTax,
    result.taxLabels,
    buildDatasets(result.annualTax, result.systems, activeSystems)
  );

  // Update cumulative tax chart
  updateChartData(
    charts.totalTax,
    result.taxLabels,
    buildDatasets(result.cumulativeTax, result.systems, activeSystems)
  );

  // Update summary
  updateSummary(result, activeSystems);
}

// ── Event handlers ──
function setupEventListeners() {
  // Debounce helper
  let debounceTimer;
  function debounced(fn) {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), 150);
    };
  }

  const debouncedUpdate = debounced(update);

  // Main controls
  dom.startCapital.addEventListener('input', debouncedUpdate);
  dom.yearStart.addEventListener('change', update);
  dom.yearEnd.addEventListener('change', update);
  dom.fiscalPartner.addEventListener('change', update);

  dom.indexSelect.addEventListener('change', () => {
    const isCustom = dom.indexSelect.value === 'custom';

    if (isCustom) {
      const customData = loadCustomReturns();
      if (!customData || Object.keys(customData).length === 0) {
        alert('Je hebt nog geen eigen data ingevoerd. Ga naar de Marktdata pagina om eigen rendementen in te voeren.');
        dom.indexSelect.value = 'sp500';
        return;
      }
    }

    populateYearSelectors(dom.indexSelect.value);
    update();
  });

  // Config inputs — all debounced
  const configInputs = [
    dom.oldDeemedReturn, dom.oldTaxRate, dom.oldExemption,
    dom.curTaxRate, dom.curExemption, dom.curSavingsRate,
    dom.curInvestRate, dom.curDebtRate, dom.curDebtThreshold,
    dom.curAllocSavings, dom.curAllocInvest, dom.curAllocDebt,
    dom.futTaxRate, dom.futFreeReturn, dom.futLossThreshold
  ];

  configInputs.forEach(input => {
    input.addEventListener('input', debouncedUpdate);
  });

  // System toggles
  document.querySelectorAll('.system-toggle').forEach(toggle => {
    toggle.addEventListener('change', update);
  });

  // Future info modal
  if (dom.futInfoBtn && dom.futureInfoModal) {
    dom.futInfoBtn.addEventListener('click', openFutureInfoModal);
  }
  if (dom.futureInfoClose) {
    dom.futureInfoClose.addEventListener('click', closeFutureInfoModal);
  }
  if (dom.futureInfoModal) {
    dom.futureInfoModal.addEventListener('click', (e) => {
      if (e.target === dom.futureInfoModal) closeFutureInfoModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!dom.futureInfoModal) return;
    if (!dom.futureInfoModal.classList.contains('is-open')) return;
    closeFutureInfoModal();
  });
}

// ── Initialize ──
function init() {
  cacheDom();

  // Populate year selectors
  populateYearSelectors('sp500');

  // Create charts
  charts.portfolio = createChart('chartPortfolio', 'Vermogensgroei', '€');
  charts.annualTax = createChart('chartAnnualTax', 'Jaarlijkse belasting', '€');
  charts.totalTax = createChart('chartTotalTax', 'Totaal betaalde belasting', '€');

  // Setup event listeners
  setupEventListeners();

  // Run initial simulation
  update();
}

// Start
document.addEventListener('DOMContentLoaded', init);
