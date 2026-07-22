function flattenValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsvValue(value) {
  const stringValue = flattenValue(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function collectHeaders(rows) {
  const headers = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => headers.add(key));
  });

  return Array.from(headers);
}

export function rowsToCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  const headers = collectHeaders(rows);
  const headerLine = headers.map(escapeCsvValue).join(',');
  const dataLines = rows.map((row) => (
    headers.map((header) => escapeCsvValue(row?.[header])).join(',')
  ));

  return [headerLine, ...dataLines].join('\n');
}

export function downloadCsv(rows, filename) {
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
