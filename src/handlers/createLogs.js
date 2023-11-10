const fs = require('fs');
const path = require('path');

async function appendValues(values, page) {
  fs.readFile(path.join(__dirname, '../global_url_logs.json'), 'utf-8', (error, data) => {
    if (error) return console.log('\x1b[31m%s\x1b[0m', error);
    try {
      const jsonData = JSON.parse(data);
      if (!jsonData[page]) jsonData[page] = [];
      jsonData[page] = jsonData[page].concat(values);
      fs.writeFileSync(path.join(__dirname, '../global_url_logs.json'), JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (parseError) {
      console.log('\x1b[31m%s\x1b[0m', `[!] Error parsing JSON ${parseError}`);
    }
  });
}

module.exports = { appendValues };