const fs = require('fs');

function checkFilesExistence() {
  return new Promise((resolve, reject) => {
    try {
      const itemsToCheck = ['../afters.json', '../global_url_logs.json'];
      itemsToCheck.forEach(item => {
        if (!fs.existsSync(item)) {
          fs.writeFileSync(item, JSON.stringify([]));
          console.log(`${item} created.`);
        }
      });
      resolve({ check: true, error: null });
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', error);
      reject({ check: false, error: error });
    }
  });
}

module.exports = { checkFilesExistence };