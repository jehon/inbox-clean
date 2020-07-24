
/* globals gapi, icon, uniqueNonNull, getPreference, chrome */

// https://developers.google.com/gmail/api/quickstart/js
// https://console.developers.google.com/

// redirect configuré: https://www.google.com/robots.txt

// Client ID and API key from the Developer Console
const CLIENT_ID = '333285878810-9d87vqm2buh8ggl80gl8mo12ajfs3af4.apps.googleusercontent.com';
const CLIENT_SECRET = 'AIzaSyDhJ1ek2Y-4qLIb-A98jMnQOCNIoZ8gN-Y'; // api key

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

/* global oauth2 */
// import '../libs/chrome-ex-oauth2/oauth2.js';

// const authorization_url = 'https://accounts.google.com/o/oauth2/v2/auth';
// const access_token_url = 'https://www.googleapis.com/oauth2/v4/token';
// const redirect_url = 'https://www.google.com/robots.txt';
// const scopes = [ SCOPES ];

// export function authenticate() {
// 	/* GMail for extensions */
// 	var url = authorization_url + '?response_type=code&client_id=' + CLIENT_ID + '&redirect_uri=' + redirect_url + '&scope=';
// 	for (var i in scopes) {
// 		url += scopes[i];
// 	}
// 	window.location = url;
// }

// export function landing() {
// 	return new Promise((resolve, reject) => {
// 		const url = window.location.href;

// 		if (url.match(/\?error=(.+)/)) {
// 			var error = url.match(/\?error=(.*)/)[1];
// 			reject(error);
// 		} else {
// 			var code = url.match(/\?code=([\w\/\-]+)/)[1];
// 			console.info('Code found: ', code);

// 			// Get the token
// 			// https://developers.google.com/identity/protocols/OAuth2WebServer
// 			var xhr = new XMLHttpRequest();
// 			xhr.addEventListener('readystatechange', function () {
// 				console.warn('ready state: ', xhr.readyState);
// 				if (xhr.readyState == 4) {
// 					if (xhr.status == 200) {
// 						if (xhr.responseText.match(/error=/)) {
// 							reject(xhr.responseText);
// 						} else {
// 							// Parsing JSON Response.
// 							const response = xhr.responseText;
// 							const jsonResponse = JSON.parse(response);
// 							// Replace "access_token" with the parameter
// 							// relevant to the API you're using.
// 							const tokenOauth = jsonResponse.access_token;
// 							resolve(tokenOauth);
// 						}
// 					} else {
// 						reject(xhr.responseText);
// 					}
// 				}
// 			});
// 			xhr.open('POST', access_token_url, true);
// 			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
// 			xhr.send(`client_id=${client_id}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${redirect_url}`);
// 		}
// 	});
// }
// 
//	gapi.client.setToken({ access_token: xxx });

function labels2GMailIcons(labels) {
	if (!labels || !labels.length) {
		return '';
	}
	return '<span class="icons">' + labels.map(label => label2GMailIcon(label)).join(' ').trim() + '</span>';
}

function label2GMailIcon(label) {
	const i = (name) => icon(name, label);

	if (label.substring(0, 6).toUpperCase() == 'LABEL_') {
		return '';
	}

	switch(label) {
		case 'INBOX':
		case 'TRASH':
		case 'DRAFT':
		case 'SPAM':
		case 'CHAT':
			return '';
		case 'CATEGORY_PROMOTIONS': return i('tag');
		case 'CATEGORY_UPDATES': return i('cart');
		case 'CATEGORY_FORUMS': return i('rss'); 
		case 'UNREAD': return i('envelope-closed');
		case 'IMPORTANT': return i('thumb-up');
		case 'SENT': return i('external-link');
		case 'STARRED': return i('star');
		case 'CATEGORY_SOCIAL': return i('link-intact');
		case 'CATEGORY_PERSONAL': return i('heart');
		default: return `<span>${label}</span>`;
	}
}

