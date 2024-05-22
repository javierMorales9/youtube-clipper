const http = require('http');
const util = require('util');
const fs = require('fs/promises');

const exec = util.promisify(require('child_process').exec);
import express from 'express';
const { S3 } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

async function start() {
  if (process.env.NODE_ENV === 'development') {
    await dev();
  }
  else {
    await prod();
  }
}

async function prod() {
  const { stdout, stderr } = await exec('ffmpeg -version');

  const s3 = new S3({
    region: process.env.AWS_REGION,
  });

  try {
    const data = await s3.getObject({
      Bucket: process.env.SOURCE_BUCKET,
      Key: process.env.SOURCE_KEY
    });

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

async function dev() {
  const app = express();

  app.post('/upload', async (req, res) => {
    console.log('req.body', req.body);
    const path = process.env.DIR;

    if (!path) {
      throw new Error('DIR is required');
    }

    const file = await fs.readFile(`${path}/source.mp4`, { encoding: 'binary' });
  });

  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`After upload running at http://localhost:${port}/`);
  });

}

start();

