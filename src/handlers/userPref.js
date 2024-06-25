const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const fallback = {
  page: 'cats',
  limit: 10,
  sort: 'top',
  format: 'image',
  url: 'https://www.reddit.com/r/cats/hot/.json?limit=10'
};

const userQueue = {
  page: null,
  sort: null,
  limit: NaN,
  format: null,
  url: null
};

function fillEmpty() {
  for (const key in userQueue) {
    if (userQueue[key] === null || userQueue[key] === '') {
      userQueue[key] = fallback[key];
    }
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
  const jsonAfters = require('../afters.json');
  return new Promise(async (resolve, reject) => {
    try {
      let page = await ask('Enter subreddit page name (i.e: cats): ');
      while (!page || page.trim() === '') {
        page = await ask('Subreddit page name cannot be empty, please enter a proper name: ');
      }
      userQueue.page = page;
      let sortCache = await ask('Enter sorting option (hot, new, top, etc.): ');
      switch (sortCache.toLowerCase()) {
        case 'top':
        case 'hot':
        case 'new':
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
              link = `https://www.reddit.com/r/${userQueue.page}/top/.json?limit=${userQueue.limit < 0 ? 10 : userQueue.limit}&t=all&after=${jsonAfters[userQueue.page]}`;
            } else {
              link = `https://www.reddit.com/r/${userQueue.page}/top/.json?limit=${userQueue.limit < 0 ? 10 : userQueue.limit}&t=all`;
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
        fillEmpty();
        resolve({ check: true, mode: 'config', error: null });
      } else {
        resolve({ check: true, mode: 'default', error: null, messsage: 'Invalid input or missing page, default fallback configuration will be used.' });
      }
      rl.close();
    } catch (error) {
      console.error(error);
      reject({ check: false, mode: 'default', error: error });
    }
  });
}

module.exports = { startWithConfig, userQueue };