const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const fallback = { 
  page: 'ecchi', 
  limit: 20, 
  sort: 'sort=top?t=all', 
  format: 'image' 
};

const userQueue = {
  page: null,
  sort: null,
  limit: NaN,
  format: null
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
          userQueue.sort = '?t=all';
          break;
        case 'hot':
        case 'new':
        case 'rising':
        case 'controversial':
          userQueue.sort = `${sortCache}`;
          break;
        default:
          userQueue.sort = fallback.sort;
      }
      userQueue.format = await ask('Enter media format (image, video, gif): ');
      userQueue.limit = await ask('Enter limit (default is 20): ');
      if (typeof userQueue.page === 'string' && userQueue.page.trim() !== '') {
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