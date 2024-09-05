let userId = '';
let isInitialSyncComplete = false;

async function initalSync() {
	const response = await axios.get('http://localhost:3000/outlook-initial-sync');
	return response;
}

async function fetchFolders() {
	const response = await axios.get('http://localhost:3000/outlook-folders');
	userId = response.data.user_id;
	return response.data.folder_data;
}

async function fetchEmails(folderId, page = 1, pageSize = 5) {
	const response = await axios.get(`http://localhost:3000/outlook-emails/?folder_id=${folderId}&page=${page}&pageSize=${pageSize}`);
	return response.data;
}

async function fetchEmailsAfterSync(folderId, page = 1, pageSize = 5) {
	const response = await axios.get(`http://localhost:3000/outlook-sync/?folder_id=${folderId}&page=${page}&pageSize=${pageSize}`);
	return response.data;
}

// function renderFolders(folders) {
// 	const sidenav = document.getElementById('sidenav');
// 	sidenav.innerHTML = ''; // Clear the existing folder list

// 	folders.forEach(folder => {
// 		const folderButton = document.createElement('button');
// 		folderButton.textContent = folder.folder_title;
// 		folderButton.classList.add('folder-button'); // Add a class for styling

// 		// Add event listener to handle folder selection and trigger API call
// 		folderButton.addEventListener('click', () => {
// 			axios.get(`http://localhost:3000/outlook-emails/?folder_id=${folder.folder_id}`)
// 				.then(response => response.data.email_data)
// 				.then(data => {
// 					if (data.length)
// 						renderEmails(data);
// 				})
// 				.catch(error => {
// 					console.error('Error fetching folder data:', error);
// 				});
// 		});

// 		// Append the folder button to the side navigation
// 		sidenav.appendChild(folderButton);
// 	});
// }

function renderFolders(folders) {
  const sidenav = document.getElementById('sidenav');
  const folderTitle = document.querySelector('p'); // Update the <p>test</p> element

  sidenav.innerHTML = ''; // Clear the existing folder list

  folders.forEach(folder => {
    const folderButton = document.createElement('button');
    folderButton.textContent = folder.folder_title;
    folderButton.classList.add('folder-button');

    // Add event listener to handle folder selection and trigger API call
    folderButton.addEventListener('click', async () => {
      folderTitle.textContent = folder.folder_title; // Update the <p> with the selected folder title
      const { email_data, total_pages } = await fetchEmails(folder.folder_id);
      if (email_data.length) {
        renderEmails(email_data);
        renderPaginationControls(folder.folder_id, 1, total_pages);
      }
    });

    sidenav.appendChild(folderButton);
  });
}

function renderEmails(emails) {
	const emailList = document.getElementById('emailList');
	emailList.innerHTML = '';
	emails.forEach(email => {
		const emailItem = document.createElement('li');
		emailItem.classList.add('email-item');

		// Add classes based on the email's status
		if (!email.is_read) {
			emailItem.classList.add('unread');
		}
		if (email.deleted) {
			emailItem.classList.add('deleted');
		}

		emailItem.innerHTML = `
			<strong>From:</strong> ${email.from} <br>
			<strong>Sender:</strong> ${email.sender} <br>
			<strong>Subject:</strong> ${email.subject} <br>
			<strong>Received:</strong> ${new Date(email.received_date_time).toLocaleString()} <br>
			<strong>Importance:</strong> ${email.importance} <br>
			<strong>Parent Folder:</strong> ${email.parent_folder} <br>
			<strong>Read:</strong> ${email.is_read ? 'Yes' : 'No'} <br>
			<strong>Draft:</strong> ${email.is_draft ? 'Yes' : 'No'} <br>
			<strong>Created At:</strong> ${new Date(email.created_at).toLocaleString()} <br>
			<strong>Sent Date:</strong> ${new Date(email.sent_date).toLocaleString()} <br>
			<strong>Received Date:</strong> ${new Date(email.received_date).toLocaleString()}
		`;

		emailList.appendChild(emailItem);
	});
}

