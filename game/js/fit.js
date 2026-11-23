// fit.js — Step 81: one rule for fitting text
// Fit = { rows(text, n), cut(text, n), name(text, n), pages(text, n, k) }
const Fit = {
  rows(text, n) {
    const out = [];
    String(text).split('\n').forEach((part) => {
      let row = '';
      part.split(' ').forEach((word) => {
        if (word === '') return;
        while (word.length > n) {
          if (row !== '') { out.push(row); row = ''; }
          out.push(word.slice(0, n));
          word = word.slice(n);
        }
        if (row === '') { row = word; }
        else if ((row + ' ' + word).length <= n) { row += ' ' + word; }
        else { out.push(row); row = word; }
      });
      if (row !== '') { out.push(row); }
    });
    return out;
  },

  cut(text, n) {
    if (text.length <= n) return text;
    let first = Fit.rows(text, n)[0];
    // Remove trailing comma, semicolon, colon, or space
    first = first.replace(/[;,:\s]+$/, '');
    return first;
  },

  name(text, n) {
    const s = Fit.cut(text, n);
    if (s.length >= text.length) return s;
    // Remove loose words at the end: comma, or space + one of the/of/and/a
    let result = s;
    let prev;
    do {
      prev = result;
      result = result.replace(/(,|\s+(the|of|and|a))+$/i, '');
    } while (result !== prev);
    return result;
  },

  pages(text, n, k) {
    const rows = Fit.rows(text, n);
    if (rows.length === 0) return [];
    const count = Math.ceil(rows.length / k);
    const base = Math.floor(rows.length / count);
    const extra = rows.length % count;
    const pages = [];
    let idx = 0;
    for (let p = 0; p < count; p++) {
      const sz = base + (p < extra ? 1 : 0);
      pages.push(rows.slice(idx, idx + sz).join('\n'));
      idx += sz;
    }
    return pages;
  }
};
