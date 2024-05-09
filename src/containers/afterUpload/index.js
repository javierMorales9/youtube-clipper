const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function ls() {
  const { stdout, stderr } = await exec('ffmpeg -version');

  console.log('the env', process.env);
}

ls();
