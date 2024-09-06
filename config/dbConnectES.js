const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: process.env.ENDPOINT });

// Test the connection
client.info()
  .then(response => console.log(response))
  .catch(error => console.error(error));

module.exports = client;