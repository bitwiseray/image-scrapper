const fs = require('fs');
const path = require('path');

async function appendValues(page, values) {
  const currentDate = new Date().toJSON();
  fs.readFile(path.join(__dirname, '..', 'global_url_logs.json'), 'utf-8', (error, data) => {
    if (error) return console.log('\x1b[31m%s\x1b[0m', `[×] Something went wrong while trying to read the logs file: \n${error}`);
    try {
      const jsonData = JSON.parse(data);
      if (!jsonData[page]) jsonData[page] = [];
      const valuesWithDate = Array.isArray(values) ? values.map(url => ({ url, date: currentDate })) : [];
      jsonData[page] = jsonData[page].concat(valuesWithDate);
      fs.writeFileSync(path.join(__dirname, '..', 'global_url_logs.json'), JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (parseError) {
      console.log('\x1b[31m%s\x1b[0m', `[×] Error parsing JSON: ${parseError}`);
    }
  });
}

module.exports = { appendValues };