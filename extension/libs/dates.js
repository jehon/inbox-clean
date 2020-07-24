
export function dateAddDays(date, days) {
	let res = new Date(date);
	res.setDate(res.getDate() + days);
	return res;
}

export function dateTruncate(date, hours = 12, minutes = 0) {
	date.setHours(hours);
	date.setMinutes(minutes);
	return date;
}

export function getMinDate() {
	return dateAddDays(new Date(), -100 * 365);
}

export function getMaxDate() {
	return dateAddDays(new Date(), 100 * 365);
}
