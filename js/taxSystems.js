/**
 * Box 3 Tax Calculation Systems
 *
 * Each calculation returns tax in EUR (>= 0).
 * The simulation supplies portfolioValue as the peildatum/base for that year.
 */

function getPartnerMultiplier(config = {}) {
  const raw = Number(config.partnerMultiplier);
  return Number.isFinite(raw) && raw > 1 ? 2 : 1;
}

function normalizeAllocations(allocSavings, allocInvest, allocDebt) {
  const savings = Math.max(0, Number(allocSavings) || 0);
  const invest = Math.max(0, Number(allocInvest) || 0);
  const debt = Math.max(0, Number(allocDebt) || 0);
  const total = savings + invest + debt;

  if (total <= 0) {
    return { savingsShare: 0, investShare: 0, debtShare: 0 };
  }

  return {
    savingsShare: savings / total,
    investShare: invest / total,
    debtShare: debt / total
  };
}

/**
 * No Tax — always returns 0
 */
export function calcNoTax() {
  return 0;
}

/**
 * Old System (pre-2017)
 * - Fixed 4% deemed return
 * - Tax rate: 30%
 * - Single heffingsvrij vermogen setting
 */
export function calcOldSystem(portfolioValue, actualReturn, config) {
  const {
    deemedReturn = 4,  // %
    taxRate = 30,      // %
    exemption = 21139 // € per person
  } = config;

  const partnerMultiplier = getPartnerMultiplier(config);
  const effectiveExemption = exemption * partnerMultiplier;

  const taxableWealth = Math.max(0, portfolioValue - effectiveExemption);
  const deemedIncome = taxableWealth * (deemedReturn / 100);
  const tax = deemedIncome * (taxRate / 100);

  return Math.max(0, tax);
}

/**
 * Year-specific parameters for the 2017-2022 "oude methode"
 * Source: https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/oude-berekening-box-3-inkomen
 */
const oldMethodParams = {
  2017: {
    bracket1Limit: 75000,
    bracket2Limit: 975000,
    savingsRate: 1.63,
    investRate: 5.39,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 30,
    exemption: 25000
  },
  2018: {
    bracket1Limit: 70801,
    bracket2Limit: 978001,
    savingsRate: 0.36,
    investRate: 5.38,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 30,
    exemption: 30000
  },
  2019: {
    bracket1Limit: 71651,
    bracket2Limit: 989737,
    savingsRate: 0.13,
    investRate: 5.59,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 30,
    exemption: 30360
  },
  2020: {
    bracket1Limit: 72798,
    bracket2Limit: 1005573,
    savingsRate: 0.07,
    investRate: 5.28,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 30,
    exemption: 30846
  },
  2021: {
    bracket1Limit: 50001,
    bracket2Limit: 950001,
    savingsRate: 0.03,
    investRate: 5.69,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 31,
    exemption: 50000
  },
  2022: {
    bracket1Limit: 50651,
    bracket2Limit: 962351,
    savingsRate: -0.01,
    investRate: 5.53,
    brackets: [
      { savingsShare: 0.67, investShare: 0.33 },
      { savingsShare: 0.21, investShare: 0.79 },
      { savingsShare: 0.00, investShare: 1.00 }
    ],
    taxRate: 31,
    exemption: 50650
  }
};

/**
 * Old Method System (2017-2022)
 * - 3 brackets with fictitious savings/investment mix
 * - Parameters come from config (user-editable), not year lookup
 */
export function calcOldMethodSystem(portfolioValue, actualReturn, config) {
  const {
    taxRate = 31,
    exemption = 50650,
    savingsRate = -0.01,
    investRate = 5.53,
    bracket1Limit = 50651,
    bracket2Limit = 962351
  } = config;

  // Fixed bracket mix ratios (67/33, 21/79, 0/100)
  const brackets = [
    { savingsShare: 0.67, investShare: 0.33 },
    { savingsShare: 0.21, investShare: 0.79 },
    { savingsShare: 0.00, investShare: 1.00 }
  ];

  const partnerMultiplier = getPartnerMultiplier(config);
  const effectiveExemption = exemption * partnerMultiplier;

  const grondslag = Math.max(0, portfolioValue - effectiveExemption);
  if (grondslag <= 0) return 0;

  // Distribute grondslag over 3 brackets
  const bracket1Amount = Math.min(grondslag, bracket1Limit);
  const bracket2Amount = Math.min(Math.max(0, grondslag - bracket1Limit), bracket2Limit - bracket1Limit);
  const bracket3Amount = Math.max(0, grondslag - bracket2Limit);

  // Calculate fictitious return per bracket
  let totalFictitiousReturn = 0;

  const bracketAmounts = [bracket1Amount, bracket2Amount, bracket3Amount];
  for (let i = 0; i < 3; i++) {
    const amount = bracketAmounts[i];
    if (amount <= 0) continue;
    const b = brackets[i];
    const fictitiousReturn = amount * (
      b.savingsShare * (savingsRate / 100) +
      b.investShare * (investRate / 100)
    );
    totalFictitiousReturn += fictitiousReturn;
  }

  if (totalFictitiousReturn <= 0) return 0;

  const tax = totalFictitiousReturn * (taxRate / 100);
  return Math.max(0, tax);
}

