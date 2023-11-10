const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const jsonAfters = require('../afters.json');

const fallback = {
  page: 'cats',
  limit: 10,
  sort: 'top',
  format: 'image',
  link: 'https://www.reddit.com/r/cats/hot/.json?limit=10'
};

const userQueue = {
  page: null,
  sort: null,
  limit: NaN,
  format: null,
  url: null
};

for (let [key, value] of Object.entries(userQueue)) {
  if (value == null || value === "" || Number.isNaN(value)) {
    userQueue[key] = fallback[key];
  }
}

function ask(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function startWithConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      userQueue.page = await ask('Enter subreddit page name (i.e: cats): ');
      let sortCache = await ask('Enter sorting option (hot, new, top, etc.): ');
      switch (sortCache.toLowerCase()) {
        case 'top':
        case 'hot':
        case 'new':
        case 'rising':
        case 'controversial':
          userQueue.sort = sortCache;
          break;
        default:
          userQueue.sort = fallback.sort;
      }
      userQueue.format = await ask('Enter media format (image, video, gif): ');
      userQueue.limit = await ask('Enter limit (default is 20): ');
      if (typeof userQueue.page === 'string' && userQueue.page.trim() !== '') {
        let link;
        switch (userQueue.sort) {
          case 'top':
            if (jsonAfters[userQueue.page]) {
              link = `https://www.reddit.com/r/${userQueue.page}/top/.json?limit=${userQueue.limit}&t=all&after=${jsonAfters[userQueue.page]}`;
            } else {
              link = `https://www.reddit.com/r/${userQueue.page}/top/.json?limit=${userQueue.limit}&t=all`;
            }
            break;
          default:
            if (jsonAfters[userQueue.page]) {
              link = `https://www.reddit.com/r/${userQueue.page}/${userQueue.sort}/.json?limit=${userQueue.limit}&after=${jsonAfters[userQueue.page]}`;
            } else {
              link = `https://www.reddit.com/r/${userQueue.page}/${userQueue.sort}/.json?limit=${userQueue.limit}`;
            }
            break;
        }
        userQueue.url = link;
        resolve({ check: true, mode: 'config', error: null });
      } else {
        console.log('Invalid input or missing page, default fallback configuration will be used.');
        resolve({ check: true, mode: 'default', error: null });
      }
      rl.close();
    } catch (error) {
      console.error(error);
      reject({ check: false, mode: 'default', error: error });
    }
  });
}

module.exports = { startWithConfig, userQueue };