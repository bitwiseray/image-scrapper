const fs = require('fs');

function checkFilesExistence() {
  return new Promise((resolve, reject) => {
    try {
      const itemsToCheck = {
        files: ['../afters.json', '../global_url_logs.json'],
        folders: ['../output']
      };
      for (const itemType of Object.keys(itemsToCheck)) {
        if (itemsToCheck.hasOwnProperty(itemType)) {
          for (const item of itemsToCheck[itemType]) {
            if (!fs.existsSync(item)) {
              if (itemType === 'files') {
                fs.writeFileSync(item, '[]', 'utf8');
              } else if (itemType === 'folders') {
                fs.mkdirSync(item);
              }
              console.log('\x1b[33m%s\x1b[0m', `[!] New system files that were originally missing were created.`);
              resolve({ check: true, error: null });
            }
          }
        }
      }
      resolve({ check: true, error: null });
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', error);
      reject({ check: false, error: error });
    }
  });
}

module.exports = { checkFilesExistence };