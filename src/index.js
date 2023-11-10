const { execFile } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkFilesExistence } = require('./handlers/checkAssets.js');
const { startWithConfig, userQueue } = require('./handlers/userPref.js');
const { appendValues } = require('./handlers/createLogs.js');
const { saveAfter } = require('./handlers/saveAfters.js');

checkFilesExistence()
  .then((result) => {
    if (result.check) {
      return startWithConfig();
    } else {
      throw new Error("File existence check failed.");
    }
  })
  .then((result) => sync(userQueue.page, userQueue.format))
  .catch((error) => {
    console.log('\x1b[31m%s\x1b[0m', `[×] Something went wrong while trying to start:\n${error}`);
    process.exit(1);
  });

async function sync(fnPage, fnFormat) {
  console.log('\x1b[33m%s\x1b[0m', `[!] A logs file will be created of all urls scraped in this session.`);
  let getUrl = userQueue.url;
  const resBody = await axios.get(getUrl);
  saveAfter(resBody.data.data.after, fnPage);
  if (!fs.existsSync(path.join(__dirname, 'output', fnPage))) {
    fs.mkdir(path.join(__dirname, 'output', fnPage), { recursive: true }, function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log('\x1b[33m%s\x1b[0m', `[!] Created a new folder within \`./output\` for a new page ${fnPage}`);
      }
    });
  }
  let count = 0;
  let urls = [];
  const download = (url, filename) => {
    return new Promise((resolve, reject) => {
      const file = path.join(__dirname, 'output', fnPage, filename);
      const args = ['-o', file, url];
      execFile('curl', args, (err, stdout, stderr) => {
        if (stderr) {
          console.log('\x1b[32m%s\x1b[0m', `[+] Downloaded ${filename}`);
          urls.push(url)
        }
        if (err) {
          console.log('\x1b[31m%s\x1b[0m', error);
          reject(err);
        } else {
          resolve(filename);
        }
      });
    });
  };

  let promises = [];
  let mediaFound = false;
  for (let index = 0; index < resBody.data.data.children.length; index++) {
    if (resBody.data.data.children[index].data.post_hint == fnFormat) {
      let url = resBody.data.data.children[index].data.url_overridden_by_dest;
      let name = path.basename(url);
      const file = path.join(__dirname, 'output', fnPage, name);
      if (!fs.existsSync(file)) {
        promises.push(download(url, name));
        count++;
      }
      mediaFound = true;
    }
  }
  if (!mediaFound) console.log('\x1b[31m%s\x1b[0m', '[•] No media format found in the provided subreddit link, cause may be that the provided subreddit is a text-only.');
  Promise.all(promises).then((results) => {
    console.log(`[+] Downloaded total of ${results.length} media files from r/${fnPage}`);
    appendValues(urls, fnPage);
  }).catch((error) => {
    console.log('\x1b[31m%s\x1b[0m', error);
  });
}