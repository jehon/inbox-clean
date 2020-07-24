
// AFAIK: it is not used in frontend...
export const defaultStorage = {
	notify: false,
	dismissUpto: null,
	alarmMinDelay: 1,  // 0.01 = +/- 15 minutes, 1 = 1 day
	checkEvery_days: 30
};

export function reviveJSON(obj) {
	let objNew = {};
	// 1975-08-19T23:15:30.000Z
	// 2018-04-12T08:26:09.400Z
	// const regexDateJSON = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
	const regexDateJSON = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|(\+|-)([\d|:]*))?$/;
	switch(typeof(obj)) {
		case 'object':			
			if (obj == null) {
				return null;
			}
			if (Array.isArray(obj)) {
				objNew = [];
				for(const key in obj) {
					objNew[key] = reviveJSON(obj[key]);
				}
				return objNew;
			}
			for(const key of Object.keys(obj)) {
				objNew[key] = reviveJSON(obj[key]);
			}
			return objNew;
		case 'string':
			if (regexDateJSON.test(obj)) {
				return new Date(obj);
			}
			if (obj[0] == '{') {
				try {
					let nobj = JSON.parse(obj);
					return reviveJSON(nobj);
				} catch (e) {
					// Oh well, but whatever...
					// This happen when a simple string is received
					console.error('Error in reviveJSON on ', obj, ': ', e);
				}
			}
	}
	return obj;
}
