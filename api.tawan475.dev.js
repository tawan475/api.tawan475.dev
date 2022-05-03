require('dotenv').config();
const fs = require('fs');
const createError = require('http-errors');
const express = require('express');

const app = express();
app.dirname = __dirname;
require('./libs/middlewares')(app);

app.use(require('./router'));

app.use(function (req, res, next) {
    next(createError(404));
});


function errorHandler(err, req, res, next) {
    if (!err) return;
    res.status(err.status || 500).json({ status: err.status || 500, message: err.message || 'Internal Server Error' });
};
app.use(errorHandler);

const options = process.env.NODE_ENV === "production" ? {
    key: fs.readFileSync('./libs/ssl/private.key.pem'),
    cert: fs.readFileSync('./libs/ssl/domain.cert.pem'),
    ca: fs.readFileSync('./libs/ssl/intermediate.cert.pem')
} : {
    key: fs.readFileSync('./libs/ssl/localhost/localhost.key'),
    cert: fs.readFileSync('./libs/ssl/localhost/localhost.crt')
}

// disabled for http, port = 8001
// require('http').createServer(app).listen(process.env.PORT, () => {
//     console.log(`listening at HTTP`)
// });

require('https').createServer(options, app).listen(process.env.SECURE_PORT, () => {
    console.log(`listening at HTTPS`)
});
