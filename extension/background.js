/* global chrome */

import { alarmDismissForSometime, alarmProgramNext } from './libs/alarms.js';
import { get as getStorage, set as setStorage, remove as removeStorage, reduceToJSON } from './libs/storage.js';

// This is an event page:
//  @See https://developer.chrome.com/extensions/event_pages

function launchStatusPage() {
	chrome.tabs.create({ url: 'http://localhost:6060/status.html' });
}

// React to icon clicked
chrome.browserAction.onClicked.addListener(launchStatusPage);

// Not used: notifications
// // React to notifications:
// //  @See https://developer.chrome.com/apps/notifications
// chrome.notifications.onClicked.addListener(launchStatusPage);
// chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
// 	if (buttonIndex == 0) {
// 		// Go
// 		launchStatusPage();
// 	}
// 	if (buttonIndex == 1) {
// 		// Dismiss for one day
// 		alarmDismissForSometime();
// 	}
// });

// React to alarms:
chrome.alarms.onAlarm.addListener(alarmProgramNext);

// Program the various alarms as soon as it is installed
//  @See https://developer.chrome.com/extensions/runtime#event-onInstalled
chrome.runtime.onInstalled.addListener(() =>
	alarmDismissForSometime()
		.then(alarmProgramNext)
);

const ports = new Set();
function sendToAllPorts(action, payload) {
	// console.log('Send to all: ', action, ' with ', payload);
	// https://developer.chrome.com/apps/runtime#type-Port
	for (const port of ports) {
		port.postMessage({ action, payload });
	}
}

function sendUpdateStorageToAllPorts() {
	getStorage()
		.then(storage => reduceToJSON(storage))
		.then(storage => sendToAllPorts('storage', storage));
}

// Web page script interactions:
chrome.runtime.onConnectExternal.addListener((port) => {
	ports.add(port);

	port.onDisconnect.addListener(() => {
		ports.delete(port);
	});

	port.onMessage.addListener((request, sender) => {
		if (sender.url == '') {
			console.error('Invalid sender: ', sender);
			return ;
		}

		const sendResponseToEmitter = (action, payload) => port.postMessage({ action, payload });

		if (!('action' in request)) {
			sendResponseToEmitter('Invalid payload: no action', request);
		}

		if (!('payload' in request)) {
			sendResponseToEmitter('Invalid payload: no payload', request);
		}
		const action = request.action;
		const payload = request.payload;

		console.info('Message received: ', action, ' with ', payload);
		switch(action) {
			case 'getStorage': 
				sendUpdateStorageToAllPorts();
				break;
			case 'statusVisited':
				alarmDismissForSometime();
				sendUpdateStorageToAllPorts();
				break;
			case 'emailVisited':
				setStorage('email_' + payload.email, { email: payload.email, category: payload.category, lastCheck: new Date() })
					.then(sendUpdateStorageToAllPorts);
				break;
			case 'emailForget':
				removeStorage(payload)
					.then(sendUpdateStorageToAllPorts);
				break;
			default:
				console.error('Invalid action', action);
				sendResponseToEmitter('Invalid action', action);
				break;
		}
	});
});
