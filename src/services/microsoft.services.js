const { bulkInsert } = require('./email.services');

require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const fetchAndStoreEmails = async (accessToken) => {
	let nextLink = 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=50';

	try {
		while (nextLink) {
			const response = await axios.get(nextLink, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			const emails = response.data.value;
			console.log(emails[0]);
			
			await bulkInsert(emails.map(email => ({
				id: email.id,
				subject: email.subject,
				sender: String(email.sender.emailAddress.address),
				from: String(email.from.emailAddress.address),
				receivedDateTime: email.receivedDateTime,
			})));

			nextLink = response.data['@odata.nextLink'];
		}
	} catch (error) {
		console.error('Error fetching emails:', error.response ? error.response.data : error.message);
	}
};

const fetchWithRateLimitHandling = async (url, accessToken) => {
	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		return response.data;
	} catch (error) {
		if (error.response && error.response.status === 429) {
			const retryAfter = error.response.headers['retry-after'];
			console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds...`);
			await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
			return fetchWithRateLimitHandling(url, accessToken);
		} else {
			throw error;
		}
	}
};

const indexEmails = async (emails, db) => {
	await db.collection('emails').insertMany(emails.map(email => ({
		...email,
		_id: email.id // Use email ID as the unique identifier
	})));
};

const fetchDeltaEmails = async (accessToken, db, deltaLink) => {
	let nextLink = deltaLink || 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages/delta';

	try {
		while (nextLink) {
			const response = await axios.get(nextLink, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			const emails = response.data.value;
			await indexEmails(emails, db); // Index new or changed emails

			nextLink = response.data['@odata.nextLink'] || response.data['@odata.deltaLink'];
		}
	} catch (error) {
		console.error('Error fetching delta emails:', error.response ? error.response.data : error.message);
	}
};

const refreshAccessToken = async (refreshToken) => {
	try {
		const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		}));

		const { access_token, refresh_token } = response.data;
		return { accessToken: access_token, refreshToken: refresh_token };
	} catch (error) {
		console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
		throw new Error('Failed to refresh access token');
	}
};

const monitorMailboxChanges = async (accessToken, db) => {
	let deltaLink = await getStoredDeltaLink(db); // Retrieve the last delta link from the database
	const changes = await fetchDeltaEmails(accessToken, db, deltaLink);
	deltaLink = changes['@odata.deltaLink']; // Save the new delta link
	await storeDeltaLink(db, deltaLink);
};

module.exports = {
	fetchAndStoreEmails,
	fetchWithRateLimitHandling,
	indexEmails,
	fetchDeltaEmails,
	refreshAccessToken,
	monitorMailboxChanges,
}
