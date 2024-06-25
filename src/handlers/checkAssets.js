const fs = require('fs');
const path = require('path');

function checkFilesExistence() {
  return new Promise((resolve, reject) => {
    try {
      const itemsToCheck = [path.join(__dirname, '..', 'afters.json'), path.join(__dirname, '..', 'global_url_logs.json')];
      itemsToCheck.forEach(item => {
        if (!fs.existsSync(item)) {
          fs.writeFileSync(item, JSON.stringify({}));
          console.log('\x1b[33m%s\x1b[0m', `[!] Important files that were missing were recreated.`);
        }
      });
      resolve({ check: true, error: null });
    } catch (error) {
      reject({ check: false, error: error });
    }
  });
}

module.exports = { checkFilesExistence };