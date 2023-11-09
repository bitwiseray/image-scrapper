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
  limit: NaN,
  sort: null,
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

async function startWithConfig() {
  try {
    userQueue.page = await ask('Enter subreddit page name (i.e: cats): ');
    let sortCache = await ask('Enter sorting option (hot, new, top, etc.): ');
    switch (sortCache.toLowerCase()) {
      case 'top':
        userQueue.sort = 'sort=top?t=all';
        break;
      case 'hot':
      case 'new':
      case 'rising':
      case 'controversial':
        userQueue.sort = `sort=${userQueue.sort.toLowerCase()}`;
        break;
      default:
        userQueue.sort = userQueue.fallback[0].sort;
    }
    userQueue.format = await ask('Enter media format (image, video, gif): ');
    userQueue.limit = await ask('Enter limit (default is 20): ');
    if (typeof userQueue.page === 'string' && userQueue.page.trim() !== '') {
      return { check: true, mode: 'config', error: null };
    } else {
      console.log('Invalid input or missing page, default fallback configuration will be used.');
      return { check: true, mode: 'default', error: null };
    }
    rl.close();
  } catch (error) {
    console.error(error);
    return { check: false, mode: 'default', error: error };
  }
}

module.exports = { startWithConfig, userQueue };