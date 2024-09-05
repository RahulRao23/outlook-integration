const client = require('../../../config/dbConnectES');
const index = 'emails'

const insertData = async (data) => {
  try {
    const response = await client.index({
      index: index, 
      id: '1',
      body: {
        name: 'John Doe',
        age: 30,
        occupation: 'Software Developer'
      }
    });
    console.log('Document inserted:', response);
  } catch (error) {
    console.error('Error inserting document:', error);
  }
};

const bulkInsert = async (emailData) => {
  // const bulkBody = [
  //   { index: { _index: index, _id: '1' } },
  //   { name: 'John Doe', age: 30, occupation: 'Software Developer' },
    
  //   // Second document
  //   { index: { _index: index, _id: '2' } }, // Action metadata
  //   { name: 'Jane Doe', age: 28, occupation: 'Data Scientist' }, // Document body

  //   // Add more documents as needed...
  // ];

  console.log(emailData[0], emailData[1]);

  try {
    const response = await client.bulk({ refresh: true, body: emailData });
    
    if (response.errors) {
      console.log('Bulk insert encountered errors:', response.items);
    } else {
      console.log('Bulk insert successful:', response.items);
    }
  } catch (error) {
    console.error('Error performing bulk insert:', error);
  }
};

const getData = async (id) => {
  try {
    const response = await client.get({
      index: index,
      id: id,
    });
    console.log('Document retrieved:', response._source);
  } catch (error) {
    console.error('Error retrieving document:', error);
  }
};

const searchEmailData = async (query, page, size) => {
  try {
    const response = await client.search({
      index: index,
      body: query,
      sort: [ { created_at: { order: 'desc' } }],
      from: (page - 1) * size,
      size: size,
    });
    console.log('Search results:', response);
    const totalCount = Number(response.hits.total.value / size);
    return {email_data: response?.hits?.hits, total_pages: totalCount};
  } catch (error) {
    console.error('Error searching documents:', error);
  }
};

const getCount = async (query) => {
  try {
    const response = await client.count({
      index: index,
      query: query,
    });
    console.log('Search results:', response);
    return response;
  } catch (error) {
    console.error('Error searching documents:', error);
    return 0;
  }
};

const updateData = async (emailId, emailDetails) => {
	await client.update({
		index: index,
		id: emailId,
		doc: emailDetails
	})
}

module.exports = {
	insertData,
	bulkInsert,
	getData,
	searchEmailData,
  getCount,
  updateData,
}
