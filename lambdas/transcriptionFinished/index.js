const { randomUUID } = require('crypto');
const { Client } = require('pg');

async function handler(event, context, callback) {
  const id = randomUUID();
  const sourceId = decodeURI(event.Records[0].s3.object.key).split('/')[0];
  console.log(`Processing transcription finished event for source ${sourceId}`);

  try {
    if(!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }
    const client = new Client({ connectionString: process.env.DATABASE_URL, });

    await client.connect();
    
    await client.query(`
      INSERT INTO processing_event
      (id, source_id, clip_id, type, created_at, finished_at, error) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, sourceId, null, 'transcription_finished', new Date(), null, null]
    );

    client.end();

    return callback();
  }
  catch (err) {
    console.log(err, err.stack);
    return callback(err);
  }
}
module.exports.handler = handler;
