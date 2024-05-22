const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const express = require('express');
const multer = require('multer');
const util = require('util');
const fs = require('fs/promises');
const exec = util.promisify(require('child_process').exec);

async function start() {
  console.log('start', process.env.NODE_ENV);

  if (process.env.NODE_ENV === 'development') {
    await dev();
  }
  else {
    await prod();
  }
}

async function dev() {
  const app = express();

  const dest = process.env.DIR;
  if (!dest) {
    throw new Error('DIR is required');
  }
  const upload_middleware = multer({
    dest,
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });

  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.send();
  });

  app.post('/upload', upload_middleware.single('file'), async (req, res) => {
    console.log('new upload', req.file);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.send('ok');
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong!');
  });


  const port = process.env.PORT;
  app.listen(port, '0.0.0.0', () => {
    console.log(`After upload running at http://localhost:${port}/`);
  });
}

async function prod() {
  const { stdout, stderr } = await exec('ffmpeg -version');

  const s3 = new S3({
    region: process.env.AWS_REGION,
  });

  try {
    const data = await s3.getObject({
      Bucket: process.env.INPUT_BUCKET,
      Key: process.env.INPUT_KEY
    });

    await s3.send(new PutObjectCommand({
      Bucket: process.env.OUTPUT_BUCKET,
      Key: process.env.INPUT_KEY,
      ContentLength: data.ContentLength,
      Body: data.Body
    }));

    const sns = new SNSClient({
      region: process.env.AWS_REGION,
    });

    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: JSON.stringify({ id: process.env.INPUT_KEY }),
    }));
  }
  catch (err) {
    console.log('error', err);
  }

}

start();
