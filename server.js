/* eslint-env node, mocha */
const port = 6060;

const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(morgan('dev'));

app.use('/node_modules/', express.static('node_modules/'));
app.use('/', express.static('www/'));
app.use('/shared/', express.static('extension/shared/'));

app.listen(port, function () {
	console.info(`Example app listening on port ${port}!`);
});
