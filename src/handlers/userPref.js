// A function that returns a promise that resolves with the user input
function ask(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// An async function that gets the user preferences and calls sync
async function getUserPreferences() {
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
      sync(userQueue.page, userQueue.sort, userQueue.limit);
    } else {
      console.log('Invalid input or missing page, default fallback configuration will be used.');
      sync();
    }
    rl.close();
  } catch (error) {
    console.error(error);
  }
}

getUserPreferences();