
import ElementListProvider from '../elements/listing-provider-parent.js';

export class ListingProviderTest extends ElementListProvider {
	apiInit() {
		return true;
	}

	apiAuthenticate(_active) {
		if (this.email == 'test0@test.com') {
			console.log('listing-provider-test: ', this.email, ': sending something different');
			return Promise.resolve('somethingelse@test.com');
		}
		return Promise.resolve(this.email);
	}

	apiGetMessages(attribute, options) {
		let txt = '';
		for(let i = 0; i < options.listLength; i++) {
			let rnd = Math.floor(Math.random() * Math.pow(10, 10));
			let line = `<tr ${attribute}='${i}'><td>${i}</td><td>email_${rnd}</td></tr>`;
			txt += line;
		}
		return txt;
	}

	apiDeleteMessage(id) {
		return id;
	}
}

window.customElements.define('listing-provider-test', ListingProviderTest);
