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
    return response._source;
  } catch (error) {
    console.error('Error retrieving document:', error);
    return false;
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

const deleteAllDocuments = async () => {
  try {
    const response = await client.deleteByQuery({
      index: index,
      body: {
        query: {
          match_all: {}
        }
      }
    });
    return;
  } catch (error) {
    console.error('Error deleting documents:', error);
  }
}

module.exports = {
	insertData,
	bulkInsert,
	getData,
	searchEmailData,
  getCount,
  updateData,
  deleteAllDocuments,
}
