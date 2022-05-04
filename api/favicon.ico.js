module.exports = (app, router, path) => {
    router.get(path, (req, res) => {
        res.redirect(301, 'https://cdn.' + req.domain  + '/favicon.ico');
    });
}