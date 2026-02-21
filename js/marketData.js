/**
 * Historical market return data (total return including dividends)
 * All returns in percent (e.g., 15.79 = 15.79%)
 */

export const marketData = {
  sp500: {
    name: "S&P 500 (Total Return)",
    currency: "USD",
    returns: {
      1988: 16.61,
      1989: 31.69,
      1990: -3.10,
      1991: 30.47,
      1992: 7.62,
      1993: 10.08,
      1994: 1.32,
      1995: 37.58,
      1996: 22.96,
      1997: 33.36,
      1998: 28.58,
      1999: 21.04,
      2000: -9.10,
      2001: -11.89,
      2002: -22.10,
      2003: 28.68,
      2004: 10.88,
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
      2025: 17.88,
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
      2025: 11.18,
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
      2025: 22.34,
    },
  },

  ethereum: {
    name: "Ethereum (ETH)",
    currency: "USD",
    returns: {
      2016: 756.99,
      2017: 9394.73,
      2018: -82.38,
      2019: -2.82,
      2020: 469.25,
      2021: 399.14,
      2022: -67.55,
      2023: 90.92,
      2024: 46.08,
      2025: -10.96,
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

/**
 * Dutch CPI — Annual rate of change (%) since 1980
 * Source: CBS (Centraal Bureau voor de Statistiek)
 */
export const cpiData = {
  1980: 6.5,
  1981: 6.7,
  1982: 6.0,
  1983: 2.8,
  1984: 3.3,
  1985: 2.3,
  1986: 0.2,
  1987: -0.5,
  1988: 0.7,
  1989: 1.1,
  1990: 2.5,
  1991: 3.9,
  1992: 3.7,
  1993: 2.1,
  1994: 2.7,
  1995: 2.0,
  1996: 2.1,
  1997: 2.2,
  1998: 2.0,
  1999: 2.2,
  2000: 2.6,
  2001: 4.5,
  2002: 3.4,
  2003: 2.1,
  2004: 1.2,
  2005: 1.7,
  2006: 1.1,
  2007: 1.6,
  2008: 2.5,
  2009: 1.2,
  2010: 1.3,
  2011: 2.3,
  2012: 2.5,
  2013: 2.5,
  2014: 1.0,
  2015: 0.6,
  2016: 0.3,
  2017: 1.4,
  2018: 1.7,
  2019: 2.6,
  2020: 1.3,
  2021: 2.7,
  2022: 10.0,
  2023: 3.8,
  2024: 3.3,
  2025: 3.3,
};

/**
 * Get CPI rate for a given year, returns 0 if not available
 */
export function getCpiForYear(year) {
  return cpiData[year] ?? 0;
}
