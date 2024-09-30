const axios = require('axios');
const https = require('https');
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

function download(url, filename, directory) {
  const filePath = path.join(directory, filename);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject({ errorCode: 'DOWNLOAD_ERROR', message: `Failed to download ${filename} from \`${url}\`, response buffer was be corrupted or broken.` });
        return;
      }
      let totalBytes = 0;
      let downloadedBytes = 0;
      const totalSize = parseInt(response.headers['content-length'], 10);
      const progressBarLength = 40;
      response.on('data', chunk => {
        totalBytes += chunk.length;
        downloadedBytes += chunk.length;
        const progress = Math.round((downloadedBytes / totalSize) * 100);
        const progressText = `[${'='.repeat(Math.round(progress / (100 / progressBarLength)))}${' '.repeat(progressBarLength - Math.round(progress / (100 / progressBarLength)))}] ${progress}% | ${(totalBytes / (1024 * 1024)).toFixed(2)} Mb`;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Downloading ${filename}: ${progressText}`);
      });
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
          resolve({ errorCode: null, message: `Downloaded ${filename}, took ${totalMB} MB on local disk` });
        });
      });
      file.on('error', err => {
        fs.unlink(filePath, () => reject({ errorCode: 'DOWNLOAD_ERROR', message: `Failed to download ${filename}, buffer may be corrupted or broken.\nFull error:\n${err}`, error: err }));
      });
    }).on('error', err => {
      fs.unlink(filePath, () => reject({ errorCode: 'CANNOT_GET_STREAM', message: `Buffer for ${filename} does not exist, the online form was deleted or moved.`, error: err }));
    });
  });
}

async function sync(fnPage, fnFormat) {
  console.log('\x1b[33m%s\x1b[0m', `[!] A logs file will be created of all urls scraped in this session, change this in settings.`);
  let getUrl = userQueue.url;
  const body = await axios.get(getUrl);
  saveAfter(body.data.data.after, fnPage);
  const directoryPath = path.join(__dirname, 'output', fnPage);
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log('\x1b[33m%s\x1b[0m', `[!] Created a new folder within \`./output\` for a new subreddit page ${fnPage}`);
  }
  let mediaFound = false;
  const promises = [];
  const urls = [];
  let cleared = [];
  let type = (postHint) => {
      if (postHint && postHint.includes(':')) {
        return postHint.split(':').pop();
      }
      return postHint;
    }
  for (const child of body.data.data.children) {
    if (type(child.data.post_hint) === fnFormat) {
      const url = child.data.url_overridden_by_dest;
      const name = path.basename(url);
      const filePath = path.join(directoryPath, name);
      if (!fs.existsSync(filePath)) {
        try {
          const result = await download(url, name, directoryPath);
          urls.push(url);
          if (result.message !== null) console.log(`\n${result.message}`);
          promises.push(Promise.resolve(result));
        } catch (error) {
          console.error(`\n${error.message}`);
          promises.push(Promise.resolve(null));
          fs.unlink(filePath, (err) => {
            if (err) console.log(err)
          });
          cleared.push(name);
        }
      }
      mediaFound = true;
    }
  }
  if (!mediaFound) {
    console.log('\x1b[31m%s\x1b[0m', '[•] No media format found in the provided subreddit link, cause may be that the provided subreddit is a text-only, or there are no medias based on the custom format provided.');
    return;
  }
  try {
    const results = await Promise.all(promises);
    const successfulDownloads = results.filter(result => result !== null);
    appendValues(fnPage, urls);
    console.log('\x1b[32m%s\x1b[0m', `\n${successfulDownloads.length} files downloaded from r/${fnPage}, and cleared ${cleared.length} files with broken buffer.`);
    process.exit(1);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `\nError downloading files: ${err.message}`);
  }
}
