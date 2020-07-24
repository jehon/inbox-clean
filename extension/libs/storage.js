/* global chrome */

import { reviveJSON, defaultStorage } from '../shared/utils.js';
import { dateAddDays, dateTruncate } from './dates.js';

function getStoredEmails(storage) {
	const res = [];
	for(const key in storage) {
		if (key.substring(0, 'email_'.length) != 'email_') {
			continue;
		}
		res.push(key);
	}
	return res;
}

function enrich(storage) {
	storage.calculated = {};
	storage.calculated.emails = getStoredEmails(storage);
	for(const key of getStoredEmails(storage)) {
		const current = storage[key];
		current.nextCheck = dateAddDays(dateTruncate(current.lastCheck), storage.checkEvery_days);
		// TODO (showstopper): calculate this to be real data
		current.late = Math.floor(Math.random() * 1000 % 2) == 1;
	}
	return storage;
}

export function reduceToJSON(value) {
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
	return JSON.stringify(value, (key, value) => {
		if (value instanceof Date) {
			return value.toISOString();
		}
		return value;
	});
}

export function get() {
	return new Promise(resolve => chrome.storage.sync.get(null, storage => resolve(storage)))
		.then(storage => reviveJSON(storage))
		.then(storage => Object.assign({}, storage, defaultStorage))
		.then(storage => enrich(storage))
		.then(storage => Object.assign({}, defaultStorage, storage))
	;
}

export function set(key, value) {
	const nv = {};
	nv[key] = reduceToJSON(value);
	return new Promise(resolve => chrome.storage.sync.set(nv, resolve))
		.then(get);
}

export function remove(key) {
	return new Promise(resolve => chrome.storage.sync.remove(key, resolve));
}

export function dump(text = '') {
	get().then(storage => {
		console.info('Current storage: ', text, storage);
		return storage;
	});
}
