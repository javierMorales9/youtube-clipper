const { S3 } = require("@aws-sdk/client-s3");
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
    destination: async (req, file, cb) => {
      const name = req.params.path;
      const path = `${dest}/${name}`;
      await fs.mkdir(path, { recursive: true })
      return cb(null, path);
    },
    filename: async (req, file, cb) => {
      return cb(null, 'original.mp4');
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

    res.send('ok');

    const path = req.file.destination;
    const duration = await ffmpeg(path);
    const resolution = await getResolution(path);

    const { stdout } = await exec(`python file.py`);
    const suggestions = JSON.parse(stdout);

    await fetch(`${process.env.APP_URL}/api/finish_source_processing`, {
      method: 'POST',
      body: JSON.stringify({
        Message: JSON.stringify({
          id: req.params.path,
          resolution,
          duration,
          suggestions,
        }),
      }),
    });
  });

  app.get('/:path/:file', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const { path, file } = req.params;
    try {
      const f = await fs.readFile(`${dest}/${path}/${file}`);
      res.send(f);
    } catch (err) {
      console.error(err);
      res.status(404).send('Not found');
    }
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
    console.log('operating on', process.env.INPUT_BUCKET, process.env.INPUT_KEY);
    const data = await s3.getObject({
      Bucket: process.env.INPUT_BUCKET,
      Key: process.env.INPUT_KEY
    });

    const content = await data.Body?.transformToByteArray();
    if (!content) {
      throw new Error('No content');
    }

    const path = '.';
    await fs.mkdir(`${path}/${process.env.SOURCE_ID}`, { recursive: true });
    await fs.writeFile(`${path}/${process.env.SOURCE_ID}/original.mp4`, content);
    console.log(`File saved to: ${path}/${process.env.SOURCE_ID}/original.mp4`);

    const duration = await ffmpeg(`${path}/${process.env.SOURCE_ID}`);
    const resolution = await getResolution(`${path}/${process.env.SOURCE_ID}`);

    const { stdout } = await exec(`python file.py`);
    const suggestions = JSON.parse(stdout);

    const files = await fs.readdir(`${path}/${process.env.SOURCE_ID}`);
    console.log('Files', files);
    for (const file of files) {
      console.log('Uploading', file);
      if (file === 'original.mp4') continue;

      const content = await fs.readFile(`${path}/${process.env.SOURCE_ID}/${file}`);
      await s3.putObject({
        Bucket: process.env.INPUT_BUCKET,
        Key: `${process.env.SOURCE_ID}/${file}`,
        Body: content,
      });
    }

    const sns = new SNSClient({
      region: process.env.AWS_REGION,
    });

    console.log('About to send sns message', resolution);
    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: JSON.stringify({
        id: process.env.SOURCE_ID,
        resolution,
        duration,
        suggestions,
      }),
    }));
  }
  catch (err) {
    console.log('error', err);
  }
}

async function ffmpeg(path) {
  console.log('Execute ffmpeg', process.env.HLS);
  try {
    if (process.env.HLS) {
      await exec(`ffmpeg -i ${path}/original.mp4 \
         -codec: copy \
         -hls_time 10 \
         -hls_list_size 0 \
         -f hls \
        ${path}/adaptive.m3u8`);

      console.log('Move files to', path);
      //await exec(`mv adaptiv* chunk* media* init* ${path}/`);
    }

    const { stdout } = await exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path}/original.mp4`);
    const duration = parseFloat(stdout);
    console.log('Creating timeline. Duration: ', parseInt(stdout));
    await exec(`ffmpeg -i ${path}/original.mp4 -frames 1 -vf "select=not(mod(n\\,30)),scale=240:-2,tile=1x${parseInt(stdout).toString()}" ${path}/timeline.png -y`);

    console.log('Creating snapshot');
    await exec(`ffmpeg -ss ${duration / 2} -i ${path}/original.mp4 -frames:v 1 -q:v 1 ${path}/snapshot.png -y`);

    return duration;
  } catch (err) {
    console.log('Error', err);
  }
}

async function getResolution(path) {
  const { stdout: resolution } = await exec(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${path}/original.mp4`);
  console.log('Resolution', resolution);
  return resolution;
}

start();
