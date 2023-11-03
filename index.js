const { execFile } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const wait = require('node:timers/promises').setTimeout;
let jsonAfters = require('./afters.json')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const userQueue = {
  page: null,
  limit: NaN,
  sort: null,
  fallback: [
    { page: 'ecchi', limit: 20, sort: 'sort=top?t=all' }
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

async function sync(fnPage = userQueue.fallback[0].page, fnSort = userQueue.fallback[0].sort, limit = userQueue.fallback[0].limit) {
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
          appendValues(url);
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
    if (resBody.data.data.children[index].data.post_hint == 'image') {
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

async function saveAfter(aftersString, page) {
  let obj = {};
  try {
    const existingData = fs.readFileSync('afters.json', 'utf-8');
    obj = JSON.parse(existingData);
  } catch (err) {
    console.error(err);
  }
  obj[page] = aftersString;
  let formObj = JSON.stringify(obj, null, 2);
  fs.writeFileSync('afters.json', formObj);
}

async function appendValues(values) {
  fs.readFile('url_logs.json', 'utf-8', (error, data) => {
    if (error) return console.log('\x1b[31m%s\x1b[0m', error);
    try {
      const jsonData = JSON.parse(data);
      if (!jsonData['urls']) jsonData['urls'] = [];
      jsonData['urls'] = jsonData['urls'].concat(values);
      fs.writeFileSync('url_logs.json', JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (parseError) {
      console.log('\x1b[31m%s\x1b[0m', `[!] Error parsing JSON ${parseError}`);
    }
  });
}