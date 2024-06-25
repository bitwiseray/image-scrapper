const { execFile } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkFilesExistence } = require('./handlers/checkAssets.js');
const { startWithConfig, userQueue } = require('./handlers/userPref.js');
const { appendValues } = require('./handlers/createLogs.js');
const { saveAfter } = require('./handlers/saveAfters.js');

async function start() {
  try {
    let res = await checkFilesExistence();
    if (res.check) {
      await startWithConfig();
      sync(userQueue.page, userQueue.format);
    } else {
      throw new Error("File existence check failed.");
    }
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', `[x] Something went wrong while trying to start: ${error}`);
    process.exit(1);
  }
}

start();

async function sync(fnPage, fnFormat) {
  console.log('\x1b[33m%s\x1b[0m', `[!] A logs file will be created of all urls scraped in this session.`);
  let getUrl = userQueue.url;
  const resBody = await axios.get(getUrl);
  saveAfter(resBody.data.data.after, fnPage);
  if (!fs.existsSync(path.join(__dirname, 'output', fnPage))) {
    fs.mkdir(path.join(__dirname, 'output', fnPage), { recursive: true }, function (err) {
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
      // this is an function that downloads media from the url and saves it as whatever the `filename` holds 
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
    appendValues(fnPage, urls);
  }).catch((error) => {
    console.log('\x1b[31m%s\x1b[0m', error);
  });
}