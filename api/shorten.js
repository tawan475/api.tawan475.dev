const createError = require('http-errors');
const crypto = require('crypto')

module.exports = (app, router, routeName) => {
    router.get(routeName, (req, res, next) => {
        next(createError(405));
    });

    router.post(routeName, async (req, res, next) => {
        if (!req.body.url) {
            let err = new Error('No URL included.');
            err.status = 400;
            err.message = 'No URL included.';
            return next(err);
        }

        var url = req.body.url
        let md5 = crypto.createHash('md5').update(url).digest("hex")

        var sql = `SELECT * FROM UID WHERE md5 = ?;`;
        let exist = await app.db.runQuery(sql, [md5]).catch(err => {
            return next(createError(err));
        });

        if (exist.length !== 0) {
            exist = JSON.parse(JSON.parse(JSON.stringify(exist))[0].JSON);
            let result = {
                status: "Found known entity in database.",
                shorten: {
                    url: "https://go.tawan475.dev/" + exist.uid,
                    originalUrl: exist.url,
                    uid: exist.uid
                }
            }
            return res.json(result);
        }

        if (url.length > 2048) {
            let err = new Error('URL too large.');
            err.status = 413;
            err.message = 'URL too large.';
            return next(err);
        }

        if (!isValidHttpUrl(url)) {
            let err = new Error('Malformed URL.');
            err.status = 400;
            err.message = 'Malformed URL.';
            return next(err);
        }

        var uid = await app.db.generateUID();
        var newShorten = {
            type: 'shorten',
            uid: uid,
            md5: md5,
            originalUrl: url,
            size: url.length,
            author: req.trustedip,
            time: Date.now(),
            url: "https://go.tawan475.dev/" + uid
        }

        var sql = `INSERT INTO UID (UID, JSON, type, md5, owner) VALUES (?, ?, ?, ?, ?);`;

        await app.db.runQuery(sql, [uid, JSON.stringify(newShorten), "shorten", md5, req.trustedip]).catch(err => {
            return next(createError(err));
        }).then(() => {
            let result = {
                status: "Entity created: Link shorten",
                shorten: {
                    url: "https://go.tawan475.dev/" + uid,
                    originalUrl: url,
                    uid: uid,
                    size: url.length
                }
            }
            return res.json(result);
        })
    });

    function isValidHttpUrl(string) {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    }
}