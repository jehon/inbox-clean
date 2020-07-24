// TODO: GUI when no plugin is found
// TODO: GUI to add email address

import { defaultStorage } from '/shared/utils.js';
import { hasExtension, onMessage, sendStatusVisited } from '../libs/background-connect.js';
import { sendEmailForget } from '../libs/background-connect.js';

import './element-provider.js';

const body = document.querySelector('body');

class ElementStatus extends HTMLElement {
	constructor() {
		super();

	}

	connectedCallback() {
		onMessage((action, payload) => {
			// Route the message to the correct backend
			switch(action) {
				case 'storage':
					this.adapt(payload);
					break;
			}
		});
		sendStatusVisited(); // will trigger 'getStorage' => refreshGui()

		this.innerHTML = `
		<div id="status" class="container-fluid with-extension">
			<div id="status_emails">
				<h3>Email status</h3>
				<table id="emailsList" class="table table-hover">
					<thead>
						<th>Email</th>
						<th>Last checked</th>
						<th>Action</th>
					</thead>
					<tbody>
					</tbody>
				</table>
			</div>
		</div>

		<div class="container-fluid">
			<css-flex>
				<button type="button" class="btn btn-light btn-big" action="create" data="gmail">
					<img class="adapt" src="/providers/gmail.png">
					<img class="adapt" src="/providers/gmail_inbox.png">
					GMail/Inbox
				</button>
				<button type="button" class="btn btn-light" data="test" action="create">
					<img class="adapt" src="/providers/test.png">
					Test
				</button>
			</css-flex>
		</div>

		<div class="container-fluid without-extension">
			<h2>No extension?</h2>
			Using an extension is the easier way to remember to clean up your emails frequently.<br>
			You can add it here<br>
			Preoccupied by privacy? We don't store anything on our servers. All informations are
			stored locally in your browser. And all informations, that means your email
			address and the last time you visited our page.
			<div>
				<a href="http://play.google.com/store/apps/details?id=123">
					<img alt="Disponible sur Google&nbsp;Play" style="margin: 16px -16px 0" width="240" src="https://play.google.com/intl/fr/badges/images/generic/fr_badge_web_generic.png?hl=fr">
				</a>
			</div>
		</div>
		`;
		this.querySelectorAll('[action=create]').forEach(b => 
			b.addEventListener('click', () => {
				window.goProvider(b.getAttribute('data'));
			}));
		this.adapt();
	}

	adapt(storage = defaultStorage) {
		document.querySelector('#debug').innerHTML = JSON.stringify(storage, null, 2);
	
		const emailListElement = document.querySelector('#emailsList > tbody');
		if (!hasExtension()) {
			console.info('No extension found');
			emailListElement.innerHTML = '';
			body.removeAttribute('with-extension');
			return ;
		}
		// With extension...
		body.setAttribute('with-extension', true);
	
		if (storage.calculated.emails.length == 0) {
			// No emails
			document.querySelector('#status #status_emails').style.display = 'none';
		} else {
			// With emails
			document.querySelector('#status #status_emails').style.display = 'initial';
	
			let res = '';
			for(const key of storage.calculated.emails) {
				const eConfig = storage[key];
	
				// Is it late ? show in 'warning' color
				res += `<tr class="${eConfig.late ? 'table-warning' : ''}">
						<td>${eConfig.email}</td>
						<td>${eConfig.lastCheck.toDateString()}</td>
						<td>
							<button class="btn btn-primary" data-email="${eConfig.email}" data-category="${eConfig.category}" type="check">Go check</button>
							<button class="btn btn-danger" data-key="${key}" data-email="${eConfig.email}" type="forget">Forget</button>
						</td>
					</tr>`;
			}
			emailListElement.innerHTML = res;
	
			emailListElement.querySelectorAll('[type=check]').forEach(el => {
				const dataEmail = el.getAttribute('data-email');
				const dataCategory = el.getAttribute('data-category');
				el.addEventListener('click', () => this.emailCheck(dataEmail, dataCategory));
			});
			emailListElement.querySelectorAll('[type=forget]').forEach(el => {
				const dataKey = el.getAttribute('data-key');
				const dataEmail = el.getAttribute('data-email');
				el.addEventListener('click', () => this.emailForget(dataKey, dataEmail));
			});
		}

	}

	emailForget(key, email) {
		sendEmailForget(key);
		const msg = document.querySelectorAll('#message_forgotten');
		msg.forEach(b => {
			b.removeAttribute('hidden');
			b.querySelectorAll('[data=email]').forEach(c => c.innerHTML = email);
		});
		setTimeout(() => {
			msg.forEach(b => b.setAttribute('hidden', 'hidden'));
		}, 3000);
	}

	emailCheck(email, category) {
		window.goProvider(category, email);
	}
}

window.customElements.define('element-status', ElementStatus);