/**
 * Current System (overbruggingswet, illustrative)
 * - Fictitious return by category (savings, investments, debts)
 * - Debt threshold and heffingsvrij vermogen included
 * - Fiscal partner doubles relevant thresholds
 */
export function calcCurrentSystem(portfolioValue, actualReturn, config) {
  const {
    taxRate = 36,            // %
    exemption = 59357,       // € per person
    debtThreshold = 3800,    // € per person
    savingsRate = 1.28,      // %
    investRate = 6.00,       // %
    debtRate = 2.70,         // %
    allocSavings = 0,        // %
    allocInvest = 100,       // %
    allocDebt = 0            // %
  } = config;

  const totalWealth = Math.max(0, portfolioValue);
  if (totalWealth <= 0) return 0;

  const partnerMultiplier = getPartnerMultiplier(config);
  const effectiveExemption = exemption * partnerMultiplier;
  const effectiveDebtThreshold = debtThreshold * partnerMultiplier;

  const { savingsShare, investShare, debtShare } = normalizeAllocations(
    allocSavings,
    allocInvest,
    allocDebt
  );

  if (savingsShare === 0 && investShare === 0 && debtShare === 0) return 0;

  const savingsPortion = totalWealth * savingsShare;
  const investPortion = totalWealth * investShare;
  const debtPortion = totalWealth * debtShare;
  const deductibleDebt = Math.max(0, debtPortion - effectiveDebtThreshold);

  const belastbaarRendement =
    savingsPortion * (savingsRate / 100) +
    investPortion * (investRate / 100) -
    deductibleDebt * (debtRate / 100);
  if (belastbaarRendement <= 0) return 0;

  const rendementsgrondslag = savingsPortion + investPortion - deductibleDebt;
  if (rendementsgrondslag <= 0) return 0;

  const grondslagSparenBeleggen = Math.max(0, rendementsgrondslag - effectiveExemption);
  if (grondslagSparenBeleggen <= 0) return 0;

  const aandeelInRendementsgrondslag = Math.min(1, grondslagSparenBeleggen / rendementsgrondslag);
  const voordeelUitSparenBeleggen = belastbaarRendement * aandeelInRendementsgrondslag;
  const tax = voordeelUitSparenBeleggen * (taxRate / 100);

  return Math.max(0, tax);
}

/**
 * Future System (2028+ proposal)
 * - Step 1: determine income after heffingsvrij resultaat
 * - Step 2: simulation handles carry-forward loss set-off
 * - Step 3: this function applies the tax rate to taxable income
 */
export function calcFutureIncome(actualReturn, config) {
  const {
    freeReturn = 1800 // € per person
  } = config;

  // Heffingsvrij resultaat only reduces positive outcomes.
  if (actualReturn <= 0) return actualReturn;

  const partnerMultiplier = getPartnerMultiplier(config);
  const effectiveFreeReturn = freeReturn * partnerMultiplier;
  return Math.max(0, actualReturn - effectiveFreeReturn);
}

export function calcFutureSystem(portfolioValue, taxableIncome, config) {
  const {
    taxRate = 36 // %
  } = config;

  const tax = Math.max(0, taxableIncome) * (taxRate / 100);
  return Math.max(0, tax);
}

/**
 * Get default config for each system
 */
export function getDefaultConfigs() {
  return {
    noTax: {},
    old: {
      deemedReturn: 4,
      taxRate: 30,
      exemption: 21139,
      partnerMultiplier: 1
    },
    oldMethod: {
      taxRate: 31,
      exemption: 50650,
      savingsRate: -0.01,
      investRate: 5.53,
      bracket1Limit: 50651,
      bracket2Limit: 962351,
      partnerMultiplier: 1
    },
    current: {
      taxRate: 36,
      exemption: 59357,
      debtThreshold: 3800,
      savingsRate: 1.28,
      investRate: 6.00,
      debtRate: 2.70,
      allocSavings: 0,
      allocInvest: 100,
      allocDebt: 0,
      partnerMultiplier: 1
    },
    future: {
      taxRate: 36,
      freeReturn: 1800,
      lossThreshold: 500,
      partnerMultiplier: 1
    }
  };
}
