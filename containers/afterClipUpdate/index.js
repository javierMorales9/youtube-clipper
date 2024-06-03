const util = require('util');
const fs = require('fs/promises');

const exec = util.promisify(require('child_process').exec);
const express = require('express');
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

  const dest = process.env.DIR;
  if (!dest) {
    throw new Error('DIR is required');
  }

  app.post('/process/:path', express.json(), async (req, res) => {
    const path = `${dest}/${req.body.sourceId}`;
    await ffmpeg(req.body, path);

    await fetch(`${process.env.APP_URL}/api/finish_clip_processing`, {
      method: 'POST',
      body: JSON.stringify({ id: req.params.path }),
    });

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

async function ffmpeg(data, path) {
  const { start, end } = data.range;

  const header = `sudo ffmpeg -i ${path}/original.mp4 -ss ${start} -to ${end} `

  let filters = `-filter_complex "[0:v]split=${data.sections.length}${data.sections.map((_, i) => `[s${i}]`).join('')};`;
  let concat = ``;
  for (let i = 0; i < data.sections.length; i++) {
    const section = data.sections[i];
    filters += `[s${i}]split=${section.fragments.length}${section.fragments.map((_, j) => `[f${i}${j}]`).join('')};`;
    for (let j = 0; j < section.fragments.length; j++) {
      const fragment = section.fragments[j];
      filters += `[f${i}${j}]crop=${~~(fragment.width/854*1920)}:${~~(fragment.height/480*1080)}:${~~(fragment.x/854*1920)}:${~~(fragment.y/480*1080)}[e${i}${j}];`
    }
    filters += `${section.fragments.map((_, j) => `[e${i}${j}]`).join('')}vstack=inputs=${section.fragments.length},`;
    filters += `scale=1080:1920[v${i}];`;
    concat += `[v${i}]`;
  }
  filters += `${concat}concat=n=${data.sections.length}[v]"`;

  const footer = ` -map "[v]" -y ${path}/${data.clipId}.mp4`;

  const command = header + filters + footer;

  console.log(command);
  const { stdout, stderr } = await exec(command);

  if (stderr) {
    console.error('stderr:', stderr);
  }
}

start();
