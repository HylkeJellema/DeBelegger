/**
 * Box 3 Tax Calculation Systems
 *
 * Each function takes:
 *  - portfolioValue: current portfolio value in EUR
 *  - actualReturn: actual return amount in EUR for this year
 *  - config: system-specific configuration object
 *
 * Returns: tax amount in EUR (>= 0)
 */

/**
 * No Tax — always returns 0
 */
export function calcNoTax() {
  return 0;
}

/**
 * Old System (pre-2017)
 * - Fixed 4% deemed return on taxable wealth
 * - Tax rate: 30%
 * - Exemption: ~€21,139 (heffingsvrij vermogen)
 * - Effective rate: 1.2% on wealth above exemption
 */
export function calcOldSystem(portfolioValue, actualReturn, config) {
  const {
    deemedReturn = 4,       // %
    taxRate = 30,            // %
    exemption = 21139        // €
  } = config;

  const taxableWealth = Math.max(0, portfolioValue - exemption);
  const deemedIncome = taxableWealth * (deemedReturn / 100);
  const tax = deemedIncome * (taxRate / 100);

  return Math.max(0, tax);
}

/**
 * Current System (2024-2027)
 * - Three categories with different fictitious return rates
 * - Tax rate: 36%
 * - Exemption: €57,684
 * - Categories: savings (1.44%), investments (5.88%), debts (deducted at 2.62%)
 * - Default: 100% in investments
 */
export function calcCurrentSystem(portfolioValue, actualReturn, config) {
  const {
    taxRate = 36,            // %
    exemption = 57684,       // €
    savingsRate = 1.44,      // % fictitious return on savings
    investRate = 5.88,       // % fictitious return on investments
    debtRate = 2.62,         // % fictitious deduction for debts
    allocSavings = 0,        // % of wealth in savings
    allocInvest = 100,       // % of wealth in investments
    allocDebt = 0            // % of wealth in debts
  } = config;

  const taxableWealth = Math.max(0, portfolioValue - exemption);
  if (taxableWealth <= 0) return 0;

  // Calculate weighted fictitious return
  const savingsPortion = taxableWealth * (allocSavings / 100);
  const investPortion = taxableWealth * (allocInvest / 100);
  const debtPortion = taxableWealth * (allocDebt / 100);

  const fictIncome =
    savingsPortion * (savingsRate / 100) +
    investPortion * (investRate / 100) -
    debtPortion * (debtRate / 100);

  const tax = Math.max(0, fictIncome) * (taxRate / 100);
  return Math.max(0, tax);
}

/**
 * Future System (2028+)
 * - Tax on actual returns
 * - Tax rate: 36%
 * - Heffingsvrij resultaat: €1,800
 *   • result ≤ 0        → taxable = 0 (don't create extra negative)
 *   • 0 < result < 1800 → taxable = 0
 *   • result ≥ 1800     → taxable = result − 1800
 * - Loss carry forward is handled in the simulation loop (simulation.js)
 */
export function calcFutureSystem(portfolioValue, actualReturn, config) {
  const {
    taxRate = 36,            // %
    freeReturn = 1800        // € heffingsvrij resultaat
  } = config;

  // Only apply heffingsvrij when actual return is positive;
  // never let the deduction create a negative taxable amount.
  if (actualReturn <= 0) return 0;

  const taxableReturn = Math.max(0, actualReturn - freeReturn);
  const tax = taxableReturn * (taxRate / 100);

  return tax;
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
      exemption: 21139
    },
    current: {
      taxRate: 36,
      exemption: 57684,
      savingsRate: 1.44,
      investRate: 5.88,
      debtRate: 2.62,
      allocSavings: 0,
      allocInvest: 100,
      allocDebt: 0
    },
    future: {
      taxRate: 36,
      freeReturn: 1800
    }
  };
}
