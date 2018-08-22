'use strict';

process.on('message', function (data) {
  setTimeout(function () {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }, data.timeout);
});
