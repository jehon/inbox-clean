/* global chrome */

import { get as getStorage, set as setStorage } from './storage.js';
import { dateAddDays, dateTruncate } from './dates.js';

export function alarmGetNextTime(storage) {
	let ref = new Date();
	if ('dismissUpto' in storage) {
		ref = new Date(Math.max(ref, storage.dismissUpto));
	}
	return ref;
}

export function alarmDismissForSometime() {
	return getStorage().then(storage => {
		const newDismiss = dateAddDays(new Date(), storage.alarmMinDelay);
		if (newDismiss <= storage.dismissUpto) {
			// dismiss could not be reduced
			return ;
		}
		return setStorage('dismissUpto', newDismiss).then(() => {
			console.info('Dismissed for one day at ', new Date());
			return alarmProgramNext();
		});
	});
}

export function alarmProgramNext() {
	return getStorage().then(storage => {
		const title = 'Now ' + (new Date()).toISOString() + '\n'
			+ 'storage.dismissUpto: ' + JSON.stringify(storage.dismissUpto) + '\n';

		chrome.browserAction.setBadgeText({ text: '' });
		chrome.browserAction.setTitle({ title: title });

		let alarmNextDate = 0;

		for(const key of storage.calculated.emails) {
			const e = storage[key];
			const thisAlarmDate = dateAddDays(dateTruncate(e.lastCheck), storage.alarmMinDelay);
			if (alarmNextDate == 0) {
				alarmNextDate = thisAlarmDate;
			} else {
				alarmNextDate = new Date(Math.min(alarmNextDate, thisAlarmDate));
			}
		}
		// Do not alarm before 'nextAlarmTime'
		alarmNextDate = new Date(Math.max(alarmGetNextTime(storage), alarmNextDate));
		chrome.browserAction.setTitle({ title: title + 'proposed alarmNextDate: ' + alarmNextDate.toISOString() });

		if (alarmNextDate > new Date()) {
			chrome.browserAction.setBadgeText({ text: '' });
			// https://developer.chrome.com/extensions/alarms
			console.info('Programming next alarm at ', alarmNextDate);
			chrome.browserAction.setTitle({ title: title + 'next alarm:' + alarmNextDate.toISOString()});
			chrome.alarms.create('showMessage', { when: alarmNextDate.valueOf() });
			return ;
		}

		chrome.browserAction.setBadgeText({ text: '!' });

		// TODO: should we reprogram an alert in one day? or is it too intrusive?
		// Do we notify or not?
		if (storage.notify) {
			chrome.notifications.create('showMessage', {
				type: 'basic',
				title: 'inbox Clean',
				iconUrl: 'icon.png',
				message: 'You should check your emails oldies to remove them...',
				buttons: [
					{ title: 'go' },
					{ title: 'Dismiss for 1 day'}
				]
			});
		}
	});
}

export function dumpAlarms() {
	if (chrome && chrome.alarms && chrome.alarms.getAll) {
		chrome.alarms.getAll(alarms => console.info('Current alarms: ', alarms));
	}
}
