document.getElementById("createAccountForm").addEventListener('submit', async function(event) {
	event.preventDefault();
	
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	
	try {
		const response = await axios({
				method: 'POST',
				url: 'http://localhost:3000/create-account',
				data: {
						username,
						password
				}
		});

		if (response.data.redirect) {
				window.location.href = response.data.redirect;
		} else {
				document.body.innerHTML = response.data.html;
		}
} catch (error) {
		console.error("Error during account creation:", error);
		alert("An error occurred. Please try again.");
}
});