/************* */
/** OAuth      */
/************* */
const onUserChangeCallback = new Callback();
export function onUserChange(callback) {
	onUserChangeCallback.add(callback);
}

export function authenticate() {
	/* Main page loading ...*/
	/**
	 *  On load, called to load the auth2 library and API client library.
	 */
	return gapi.load('client:auth2', () => {
		gapi.client.init({
			apiKey: CLIENT_SECRET,
			clientId: CLIENT_ID,
			discoveryDocs: DISCOVERY_DOCS,
			scope: SCOPES // Was string, became array
		}).then(onConnected);
	});
}

function onConnected() {
	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */
	function updateSigninStatus() {
		if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
			document.querySelector('body').setAttribute('authenticated', 'authenticated');
			gapi.client.gmail.users.getProfile({
				userId: 'me'
			}).then(response => {
				onUserChangeCallback.fire({
					email: response.result.emailAddress,
					stats: {
						emails: response.result.messagesTotal,
						threads: response.result.threadsTotal
					}
				});
			});
		} else {
			document.querySelector('body').removeAttribute('authenticated');
			onUserChangeCallback.fire(false);
		}
	}

	// Listen for sign-in state changes.
	gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

	// Handle the initial sign-in state.
	updateSigninStatus();

	// Can only use that when auth2 is initialized ?
	document.querySelectorAll('#authorize-button')
		.forEach(el => el.onclick = () => gapi.auth2.getAuthInstance().signIn());
	document.querySelectorAll('#signout-button')
		.forEach(el => el.onclick = () => gapi.auth2.getAuthInstance().signOut());
}

function showUser(user) {
	// https://developers.google.com/gmail/api/v1/reference/users/getProfile
	gapi.client.gmail.users.getProfile({
		userId: 'me'
	}).then(response => {
		document.querySelector('#emailAddress').innerHTML = user.email;
		document.querySelector('#stats').innerHTML =
			`${user.stats.emails} messages and ${user.stats.threads} threads`;
	});
}

function hideUser() {
	document.querySelector('#emailAddress').innerHTML = '';
	document.querySelector('#stats').innerHTML = '';
}

/**
 * Public functions
 */

function getHeaderValue(msg, field, multiple = false) {
	const results = [];
	msg.payload.headers.forEach(el => {
		if (el.name.toUpperCase() == field.toUpperCase()) {
			results.push(el.value);
		}
	});
	const resultsUN = uniqueNonNull(results);
	if (multiple) {
		return resultsUN;
	}
	return resultsUN[0];
}

function getAllLabelsForThread(thread) {
	const results = [];
	thread.messages.forEach(el => {
		if (el.labelIds) results.push(...el.labelIds);
	});
	const resultsUN = uniqueNonNull(results)
		.filter(l => !['SENT'].includes(l));
	return resultsUN;
}

function listLabels() {
	return gapi.client.gmail.users.labels.list({
		'userId': 'me'
	}).then(function (response) {
		var labels = response.result.labels;
		if (labels && labels.length > 0) {
			for (let i = 0; i < labels.length; i++) {
				var label = labels[i];
				if (label2GMailIcon(label.name).substring(0, 6) == '<span>') {
					personalLabels.push(label.name);
				}
			}
		}
		skippedLabels = personalLabels;
		document.querySelector('#labels').innerHTML = personalLabels.join(', ');
	});
}



// function email2document(targetElement, msg) {
// 	let date = getHeaderValue(msg, 'Date');
// 	let dateStr = '';
// 	if (date) {
// 		dateStr = new Date(date).toISOString().substring(0, 10);
// 	}

