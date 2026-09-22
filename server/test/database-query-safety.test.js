const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.join(__dirname, '../src');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : entry.name.endsWith('.js') ? [target] : [];
  });
}

test('server source does not use unsafe or handwritten database queries', () => {
  const forbidden = [
    /\$queryRawUnsafe\b/,
    /\$executeRawUnsafe\b/,
    /\$queryRaw\b/,
    /\$executeRaw\b/,
    /Prisma\.raw\b/,
  ];

  for (const file of sourceFiles(sourceRoot)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path.relative(sourceRoot, file)} must use Prisma's parameterized model API`);
    }
  }
});
