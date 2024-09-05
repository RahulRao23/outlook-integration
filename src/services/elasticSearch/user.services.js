const client = require('../../../config/dbConnectES');

const createUser = async (id, userObj) => {
  try {
    const response = await client.index({
      index: 'users',
      id: id,
      body: userObj,
    });
    console.log('Document inserted:', response);
  } catch (error) {
    console.error('Error inserting document:', error);
  }
};

const bulkInsert = async () => {
  const bulkBody = [
    // First document
    { index: { _index: 'my_index', _id: '1' } }, // Action metadata
    { name: 'John Doe', age: 30, occupation: 'Software Developer' }, // Document body
    
    // Second document
    { index: { _index: 'my_index', _id: '2' } }, // Action metadata
    { name: 'Jane Doe', age: 28, occupation: 'Data Scientist' }, // Document body

    // Add more documents as needed...
  ];

  try {
    const response = await client.bulk({ refresh: true, body: bulkBody });
    
    if (response.errors) {
      console.log('Bulk insert encountered errors:', response.items);
    } else {
      console.log('Bulk insert successful:', response.items);
    }
  } catch (error) {
    console.error('Error performing bulk insert:', error);
  }
};

const getData = async (userId) => {
  try {
    const response = await client.get({
      index: 'users',
      id: userId
    });
    console.log(response);
    
		return response;
  } catch (error) {
    console.error('Error retrieving document:', error);
    return false;
  }
};

const searchData = async (query) => {
  try {
    const response = await client.search({
      index: 'users',
      body: query
    });
		return response?.hits?.hits;
  } catch (error) {
    console.error('Error searching documents:', error);
  }
};

const updateData = async (userId, userDetails) => {
	await client.update({
		index: 'users',
		id: userId,
		doc: userDetails
	})
}

const checkUserExists = async (userId) => {
	return await client.exists({
    index: 'users',
    id: userId
  });
}

module.exports = {
	createUser,
	bulkInsert,
	getData,
	searchData,
	updateData,
	checkUserExists,
}
