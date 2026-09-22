const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const clientSource = path.join(__dirname, '../../client/src');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : /\.[jt]sx?$/.test(entry.name) ? [target] : [];
  });
}

test('client source never renders raw HTML', () => {
  const forbidden = [
    /dangerouslySetInnerHTML\b/,
    /\.innerHTML\s*=/,
    /\.outerHTML\s*=/,
    /insertAdjacentHTML\s*\(/,
    /document\.write\s*\(/,
    /\bsrcDoc\s*=/,
  ];

  for (const file of sourceFiles(clientSource)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path.relative(clientSource, file)} must render data through escaped React children and attributes`);
    }
  }
});
