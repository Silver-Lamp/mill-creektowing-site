const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Service Areas Section', () => {
  let document;
  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
    const dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have service areas alphabetized top-to-bottom, left-to-right', () => {
    const columns = Array.from(document.querySelectorAll('.service-areas-column'));
    expect(columns.length).toBe(2);
    const col1 = Array.from(columns[0].querySelectorAll('.service-area-item')).map(e => e.textContent.trim());
    const col2 = Array.from(columns[1].querySelectorAll('.service-area-item')).map(e => e.textContent.trim());
    // Merge columns top-to-bottom, left-to-right
    const merged = [];
    const maxLen = Math.max(col1.length, col2.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < col1.length) merged.push(col1[i]);
      if (i < col2.length) merged.push(col2[i]);
    }
    const sorted = [...merged].sort((a, b) => a.localeCompare(b));
    expect(merged).toEqual(sorted);
  });

  it('should bold the main city (Eleva)', () => {
    const bolded = document.querySelector('.service-areas-column strong');
    expect(bolded).not.toBeNull();
    expect(bolded.textContent.trim()).toBe('Eleva');
  });
}); 