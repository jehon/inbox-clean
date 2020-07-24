
import './elements/element-status.js';
import { sendEmailVisited } from './libs/background-connect.js';

window.goHome = function() {
	document.querySelector('#content').innerHTML = '<element-status></element-status>';
};
window.goProvider = function(category, email = '') {
	document.querySelector('#content').innerHTML = `<element-provider email="${email}" category="${category}"></element-provider>`;
};
window.goHome();

document.querySelectorAll('[action=home').forEach(b => b.addEventListener('click', window.goHome));

// TODO showstopper: remove this auto generated data:
sendEmailVisited(`test${(new Date()).getSeconds() % 5}@test.com`, 'test');
sendEmailVisited('test0@test.com', 'test');
