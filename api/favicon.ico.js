module.exports = (app, router, routeName) => {
    router.get(routeName, (req, res) => {
        res.redirect(301, 'https://go.' + req.domain  + '/favicon.ico');
    });
}
