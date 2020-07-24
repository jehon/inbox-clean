
const ID_MSG_ATTRIBUTE = 'data-id-message';

import { showMessage, hideAllMessages } from '../libs/utils.js';

export default class ListingProviderParent extends HTMLElement {
	connectedCallback() {
		this.email = this.getAttribute('email');
		// We use onclick because we want to be the only one to listen to that event
		hideAllMessages();
		showMessage('message_authenticate', { email: this.email });
		document.querySelectorAll('#authorize-button').forEach(b => { b.onclick = () => this.launchAuthenticate(true); });
		document.querySelectorAll('#signout-button').forEach(b => { b.onclick = () => this.launchLogout(); });

		this.innerHTML = `
			<div class="container-fluid">
				<div id="stats"></div>
				<div>Labels: <span id="labels"></span>
				</div>

				<table class='table table-sm' id='threads'>
					<tbody id='threads'></tbody>
				</table>

				<div>
					<button action="delete-all" type="button" class="btn btn-danger" hidden>Delete all these thread from this page</button>
					<button action="refresh" type="button" class="btn btn-success">Refresh list</button>
				</div>
			</div>
		`;
		this.querySelectorAll('[action=refresh]').forEach(e => e.addEventListener('click', () => this.launchGetMessages()));
		this.querySelectorAll('[action=delete-all]').forEach(e => e.addEventListener('click', () => this.launchDeleteMessages()));
		this.fireLogout();
		Promise.resolve()
			.then(() => this.apiInit())
			.then(() => this.launchAuthenticate(false));
	}

	/* User login/authenticate */

	launchAuthenticate(active) {
		document.querySelector('body').removeAttribute('authenticated');
		Promise.resolve()
			.then(() => this.apiAuthenticate(active))
			.then(email => this.fireAuthenticated(email));
	}

	apiAuthenticate(_active = false) {
		return this.email;
	}

	fireAuthenticated(email) {
		hideAllMessages('message_authenticate');
		document.querySelectorAll('#signout-button').forEach(b => b.removeAttribute('hidden'));
		document.querySelectorAll('nav [data=email]').forEach(e => e.innerHTML = email);
		this.launchGetMessages();
	}

	/* User Logout */

	launchLogout() {
		return Promise.resolve()
			.then(() => this.apiLogout())
			.then(() => this.fireLogout());
	}

	apiLogout() { return true; }

	fireLogout() {
		showMessage('message_authenticate', { email: this.email });
		document.querySelectorAll('#signout-button').forEach(b => b.setAttribute('hidden', 'hidden'));
		document.querySelectorAll('nav [data=email]').forEach(e => e.innerHTML = '');
		this.querySelectorAll('#threads').forEach(e => e.innerHTML = '');
	}

	/* Fill in the content */

	launchGetMessages() {
		const tbody = this.querySelector('#threads');
		hideAllMessages();
		this.querySelectorAll('[action=delete-all').forEach(b => b.setAttribute('hidden', 'hidden'));
		tbody.innerHTML = '<tr><td>Loading</td></tr>';
		return Promise.resolve()
			.then(() => this.apiGetMessages(ID_MSG_ATTRIBUTE, {
				listLength: 10,
				minAgeYears: 5
			}))
			.then(textList => {
				tbody.innerHTML = '';
				if (textList == '') {
					showMessage('message_list_empty', { email: this.email });
				} else {
					if (typeof(textList) == 'string') {
						tbody.innerHTML = textList;
					} else {
						if (!Array.isArray(textList)) {
							textList = [ textList];
						}
						textList.forEach(tr => tbody.appendChild(tr));
					}
					this.querySelectorAll('[action=delete-all').forEach(b => b.removeAttribute('hidden'));
				}
			});


	}

	apiGetMessages(_attribute = 'data-email-id') {
		return false;
	}

	/* delete the elements */

	launchDeleteMessages() {
		const plist = [];
		this.querySelectorAll('#threads > tr').forEach(t => {
			plist.push(
				Promise.resolve()
					.then(() => t.getAttribute(ID_MSG_ATTRIBUTE))
					.then(id => this.apiDeleteMessage(id))
					.then(id => document.querySelector(`#threads > tr[${ID_MSG_ATTRIBUTE}="${id}"]`).classList.add('deleted'))
			);
		});
		return Promise.all(plist).then(() => {
			// Todo: refreshGUI show hide it
			document.querySelectorAll('[action=delete-all]').forEach(b => b.style.display = 'initial');
			showMessage('message_all_deleted_ok', { email: this.email });
		});
	}

	apiDeleteMessage(id) {
		return id;
	}
}

window.customElements.define('listing-provider-parent', ListingProviderParent);
