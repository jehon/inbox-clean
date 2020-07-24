/* globals gapi, chrome */

// https://developers.google.com/gmail/api/quickstart/js
// https://console.developers.google.com/

import ElementListProvider from '../elements/listing-provider-parent.js';
import { icon, uniqueNonNull, dynamicallyLoadScript, htmlToElement } from '../libs/utils.js';

// Client ID and API key from the Developer Console
const CLIENT_ID = '333285878810-9d87vqm2buh8ggl80gl8mo12ajfs3af4.apps.googleusercontent.com';
const CLIENT_SECRET = 'AIzaSyDhJ1ek2Y-4qLIb-A98jMnQOCNIoZ8gN-Y'; // api key

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

export class ListingProviderGMail extends ElementListProvider {
	apiInit() {
		return dynamicallyLoadScript('https://apis.google.com/js/api.js');
	}

	apiAuthenticate(active) {
		return new Promise((resolve, _reject) => {
			gapi.load('client:auth2', () => {
				resolve();
			});
		})
			.then(() => gapi.client.init({
				apiKey: CLIENT_SECRET,
				clientId: CLIENT_ID,
				discoveryDocs: DISCOVERY_DOCS,
				scope: SCOPES
			}))
			.then(() => {
				return new Promise((resolve, _reject) => {
					/**
					 *  Called when the signed in status changes, to update the UI
					 *  appropriately. After a sign-in, the API is called.
					 */
					function updateSigninStatus() {
						if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
							gapi.client.gmail.users.getProfile({
								userId: 'me'
							}).then(response => {
								resolve(response.result.emailAddress);
								// 	stats: {
								// 		emails: response.result.messagesTotal,
								// 		threads: response.result.threadsTotal
								// 	}
								// });
							});
						}
					}

					// Listen for sign-in state changes.
					gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

					// Handle the initial sign-in state.
					updateSigninStatus();

					// Force sign in if required
					if (active) {
						if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
							gapi.auth2.getAuthInstance().signIn();
						}
					}
				});
			});
	}

	apiLogout() {
		return gapi.auth2.getAuthInstance().signOut();
	}

	apiGetMessages(htmlIdAttribute, options) {
		// https://developers.google.com/gmail/api/v1/reference/users/threads/list
		return gapi.client.gmail.users.threads.list({
			userId: 'me',
			includeSpamTrash: false,
			maxResults: options.listLength,
			q: `older_than:${options.minAgeYears}y`
			// pageToken = ... (to skip all with labels)
		}).then(response => {
			// https://developers.google.com/gmail/api/v1/reference/users/threads#resource
			let currentList = response.result.threads;
			return Promise.all(currentList.map(thread => thread2document(htmlIdAttribute, thread)));
		});
	}

	apiDeleteMessage(id) {
		return gapi.client.gmail.users.threads.trash({
			userId: 'me',
			id: id
		}).then(() => id);
	}
}
window.customElements.define('listing-provider-gmail', ListingProviderGMail);



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

// function listLabels() {
// 	return gapi.client.gmail.users.labels.list({
// 		'userId': 'me'
// 	}).then(function (response) {
// 		var labels = response.result.labels;
// 		if (labels && labels.length > 0) {
// 			for (let i = 0; i < labels.length; i++) {
// 				var label = labels[i];
// 				if (label2GMailIcon(label.name).substring(0, 6) == '<span>') {
// 					personalLabels.push(label.name);
// 				}
// 			}
// 		}
// 		skippedLabels = personalLabels;
// 		document.querySelector('#labels').innerHTML = personalLabels.join(', ');
// 	});
// }

function email2document(msg, parentHtmlId) {
	let date = getHeaderValue(msg, 'Date');
	let dateStr = '';
	if (date) {
		dateStr = new Date(date).toISOString().substring(0, 10);
	}

	return `<tr>
		<td class="icons-column">${labels2GMailIcons(msg.labelIds)}</td>
		<td class="date-column">${dateStr}</td>
		<td class="email-column table-truncate">
			<div class="table-truncate-body">${getHeaderValue(msg, 'From')}</div>
		</td>
		<td class="table-truncate">
			<div class="table-truncate-body" data-toggle="collapse" data-target="#msg_details_${msg.id}" aria-expanded="true" aria-controls="msg_details_${msg.id}">
				${getHeaderValue(msg, 'Subject')}
				<span class="details">${msg.snippet}</span>
			</div>
			<div style='height: 2em'></div>
			<div id="msg_details_${msg.id}" class="collapse" aria-labelledby="msg_${msg.id}" data-parent="#${parentHtmlId}">
				${msg.snippet}
			</div>
		</td>
	</tr>`;
}

function thread2document(htmlIdAttribute, thread) {
	// https://developers.google.com/gmail/api/v1/reference/users/threads/get
	return gapi.client.gmail.users.threads.get({
		userId: 'me',
		id: thread.id,
		format: 'metadata'
	}).then(response => {
		const thread = response.result;
		const threadLabels = getAllLabelsForThread(thread);
		// TODO: filter by labels
		// for(const l of threadLabels) {
		// 	if (skippedLabels.includes(l)) {
		// 		console.log('Skipping due to: ', l, thread);
		// 		return ;
		// 	}
		// }

		console.log(thread, response);

		let threadTxt = `<tr id='thread_line_${thread.id}' ${htmlIdAttribute}='${thread.id}'>
			<td class="icons-column table-truncate">
				<div class="table-truncate-body">
					<span class='deleted-msg'>${icon('deleted')}</span>
					${ labels2GMailIcons(threadLabels) }
				</div>
			</td>
			<td class="number-column">
				${thread.messages.length}
			</td>
			<td class="table-truncate">
				<div class="table-truncate-body" data-toggle="collapse" data-target="#thread_details_${thread.id}" aria-expanded="true" aria-controls="thread_details_${thread.id}">
					<span class='p-3'>${ getHeaderValue(thread.messages[0], 'Subject')}</span>
					<span class='details'>${thread.messages[0].snippet}</span>
				</div>
				<div style='height: 2em'></div>
				<div id="thread_details_${thread.id}" class="collapse" aria-labelledby="thread_${thread.id}" data-parent="#threads">
					<table class="table table-sm">
						<tbody id="thread_details_${thread.id}_table">
							${thread.messages.map(msg => email2document(msg, `thread_details_${thread.id}_table`)).join('')}
						</tbody>
					</table>
				</div>
			</td>
			</tr>`;

		const  targetEmailsElement = htmlToElement(threadTxt);
		return targetEmailsElement;
	});
}
