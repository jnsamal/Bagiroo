// Minimal dependency-free CSV parser — handles quoted fields (including
// embedded commas and escaped quotes) without pulling in an extra package
// for what the admin bulk-import needs.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      // skip — handled by \n
    } else {
      field += char;
    }
  }
  if (field.length || row.length) pushRow();

  const [header, ...dataRows] = rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
  return dataRows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

module.exports = { parseCsv };
