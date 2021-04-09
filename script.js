const fetch = require('node-fetch');
const fs = require('fs');

let sep = "";
function writeOut(filename, data) {
  const selectData = (({ id, timestamp, comment, reply, media }) => ({ id, timestamp, comment, reply, media }))(data.post);
  fs.appendFileSync(filename, sep + JSON.stringify(selectData, null, 2), e => e ? console.error(e) : console.log(selectData.timestamp))
  if (!sep) {
    sep = ',\n';
  }
}

async function curiousCopyCat(username) {

  const getLastTimestamp = a => a[a.length - 1].post.timestamp;

  async function getPosts(user, t) {
    let url = `https://curiouscat.qa/api/v2.1/profile?username=${username}&max_timestamp=${t}`
    const response = await fetch(url, {
      "headers": {
        "accept": "*/*",
        "accept-language": "en_US",
        "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site"
      },
      "referrer": "https://curiouscat.me/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors"
    });
    console.log(url);
    return await response.json();
  }

  let timestamp = Math.floor(Date.now() / 1000);
  let data = await getPosts(username, timestamp);

  const fn = username + '.json';
  fs.writeFileSync(fn, '[');
  data.posts.forEach(post => writeOut(fn, post));

  async function getNext(t) {
    if (t < timestamp) {
      data = await getPosts(username, t);

      // check if data has posts
      if (data.posts.length) {
        data.posts.slice(1).forEach(post => writeOut(fn, post));
        timestamp = t;
        setTimeout(async () => await getNext(getLastTimestamp(data.posts)), 1000);
      } else {
        console.log('Might be timed out by api. Waiting 10 seconds...');
        setTimeout(async () => await getNext(t), 10000);
      }

    } else {
      console.log('Done.');
      fs.appendFileSync(fn, ']');
    }
  }

  await getNext(getLastTimestamp(data.posts));

  return true;
}

curiousCopyCat('Mathoma');