/**
 * Simulation Engine
 *
 * Runs a year-by-year simulation of portfolio growth under 4 tax regimes,
 * using historical market return data.
 */

import {
  calcNoTax,
  calcOldSystem,
  calcCurrentSystem,
  calcFutureIncome,
  calcFutureSystem
} from './taxSystems.js';

/**
 * Run the full simulation
 *
 * @param {number} startCapital - Initial investment amount in EUR
 * @param {Array<{year: number, return: number}>} returns - Array of yearly returns
 * @param {Object} configs - Tax system configs { noTax, old, current, future }
 * @param {Object|number} contributionsByYear - Map of { year: monthlyAmount } or a flat number for backwards compat
 * @returns {Object} Simulation results with arrays for each chart
 */
export function runSimulation(startCapital, returns, configs, contributionsByYear = 0) {
  // Support both old flat number and new per-year map
  const isMap = typeof contributionsByYear === 'object' && contributionsByYear !== null;
  const years = returns.map(r => r.year);

  // Initialize tracking arrays
  const systems = ['noTax', 'old', 'current', 'future'];
  const portfolioValues = {};
  const annualTax = {};
  const cumulativeTax = {};

  // Loss carry forward for future system
  let futureCarryForwardLoss = 0;

  for (const sys of systems) {
    portfolioValues[sys] = [startCapital]; // starting value at year 0
    annualTax[sys] = [];
    cumulativeTax[sys] = [];
  }

  for (let i = 0; i < returns.length; i++) {
    const yearKey = returns[i].year;
    const deposit = isMap
      ? Math.max(0, Number(contributionsByYear[yearKey]) || 0)
      : Math.max(0, Number(contributionsByYear) || 0);
    const annualRate = returns[i].return / 100; // convert % to decimal
    const annualFactor = 1 + annualRate;
    const monthlyFactor = annualFactor <= 0 ? 0 : Math.pow(annualFactor, 1 / 12);
    const contributionsThisYear = deposit * 12;

    for (const sys of systems) {
      const prevValue = portfolioValues[sys][i]; // peildatum / start-of-year wealth

      // Apply market return with optional monthly contributions (end of month).
      // When deposit is 0, use the direct annual return for parity with old behavior.
      let valueAfterReturn;
      if (deposit <= 0) {
        valueAfterReturn = prevValue * annualFactor;
      } else {
        let value = prevValue;
        for (let m = 0; m < 12; m++) {
          value *= monthlyFactor;
          value += deposit;
        }
        valueAfterReturn = value;
      }

      // Return excluding contributions (deposits are not investment return)
      const returnAmount = valueAfterReturn - prevValue - contributionsThisYear;

      // Calculate tax
      let tax = 0;
      switch (sys) {
        case 'noTax':
          tax = calcNoTax();
          break;
        case 'old':
          // Use prevValue (peildatum / start-of-year wealth) as tax base.
          // The old system taxes deemed return on wealth at 1 January,
          // so we use the portfolio value before this year's market return.
          tax = calcOldSystem(prevValue, returnAmount, configs.old);
          break;
        case 'current':
          // Same peildatum logic: tax is based on wealth at 1 January.
          tax = calcCurrentSystem(prevValue, returnAmount, configs.current);
          break;
        case 'future': {
          // Proposal order:
          // 1) apply heffingsvrij resultaat to positive annual return
          // 2) offset positive income with carry-forward losses
          // 3) register a new loss only if annual loss exceeds threshold
          const incomeBeforeLossSetoff = calcFutureIncome(returnAmount, configs.future);
          const partnerMultiplier = Number(configs.future.partnerMultiplier) > 1 ? 2 : 1;
          const lossThreshold = (Number(configs.future.lossThreshold) || 500) * partnerMultiplier;

          if (incomeBeforeLossSetoff < 0) {
            const recognisedLoss = Math.abs(incomeBeforeLossSetoff);
            if (recognisedLoss > lossThreshold) {
              futureCarryForwardLoss += recognisedLoss;
            }
            tax = 0;
          } else if (incomeBeforeLossSetoff === 0) {
            tax = 0;
          } else {
            const lossUsed = Math.min(futureCarryForwardLoss, incomeBeforeLossSetoff);
            futureCarryForwardLoss -= lossUsed;

            const taxableIncome = incomeBeforeLossSetoff - lossUsed;
            tax = calcFutureSystem(valueAfterReturn, taxableIncome, configs.future);
          }
          break;
        }
      }

      // Don't let tax exceed the portfolio value
      tax = Math.min(tax, Math.max(0, valueAfterReturn));

      const valueAfterTax = valueAfterReturn - tax;

      portfolioValues[sys].push(valueAfterTax);
      annualTax[sys].push(tax);

      const prevCumTax = cumulativeTax[sys].length > 0
        ? cumulativeTax[sys][cumulativeTax[sys].length - 1]
        : 0;
      cumulativeTax[sys].push(prevCumTax + tax);
    }
  }

  // Labels: start year - 1 (initial), then each year
  const labels = [years.length > 0 ? years[0] - 1 : 'Start', ...years];
  const taxLabels = [...years]; // tax arrays don't have the initial entry

  return {
    labels,
    taxLabels,
    portfolioValues,
    annualTax,
    cumulativeTax,
    systems
  };
}
