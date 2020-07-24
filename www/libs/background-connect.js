/* global chrome */
import { reviveJSON } from '/shared/utils.js';

// Make this discoverable?
// TODO showstopper: set the correct id here
const extensionID = 'jpagcjhfbkbhfoflngomhlgelpheedae';

let callbacks = new Set();

let withExtension = false;

// Default value if no background extension is found
let sendMessage = () => {};

if (chrome && chrome.runtime && chrome.runtime.connect) {
	const backgroundPort = chrome.runtime.connect(extensionID);

	backgroundPort.onMessage.addListener((request) => {
		// Only when we receive a message are we sure that the extension is there...
		withExtension = true;

		if (!('action' in request)) {
			console.error('Malformed request: no action in ', request);
			return ;
		}
		if (!('payload' in request)) {
			console.error('Malformed request: no payload in ', request);
			return ;
		}

		const action = request.action;
		const payload = reviveJSON(request.payload);
		for (const callback of callbacks) {
			callback(action, payload);
		}
	});
	sendMessage = (action, payload = {}) => backgroundPort.postMessage({ action, payload});
}

export function hasExtension() {
	return withExtension;
}

export function onMessage(callback) {
	callbacks.add(callback);
	return () => callbacks.delete(callback);
}

export function sendStatusVisited() {
	sendMessage('statusVisited');
}

export function sendEmailVisited(email, category) {
	sendMessage('emailVisited', { email, category });
}

export function sendEmailForget(email) {
	sendMessage('emailForget', email);
}
