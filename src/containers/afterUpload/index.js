const { S3, UploadPartCommand } = require("@aws-sdk/client-s3");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function ls() {
  console.log('the env', process.env);

  const { stdout, stderr } = await exec('ffmpeg -version');

  const s3 = new S3({
    region: process.env.AWS_REGION,
  });

  const params = {
    Bucket: process.env.INPUT_BUCKET,
    Key: process.env.INPUT_KEY
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.log('error', err);
    }
    else {
      console.log('data', data);
    }
  });

  s3.putObject({
    Bucket: process.env.OUTPUT_BUCKET,
    Key: process.env.INPUT_KEY,
    Body: 'Hello World!'
  }, (err, data) => {
    if (err) {
      console.log('error', err);
    }
    else {
      console.log('data', data);
    }
  });
}

ls();