function renderPaginationControls(folderId, currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = ''; // Clear existing pagination controls

  if (totalPages > 1) {
    // Previous button
    if (currentPage > 1) {
      const prevButton = document.createElement('button');
      prevButton.textContent = 'Previous';
      prevButton.classList.add('pagination-button');
      prevButton.addEventListener('click', () => fetchAndRenderEmails(folderId, currentPage - 1));
      paginationContainer.appendChild(prevButton);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.classList.add('pagination-button');
      nextButton.addEventListener('click', () => fetchAndRenderEmails(folderId, currentPage + 1));
      paginationContainer.appendChild(nextButton);
    }

    // Log current state for debugging
    console.log(`Pagination: Current Page: ${currentPage}, Total Pages: ${totalPages}`);
  }
}

async function fetchAndRenderEmails(folderId, page = 1) {
  try {
    const { email_data, total_pages } = await fetchEmails(folderId, page);

    if (email_data.length) {
      renderEmails(email_data);
      renderPaginationControls(folderId, page, total_pages);
    }
  } catch (error) {
    console.error('Error fetching emails for pagination:', error);
  }
}

// async function fetchAndRenderEmails(folderId, page = 1) {
//   const { email_data, total_pages } = await fetchEmails(folderId, page);

//   if (email_data.length) {
//     renderEmails(email_data);
//     renderPaginationControls(folderId, page, total_pages);
//   }
// }

// async function init() {
// 	const folders = await fetchFolders();
// 	console.log(folders);

// 	renderFolders(folders);

// 	const emails = await fetchEmails(folders[0].folder_id);
// 	if (emails.length)
// 		fetchAndRenderEmails(emails);
// 		// renderEmails(emails);
// }

async function init() {
  try {
    // Fetch folders and render them
    const folders = await fetchFolders();
    console.log(folders);
    renderFolders(folders);

		console.log("Inital sync inprogress");
		await initalSync();
		console.log("Initial sync Completed");
		
    // Default to the first folder
    if (folders.length > 0) {
      const firstFolderId = folders[0].folder_id;
      const { email_data, total_pages } = await fetchEmails(firstFolderId);

      if (email_data.length) {
        renderEmails(email_data);
        renderPaginationControls(firstFolderId, 1, total_pages);
        document.getElementById('folderTitle').textContent = folders[0].folder_title; // Update the folder title
      }
    }
		isInitialSyncComplete = true;
  } catch (error) {
    console.error('Error initializing the email dashboard:', error);
  }
}

async function sync() {
  try {
    // Fetch folders and render them
    const folders = await fetchFolders();
    console.log(folders);
    renderFolders(folders);

    // Default to the first folder
    if (folders.length > 0) {
      const firstFolderId = folders[0].folder_id;
      const { email_data, total_pages } = await fetchEmailsAfterSync(firstFolderId);

      if (email_data.length) {
        renderEmails(email_data);
        renderPaginationControls(firstFolderId, 1, total_pages);
        document.getElementById('folderTitle').textContent = folders[0].folder_title; // Update the folder title
      }
    }
  } catch (error) {
    console.error('Error initializing the email dashboard:', error);
  }
}

// Call init to load data on page load
window.onload = init;

// *********** SOCKET IMPLEMENTATION ************
const socket = io('http://localhost:3000'); // Replace with your server URL

socket.on('syncProgressPercentage', (data) => {
	const { percentage } = data;
	console.log("Sync Percentage: ", data);
	
	document.getElementById('syncProgress').innerText = `Sync Progress: ${percentage}%`;
});

// Function to emit a sync request every 5 seconds
function triggerSyncPercentage() {
	socket.emit('requestSyncPercentage', { user_id: userId });
}

function triggerSyncMail() {
	if (isInitialSyncComplete) {
		console.log("Trigger sync Mails");
		sync();
	}
}

// Set an interval to trigger sync every 5 seconds
setInterval(triggerSyncPercentage, 5000);
setInterval(triggerSyncMail, 20000);

// Simulate real-time updates
// setInterval(updateEmailList, 5000);