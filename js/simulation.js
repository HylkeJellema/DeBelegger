/**
 * Simulation Engine
 *
 * Runs a year-by-year simulation of portfolio growth under 4 tax regimes,
 * using historical market return data.
 */

import { calcNoTax, calcOldSystem, calcCurrentSystem, calcFutureSystem } from './taxSystems.js';

/**
 * Run the full simulation
 *
 * @param {number} startCapital - Initial investment amount in EUR
 * @param {Array<{year: number, return: number}>} returns - Array of yearly returns
 * @param {Object} configs - Tax system configs { noTax, old, current, future }
 * @returns {Object} Simulation results with arrays for each chart
 */
export function runSimulation(startCapital, returns, configs) {
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
    const yearReturn = returns[i].return / 100; // convert % to decimal

    for (const sys of systems) {
      const prevValue = portfolioValues[sys][i];

      // Apply market return
      const returnAmount = prevValue * yearReturn;
      const valueAfterReturn = prevValue + returnAmount;

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
          // Future system: tax on actual return with loss carry-forward.
          // futureCarryForwardLoss is >= 0 and represents accumulated
          // losses from prior years that may offset future gains.

          if (returnAmount <= 0) {
            // Loss year — accumulate loss for carry-forward, no tax due.
            futureCarryForwardLoss += Math.abs(returnAmount);
            tax = 0;
          } else {
            // Gain year — offset against any carried-forward losses first.
            const netReturn = returnAmount - futureCarryForwardLoss;
            if (netReturn <= 0) {
              // Gain not enough to cover prior losses; keep the remainder.
              futureCarryForwardLoss = Math.abs(netReturn);
              tax = 0;
            } else {
              // Losses fully absorbed; tax the remaining gain.
              futureCarryForwardLoss = 0;
              tax = calcFutureSystem(valueAfterReturn, netReturn, configs.future);
            }
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
