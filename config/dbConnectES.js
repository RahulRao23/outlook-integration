const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

// Test the connection
client.info()
  .then(response => console.log(response))
  .catch(error => console.error(error));

module.exports = client;