const { Router } = require('express');
const path = require('path');
const fs = require('fs');

module.exports = (app) => {
    const router = Router();

    router.get('/', (req, res) => {
        res.json({
            status: 200,
            message: 'Welcome to api.tawan475.dev! maybe documentations soon?'
        });
    });


    let APIFolder = './api';

    function loadRoutes(dirname, targetPath) {
        let relative = path.relative(dirname, targetPath);
        let absoluteTarget = path.join(dirname, relative);

        let dir = fs.readdirSync(absoluteTarget, { withFileTypes: true });
        dir.forEach(obj => {
            let apiRouteName = '/' + path.join(path.relative(APIFolder, relative), obj.name).replace(/\\|\//g, '/').replace(/.js$/, '');
            let objPath = path.join(absoluteTarget, obj.name);
            if (obj.isDirectory()) loadRoutes(dirname, objPath);
            if (obj.isFile() && obj.name.endsWith(".js")) {
                console.log("Loading api endpoint: " + apiRouteName);
                require(objPath)(app, router, apiRouteName);
            }
        })
    }

    loadRoutes(app.dirname, path.join(app.dirname, APIFolder))

    return router
};