/**
 * Data Page — shows market data in a table with editable "Custom" column
 */

import { marketData } from './marketData.js';

// ── Build the unified year set from all indices ──
function getAllYears() {
  const yearSet = new Set();
  Object.values(marketData).forEach(idx => {
    Object.keys(idx.returns).forEach(y => yearSet.add(Number(y)));
  });
  return [...yearSet].sort((a, b) => a - b);
}

// ── Load custom data from localStorage ──
function loadCustom() {
  try {
    const raw = localStorage.getItem('customReturns');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// ── Save custom data to localStorage ──
function saveCustom(data) {
  localStorage.setItem('customReturns', JSON.stringify(data));
}

// ── Indices in display order ──
const indices = Object.keys(marketData); // ['sp500', 'aex', 'allworld']

// ── Render the table ──
function renderTable() {
  const years = getAllYears();
  const custom = loadCustom();
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');

  // Header
  thead.innerHTML = `
    <th class="col-year">Jaar</th>
    ${indices.map(key =>
      `<th class="col-index">${marketData[key].name}</th>`
    ).join('')}
    <th class="col-custom">Eigen data (%)</th>
  `;

  // Body
  tbody.innerHTML = years.map(year => {
    const cells = indices.map(key => {
      const val = marketData[key].returns[year];
      const cls = val == null ? '' : val >= 0 ? 'positive' : 'negative';
      return `<td class="cell-return ${cls}">${val != null ? formatReturn(val) : '—'}</td>`;
    }).join('');

    const customVal = custom[year] != null ? custom[year] : '';

    return `
      <tr data-year="${year}">
        <td class="cell-year">${year}</td>
        ${cells}
        <td class="cell-custom">
          <input type="number"
                 class="custom-input"
                 data-year="${year}"
                 value="${customVal}"
                 step="0.01"
                 placeholder="—"
          />
        </td>
      </tr>
    `;
  }).join('');
}

function formatReturn(val) {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

// ── Add a new year row ──
function addYear() {
  const years = getAllYears();
  const lastYear = years[years.length - 1];
  const newYear = lastYear + 1;

  // Add a placeholder to our custom data so the year appears
  const custom = loadCustom();
  if (custom[newYear] == null) {
    custom[newYear] = '';
    saveCustom(custom);
  }

  // We need to also add the year to marketData temporarily so it shows in the table
  // Actually we just need to regenerate — the getAllYears function also checks custom
  renderTable();
  bindInputs();
  showStatus(`Jaar ${newYear} toegevoegd`);

  // Scroll to the new row
  const lastRow = document.querySelector(`tr[data-year="${newYear}"]`);
  if (lastRow) lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Override getAllYears to include custom keys
const _origGetAllYears = getAllYears;
function getAllYearsWithCustom() {
  const yearSet = new Set();
  Object.values(marketData).forEach(idx => {
    Object.keys(idx.returns).forEach(y => yearSet.add(Number(y)));
  });
  const custom = loadCustom();
  Object.keys(custom).forEach(y => yearSet.add(Number(y)));
  return [...yearSet].sort((a, b) => a - b);
}

// ── Bind input events ──
function bindInputs() {
  document.querySelectorAll('.custom-input').forEach(input => {
    input.addEventListener('input', () => {
      // Visual feedback
      input.classList.add('is-edited');
    });
  });
}

// ── Save all custom inputs ──
function saveAll() {
  const inputs = document.querySelectorAll('.custom-input');
  const custom = {};

  inputs.forEach(input => {
    const year = Number(input.dataset.year);
    const val = input.value.trim();
    if (val !== '') {
      custom[year] = parseFloat(val);
    }
  });

  saveCustom(custom);
  showStatus('✓ Eigen data opgeslagen');

  // Briefly flash the button
  const btn = document.getElementById('saveCustomBtn');
  btn.classList.add('is-saved');
  setTimeout(() => btn.classList.remove('is-saved'), 1500);
}

function showStatus(msg) {
  const el = document.getElementById('dataStatus');
  el.textContent = msg;
  el.classList.add('is-visible');
  setTimeout(() => el.classList.remove('is-visible'), 2500);
}

// ── Init ──
function init() {
  // Patch getAllYears to include custom
  const origFn = getAllYears;

  // Re-assign the render to use extended years
  renderTableExtended();
  bindInputs();

  document.getElementById('addYearBtn').addEventListener('click', () => {
    addYearExtended();
    bindInputs();
  });

  document.getElementById('saveCustomBtn').addEventListener('click', saveAll);
}

function renderTableExtended() {
  const years = getAllYearsWithCustom();
  const custom = loadCustom();
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');

  thead.innerHTML = `
    <th class="col-year">Jaar</th>
    ${indices.map(key =>
      `<th class="col-index">${marketData[key].name}</th>`
    ).join('')}
    <th class="col-custom">Eigen data (%)</th>
  `;

  tbody.innerHTML = years.map(year => {
    const cells = indices.map(key => {
      const val = marketData[key].returns[year];
      const cls = val == null ? '' : val >= 0 ? 'positive' : 'negative';
      return `<td class="cell-return ${cls}">${val != null ? formatReturn(val) : '—'}</td>`;
    }).join('');

    const customVal = custom[year] != null ? custom[year] : '';

    return `
      <tr data-year="${year}">
        <td class="cell-year">${year}</td>
        ${cells}
        <td class="cell-custom">
          <input type="number"
                 class="custom-input"
                 data-year="${year}"
                 value="${customVal}"
                 step="0.01"
                 placeholder="—"
          />
        </td>
      </tr>
    `;
  }).join('');
}

function addYearExtended() {
  const years = getAllYearsWithCustom();
  const lastYear = years[years.length - 1];
  const newYear = lastYear + 1;

  const custom = loadCustom();
  if (custom[newYear] == null) {
    custom[newYear] = '';
    saveCustom(custom);
  }

  renderTableExtended();
  showStatus(`Jaar ${newYear} toegevoegd`);

  const lastRow = document.querySelector(`tr[data-year="${newYear}"]`);
  if (lastRow) lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', init);
