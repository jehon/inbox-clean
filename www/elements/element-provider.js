
import '../providers/listing-provider-gmail.js';
import '../providers/listing-provider-test.js';

class ElementProvider extends HTMLElement {
	connectedCallback() {
		this.email = this.getAttribute('email');
		this.category = this.getAttribute('category');

		this.innerHTML = `
			<listing-provider-${this.category} id='listing' email='${this.email}'></listing-provider-${this.category}>
		`;
	}
}

window.customElements.define('element-provider', ElementProvider);
