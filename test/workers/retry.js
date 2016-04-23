'use strict';

try {
    fs.readFileSync('./retry.test');
} catch(e) {
    fs.writeFileSync('./retry.test', '');
    process.exit(1);
}

