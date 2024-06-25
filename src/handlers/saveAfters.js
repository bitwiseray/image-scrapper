const fs = require('fs');
const path = require('path')

async function saveAfter(aftersString, page) {
  let obj = {};
  try {
    const existingData = fs.readFileSync(path.join(__dirname, '..', 'afters.json'), 'utf-8');
    obj = JSON.parse(existingData);
  } catch (err) {
    console.error(err);
  }
  obj[page] = aftersString;
  let formObj = JSON.stringify(obj, null, 2);
  fs.writeFileSync(path.join(__dirname, '..', 'afters.json'), formObj);
}

module.exports = { saveAfter };