/* global chrome */

/***********************************/
/******* Preference  */
// export function getPreference(email, name, def) {
// 	// TODO: real system
// 	return def;
// }

/***********************************/
/******* Gui  */

export function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template.content.firstChild;
}

export function icon(name, label = null) {
	return `<span class="oi oi-${name}" ${label === null ? '' : `data-tooltip="${label}"`} aria-hidden="true"></span>`;
}

export function showMessage(id, data = {}, timeout = -1) {
	const message = document.querySelector(`[msgid='${id}']`);
	if (message == null) {
		console.error('Could not find message: ', id);
		return ;
	}
	message.querySelectorAll('[data=email]').forEach(b => {
		const key = b.getAttribute('data');
		if (key in data) {
			b.innerHTML = data[key];
		} else {
			b.innerHTML = '';
		}
	});
	message.removeAttribute('hidden');
	if (timeout > 0) {
		setTimeout(() => {
			this.hideMessage(id);
		}, timeout * 1000);
	}
}

export function hideMessage(id) {
	let message = id;
	if (typeof(id) == 'string') {
		message = document.querySelector(`[msgid='${id}']`);
		if (message == null) {
			console.error('Could not find message: ', id);
			return ;
		}
	}
	message.setAttribute('hidden', 'hidden');
}

export function hideAllMessages() {
	document.querySelectorAll('[msgid]').forEach(e => hideMessage(e));
}

/***********************************/
/******* Other  */

export function uniqueNonNull(arr) {
	return [...new Set(arr.filter(el => (el !== null)))];
}

export function dynamicallyLoadScript(url) {
	return new Promise(resolve => {
		var script = document.createElement('script'); // Make a script DOM node
		script.src = url; // Set it's src to the provided URL

		document.head.appendChild(script); // Add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)

		// Then bind the event to the callback function.
		// There are several events for cross browser compatibility.
		script.onreadystatechange = resolve;
		script.onload = resolve;
	});
}
