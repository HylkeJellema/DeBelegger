/**
 * Excel Upload Handler
 * Parses uploaded .xlsx/.csv files with columns: Year, Return (%)
 */

import * as XLSX from 'xlsx';

/**
 * Parse an uploaded file and extract return data
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} Parsed data: { name, returns: { year: returnPct, ... } }
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          reject(new Error('Het Excel bestand is leeg.'));
          return;
        }

        // Find Year and Return columns (case-insensitive)
        const firstRow = rows[0];
        const keys = Object.keys(firstRow);

        const yearKey = keys.find(k =>
          k.toLowerCase().includes('year') ||
          k.toLowerCase().includes('jaar')
        );
        const returnKey = keys.find(k =>
          k.toLowerCase().includes('return') ||
          k.toLowerCase().includes('rendement') ||
          k.toLowerCase() === '%'
        );

        if (!yearKey || !returnKey) {
          reject(new Error(
            'Kolommen niet gevonden. Zorg dat je kolommen hebt genaamd "Year" en "Return".'
          ));
          return;
        }

        const returns = {};
        for (const row of rows) {
          const year = parseInt(row[yearKey]);
          let ret = parseFloat(row[returnKey]);

          if (isNaN(year) || isNaN(ret)) continue;

          // If returns look like decimals (e.g., 0.15), convert to percentage
          if (Math.abs(ret) < 1 && Math.abs(ret) > 0) {
            ret = ret * 100;
          }

          returns[year] = ret;
        }

        if (Object.keys(returns).length === 0) {
          reject(new Error('Geen geldige data gevonden in het bestand.'));
          return;
        }

        resolve({
          name: `Eigen data (${file.name})`,
          currency: 'EUR',
          returns
        });
      } catch (err) {
        reject(new Error(`Bestand kon niet worden gelezen: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Bestand kon niet worden geopend.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate and download a template Excel file
 */
export function downloadTemplate() {
  const templateData = [
    { Year: 2015, 'Return (%)': 1.38 },
    { Year: 2016, 'Return (%)': 11.96 },
    { Year: 2017, 'Return (%)': 21.83 },
    { Year: 2018, 'Return (%)': -4.38 },
    { Year: 2019, 'Return (%)': 31.49 },
    { Year: 2020, 'Return (%)': 18.40 },
    { Year: 2021, 'Return (%)': 28.71 },
    { Year: 2022, 'Return (%)': -18.11 },
    { Year: 2023, 'Return (%)': 26.29 },
    { Year: 2024, 'Return (%)': 25.02 },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Returns');

  XLSX.writeFile(wb, 'box3_returns_template.xlsx');
}
