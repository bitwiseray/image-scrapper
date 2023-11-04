const fs = require('fs');

function checkFilesExistence() {
  try {
    const itemsToCheck = {
      files: ['afters.json', 'global_url_logs.json'],
      folders: ['output']
    };
    for (const itemType in itemsToCheck) {
      itemsToCheck[itemType].forEach((item) => {
        const path = itemType === 'files' ? item : `../${item}`;
        if (!fs.existsSync(path)) {
          if (itemType === 'files') {
            fs.writeFileSync(item, '[]', 'utf8');
          } else if (itemType === 'folders') {
            fs.mkdirSync(item);
          }
          console.log('\x1b[33m%s\x1b[0m', `[!] New system files that were originally missing were created.`);
        }
      });
    }
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', error);
  }
}

module.exports = { checkFilesExistence };