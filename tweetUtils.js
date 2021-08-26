require("dotenv").config();
const config = require("./config.js");
const Twitter = require("twitter");
const T = new Twitter(config.twitterConfig);

module.exports.tweetImages = async function (image1, status) {
  console.log("Uploading image 1");
  const mediaObject1 = await makePost("media/upload", { media_data: image1 });
  const id1 = mediaObject1.media_id_string;
  console.log(`Image id is ${id1}`);

  console.log("Tweeting status");
  return makePost("statuses/update", {
    status: status,
    media_ids: `${id1}`,
  });
};

module.exports.reply = function (status, prevIdStr, username) {
  return makePost("statuses/update", {
    status: status,
    in_reply_to_status_id: prevIdStr,
    auto_populate_reply_metadata: true,
  });
};

async function makePost(endpoint, params) {
  return T.post(endpoint, params);
}

async function getTCoLinkLength() {
  return T.get("help/configuration", {}).then(
    (response) => response.short_url_length_https
  );
}
