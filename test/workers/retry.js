'use strict';

const fs = require('fs');

try {
  fs.readFileSync('./retry.test');
  fs.unlinkSync('./retry.test');
} catch (e) {
  fs.writeFileSync('./retry.test', '');
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
