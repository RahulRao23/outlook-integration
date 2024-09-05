const { bulkInsert, getData, updateData } = require('../elasticSearch/emails.services');

require('dotenv').config();
const axios = require('axios');


const fetchForlderDetails = async (accessToken) => {
	try {
		const fetchFoldersLink = 'https://graph.microsoft.com/v1.0/me/mailFolders';

		const response = await axios.get(fetchFoldersLink, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		const folderData = response.data.value;
		const folderDataForUser = folderData.map(folder => {
			return {
				folder_id: folder.id,
				folder_title: `${folder.displayName} (All: ${folder.totalItemCount} Unread: ${folder.unreadItemCount})`,
				is_hidden: folder.isHidden,
			}
		});
		
		return folderDataForUser;

	} catch (error) {
		console.log("Fetch email data error: ", error);
		
	}
}

const initialEmailSync = async (emailAddress, accessToken) => {
	let nextLink = 'https://graph.microsoft.com/v1.0/me/messages?$top=50';

	try {
		while (nextLink) {
			const response = await axios.get(nextLink, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			const emails = response.data.value;
			const emailData = [];

			emails.map(email => {
				emailData.push(
					{ index: { _index: 'emails', _id: email.id } },
					{
						subject: email.subject,
						sender: String(email.sender.emailAddress.address),
						from: String(email.from.emailAddress.address),
						to: emailAddress,
						change_key: email.changeKey,
						received_date_time: email.receivedDateTime,
						importance: email.importance,
						parent_folder: email.parentFolderId,
						conversation_id: email.conversationId,
						is_read: email.isRead,
						is_draft: email.isDraft,
						created_at: email.createdDateTime,
						sent_date: email.sentDateTime,
						received_date: email.receivedDateTime,
						complete_data: { ...email },
					}
				);
			});

			console.log(emailData[0], emailData[1], emailData.length);
			
			await bulkInsert(emailData);

			nextLink = response.data['@odata.nextLink'];
		}
	} catch (error) {
		console.error('Error fetching emails:', error.response ? error.response.data : error.message);
	}
};

const getTotalMailCount = async (accessToken) => {
	try {
		const link = 'https://graph.microsoft.com/v1.0/me/messages/$count';
		const response = await axios.get(link, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		console.log(response.data);
		return response.data;
	} catch (error) {
		console.log("Mail Count Error: ", error);
		
	}
}

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

const fetchDeltaEmails = async (emailAddress, accessToken, deltaLink) => {
	let nextLink = deltaLink || 'https://graph.microsoft.com/v1.0/me/messages?$top=50';  // 'https://graph.microsoft.com/v1.0/me/delta';

	try {
		while (nextLink) {
			const response = await axios.get(nextLink, {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			const emails = response.data.value;

			const insertData = [], promiseArray = [];

			await Promise.all(
				emails.map(async (email) => {
					const emailDetails = await getData(email.id);
					if (!emailDetails) {
						insertData.push(
							{ index: { _index: 'emails', _id: email.id } },
							{
								subject: email.subject,
								sender: String(email.sender.emailAddress.address),
								from: String(email.from.emailAddress.address),
								to: emailAddress,
								change_key: email.changeKey,
								received_date_time: email.receivedDateTime,
								importance: email.importance,
								parent_folder: email.parentFolderId,
								conversation_id: email.conversationId,
								is_read: email.isRead,
								is_draft: email.isDraft,
								created_at: email.createdDateTime,
								sent_date: email.sentDateTime,
								received_date: email.receivedDateTime,
								complete_data: { ...email },
							}
						);
					} else {
						promiseArray.push(
							updateData(
								email.id, 
								{
									subject: email.subject,
									sender: String(email.sender.emailAddress.address),
									from: String(email.from.emailAddress.address),
									to: emailAddress,
									change_key: email.changeKey,
									received_date_time: email.receivedDateTime,
									importance: email.importance,
									parent_folder: email.parentFolderId,
									conversation_id: email.conversationId,
									is_read: email.isRead,
									is_draft: email.isDraft,
									created_at: email.createdDateTime,
									sent_date: email.sentDateTime,
									received_date: email.receivedDateTime,
									complete_data: { ...email },
								}
							)
						);
					}
				})
			);
			if (insertData.length) await bulkInsert(insertData);
			if (promiseArray.length) await Promise.all(promiseArray);
			
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

		const { access_token, refresh_token, expires_in } = response.data;
		console.log(response.data);
		
		return { outlook_access_token: access_token, outlook_refresh_token: refresh_token, access_token_expires: Date.now() + expires_in * 1000 };
	} catch (error) {
		console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
		throw new Error('Failed to refresh access token');
	}
};

module.exports = {
	initialEmailSync,
	fetchWithRateLimitHandling,
	fetchDeltaEmails,
	refreshAccessToken,
	fetchForlderDetails,
	getTotalMailCount,
}
