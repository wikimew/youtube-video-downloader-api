const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const FormData = require("form-data");
const ytdl = require("ytdl-core");
const axios = require("axios");
const bodyParser = require("body-parser");



const get = async (req, res) => {
  return res.send('OK');
};

const code = async (inputs) => {
  // Destructuring the request body
  const { url, email, pass, text } = inputs;

  // Logging in to the API and getting the token
  const lResp = await axios.request({
    method: "post",
    url: "https://mugambo-profile.qlanserve.com/api/login/",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      login_id: email,
      password: pass,
    }),
  });
  const token = lResp.data.data.token;
  console.log(token);

  // Creating a new form data object
  let data = new FormData();

  // Filtering the mp4 format
  const filter = (format) => format.container === "mp4";

  // Creating a stream from the url
  const stream = ytdl(url, { filter, quality: "highestvideo" });

  // Appending the stream to the form data with a filename
  data.append("file", stream, email + ".mp4");

  // Configuring the upload request
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://shakaal-posts.qlanserve.com/api/upload-video/",
    headers: {
      Authorization: "Bearer " + token,
      ...data.getHeaders(),
    },
    data,
  };

  // Uploading the video and getting the upload id
  const uResp = await axios.request(config);
  console.log(JSON.stringify(uResp.data));
  const uploadId = uResp.data["data"]["upload_id"];

  // Configuring the post request
  let data1 = JSON.stringify({
    post_type: "POST",
    privacy_type: "public",
    post: text,
    post_user_type: "USER",
    tag_list: [],
    video_id_list: [uploadId],
  });
  console.log(data1);
  let config1 = {
    method: "post",
    url: "https://shakaal-posts.qlanserve.com/api/posts/",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: data1,
  };

  // Posting the video and logging the response
  const pResp = await axios.request(config1);
  console.log(JSON.stringify(pResp.data));
  return true;
};

const post = async (req, res) => {
  try {
    console.log(req.body);
    const url = req.body.url;
    const email = req.body.email;
    const pass = req.body.password;
    const text = req.body.title;
    if (!url || !email || !pass || !text) {
      res.status(500).send({ message: "missing" });
    }
    code({
      url: url,
      text: text,
      email: email,
      pass: pass,
    });
    res.send({ message: "success" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "failed", error: e });
  }
};

app.use(bodyParser.json({ limit: "10mb" }));
app.get("/", get);
app.post("/yt", post);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// https://www.youtube.com/watch?v=ak5IICIUlgw