// 	targetElement.innerHTML += `<tr>
// 		<td class="icons-column">${labels2GMailIcons(msg.labelIds)}</td>
// 		<td class="date-column">${dateStr}</td>
// 		<td class="email-column table-truncate">
// 			<div class="table-truncate-body">${getHeaderValue(msg, 'From')}</div>
// 		</td>
// 		<td class="table-truncate">
// 			<div class="table-truncate-body" data-toggle="collapse" data-target="#msg_details_${msg.id}" aria-expanded="true" aria-controls="msg_details_${msg.id}">
// 				${getHeaderValue(msg, 'Subject')}
// 				<span class="details">${msg.snippet}</span>
// 			</div>
// 			<div style='height: 2em'></div>
// 			<div id="msg_details_${msg.id}" class="collapse" aria-labelledby="msg_${msg.id}" data-parent="#${targetElement.id}">
// 				${msg.snippet}
// 			</div>
// 		</td>
// 	</tr>`;
// }

// function thread2document(targetElement, thread) {
// 	// https://developers.google.com/gmail/api/v1/reference/users/threads/get
// 	gapi.client.gmail.users.threads.get({
// 		userId: 'me',
// 		id: thread.id,
// 		// format: 'metadata'
// 	}).then(response => {
// 		const thread = response.result;
// 		const threadLabels = getAllLabelsForThread(thread);
// 		for(const l of threadLabels) {
// 			if (skippedLabels.includes(l)) {
// 				// console.log('Skipping due to: ', l, thread);
// 				return ;
// 			}
// 		}

// 		let threadTxt = `<tr id='thread_line_${thread.id}'>
// 			<td class="icons-column table-truncate">
// 				<div class="table-truncate-body">
// 					<span class='deleted-msg'>${icon('deleted')}</span>
// 					${ labels2GMailIcons(threadLabels) }
// 				</div>
// 			</td>
// 			<td class="number-column">
// 				${thread.messages.length}
// 			</td>
// 			<td class="table-truncate">
// 				<div class="table-truncate-body" data-toggle="collapse" data-target="#thread_details_${thread.id}" aria-expanded="true" aria-controls="thread_details_${thread.id}">
// 					<span class='p-3'>${ getHeaderValue(thread.messages[0], 'Subject')}</span>
// 					<span class='details'>${thread.messages[0].snippet}</span>
// 				</div>
// 				<div style='height: 2em'></div>
// 				<div id="thread_details_${thread.id}" class="collapse" aria-labelledby="thread_${thread.id}" data-parent="#threads">
// 					<table class="table table-sm">
// 						<tbody id="thread_details_${thread.id}_table"></tbody>
// 					</table>
// 				</div>
// 			</td>
// 			</tr>`;
// 		targetElement.innerHTML += threadTxt;
// 		const targetEmailsElement = targetElement
// 			.querySelector(`#thread_details_${thread.id}_table`);
// 		thread.messages.forEach(msg => email2document(targetEmailsElement, msg));
// 	});
// }

// // https://developers.google.com/gmail/api/v1/reference/users/threads/list
// function listThreads() {
// 	const element = document.querySelector('#threads');
// 	return gapi.client.gmail.users.threads.list({
// 		userId: 'me',
// 		includeSpamTrash: false,
// 		maxResults: getPreference('gmail.count', 18),
// 		q: 'older_than:5y'
// 		// pageToken = ... (to skip all with labels)
// 	}).then(response => {
// 		// https://developers.google.com/gmail/api/v1/reference/users/threads#resource
// 		currentList = response.result.threads;
// 		return Promise.all(currentList.map(thread => thread2document(element, thread)));
// 	});
// }

// function deleteThreads() {
// 	return Promise.all(currentList.map(thread => {
// 		return gapi.client.gmail.users.threads.trash({
// 			userId: 'me',
// 			id: thread.id
// 		}).then(() => document.querySelector(`#thread_line_${thread.id}`).classList.add('deleted'));
// 	})).then(() => {

// 		// TODO: show a message on the page (! language)
// 		// And refreshGUI show hide it
// 		allDeleted.style.display = 'initial';
// 	});
// }
