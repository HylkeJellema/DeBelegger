/**
 * Historical market return data (total return including dividends)
 * All returns in percent (e.g., 15.79 = 15.79%)
 */

export const marketData = {
  sp500: {
    name: "S&P 500 (Total Return)",
    currency: "USD",
    returns: {
      2005: 4.91,
      2006: 15.79,
      2007: 5.49,
      2008: -37.0,
      2009: 26.46,
      2010: 15.06,
      2011: 2.11,
      2012: 16.0,
      2013: 32.39,
      2014: 13.69,
      2015: 1.38,
      2016: 11.96,
      2017: 21.83,
      2018: -4.38,
      2019: 31.49,
      2020: 18.4,
      2021: 28.71,
      2022: -18.11,
      2023: 26.29,
      2024: 25.02,
      2025: 4.5,
    },
  },

  aex: {
    name: "AEX (Gross Return)",
    currency: "EUR",
    returns: {
      2005: 28.01,
      2006: 17.35,
      2007: 7.94,
      2008: -50.4,
      2009: 41.8,
      2010: 8.9,
      2011: -9.4,
      2012: 16.2,
      2013: 21.2,
      2014: 9.8,
      2015: 7.4,
      2016: 12.7,
      2017: 16.1,
      2018: -8.5,
      2019: 28.6,
      2020: 5.4,
      2021: 30.3,
      2022: -11.7,
      2023: 18.6,
      2024: 14.5,
      2025: 5.3,
    },
  },

  allworld: {
    name: "MSCI All World (Total Return)",
    currency: "USD",
    returns: {
      2005: 11.37,
      2006: 21.53,
      2007: 12.18,
      2008: -42.19,
      2009: 34.63,
      2010: 12.67,
      2011: -7.35,
      2012: 16.13,
      2013: 22.8,
      2014: 4.16,
      2015: -2.36,
      2016: 7.86,
      2017: 23.97,
      2018: -9.41,
      2019: 26.6,
      2020: 16.25,
      2021: 18.54,
      2022: -18.36,
      2023: 22.2,
      2024: 17.49,
      2025: 3.0,
    },
  },
};

/**
 * Get sorted years available for a given index
 */
export function getAvailableYears(indexKey) {
  const data = marketData[indexKey];
  if (!data) return [];
  return Object.keys(data.returns)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Get returns for a specific index and year range
 */
export function getReturns(indexKey, startYear, endYear) {
  const data = marketData[indexKey];
  if (!data) return [];

  const years = getAvailableYears(indexKey);
  return years
    .filter((y) => y >= startYear && y <= endYear)
    .map((y) => ({ year: y, return: data.returns[y] }));
}
