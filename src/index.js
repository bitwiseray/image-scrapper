const { execFile } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const jsonAfters = require('./afters.json');
const { checkFilesExistence } = require('./handlers/checkAssets.js');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const userQueue = {
  page: null,
  limit: NaN,
  sort: null,
  format: null,
  fallback: [
    { page: 'ecchi', limit: 20, sort: 'sort=top?t=all', format: 'image' }
  ]
};

rl.question('Enter subreddit page name (i.e: cats): ', (answerPg) => {
  userQueue.page = answerPg;
  rl.question('Enter sorting option (hot, new, top, etc.): ', (answerSt) => {
    switch (answerSt.toLowerCase()) {
      case 'top':
        userQueue.sort = 'sort=top?t=all';
        break;
      case 'hot':
      case 'new':
      case 'rising':
      case 'controversial':
        userQueue.sort = `sort=${answerSt.toLowerCase()}`;
        break;
      default:
        userQueue.sort = userQueue.fallback[0].sort;
    }
    rl.question('Enter media format (image, video, gif): ', (answerSt) => {
      userQueue.format = answerSt.toLowerCase();
      rl.question('Enter limit (default is 20): ', (answerLt) => {
        userQueue.limit = answerLt || 25;
        if (typeof userQueue.page === 'string' && userQueue.page.trim() !== '') {
          sync(userQueue.page, userQueue.sort, userQueue.limit);
        } else {
          console.log('Invalid input or missing page, default fallback configuration will be used.');
          sync();
        }
        rl.close();
      });
    });
  });
});

async function sync(fnPage = userQueue.fallback[0].page, fnSort = userQueue.fallback[0].sort, limit = userQueue.fallback[0].limit, fnFormat = userQueue.fallback[0].format) {
  console.log('\x1b[33m%s\x1b[0m', `[!] A logs file will be created of all urls scraped in this session.`);
  let getUrl = jsonAfters[fnPage] ? `https://www.reddit.com/r/${fnPage}/top.json?${fnSort}&after=${jsonAfters[fnPage]}` : `https://www.reddit.com/r/${fnPage}/top.json?${fnSort}`;
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
          console.log('\x1b[32m%s\x1b[0m', `[+] Downloaded ${filename} | [${count}/${limit}]`);
          appendValues(urls, fnPage);
        }
        if (err) {
          console.log(`[!] ${err}`);
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
        if (count < limit) {
          promises.push(downloadImage(url, name));
          count++;
        }
      }
      mediaFound = true;
    }
  }
  if (!mediaFound) return console.log('\x1b[31m%s\x1b[0m', '[!] No media format found in the provided subreddit link, cause may be that the provided subreddit is a text-only.');
  Promise.all(promises).then((results) => {
    console.log(`[+] Downloaded total of ${results.length} media files from ${fnPage}`);
  }).catch((error) => {
    console.log('\x1b[31m%s\x1b[0m', error);
  });
}