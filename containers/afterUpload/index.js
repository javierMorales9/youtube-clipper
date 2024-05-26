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
  const storage = multer.diskStorage({
    destination: dest,
    filename: (req, file, cb) => {
      const name = req.params.path;
      cb(null, name);
    }
  });
  const upload_middleware = multer({ storage });

  app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.send();
  });

  app.post('/upload/:path', upload_middleware.single('file'), async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');


    ffmpeg(req.file.path);

    await fetch(`${process.env.APP_URL}/api/finished_clip_processing`, {
      method: 'POST',
      body: JSON.stringify({ id: req.params.path }),
    });

    res.send('ok');
  });

  app.get('/:path', async (req, res) => {
    const path = req.params.path;
    const file = await fs.readFile(`${dest}/${path}`);
    res.set('Content-Type', 'video/mp4');
    res.send(file);
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

async function ffmpeg(path) {
  console.log('que pasa chavales', path);
  const { stdout, stderr } = await exec('ffmpeg -version');

}

start();
