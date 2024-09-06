document.getElementById("connectOutlook").addEventListener('click', async function(event) {
	event.preventDefault();
	
	try {
		const response = await axios({
			method: 'GET',
			url: 'http://localhost:3000/link-account',
			data: {}
		});

		if (response.data.redirect) {
				window.location.href = response.data.redirect;
		} else {
				document.body.innerHTML = response.data.html;
		}
} catch (error) {
		console.error("Error during account linking:", error);
		alert("An error occurred. Please try again.");
}
});