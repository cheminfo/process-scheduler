'use strict';

process.on('message', function () {
  throw new Error('error');
});

