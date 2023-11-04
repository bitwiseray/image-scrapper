const fs = require('fs');

async function saveAfter(aftersString, page) {
  let obj = {};
  try {
    const existingData = fs.readFileSync('../afters.json', 'utf-8');
    obj = JSON.parse(existingData);
  } catch (err) {
    console.error(err);
  }
  obj[page] = aftersString;
  let formObj = JSON.stringify(obj, null, 2);
  fs.writeFileSync('afters.json', formObj);
}

module.exports = { saveAfter };