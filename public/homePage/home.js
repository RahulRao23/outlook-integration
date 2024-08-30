function createAccount(event) {
	event.preventDefault();
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;

	// Placeholder code to handle account creation
	alert("Account created successfully!");

	// After account creation, redirect to the Outlook connection page
	window.location.href = "outlook_connection.html";
}