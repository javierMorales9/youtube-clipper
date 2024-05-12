const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function ls() {
  const { stdout, stderr } = await exec('ffmpeg -version');

  const s3 = new S3({
    region: process.env.AWS_REGION,
  });

  try {
    console.log('env', process.env);
    const data = await s3.getObject({
      Bucket: process.env.INPUT_BUCKET,
      Key: process.env.INPUT_KEY
    });

    await s3.send(new PutObjectCommand({
      Bucket: process.env.OUTPUT_BUCKET,
      Key: process.env.INPUT_KEY,
      Body: data.Body
    }));

    const sns = new SNSClient({
      region: process.env.AWS_REGION,
    });

    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: 'Video uploaded'
    }));
  }
  catch (err) {
    console.log('error', err);
  }

}

ls();
