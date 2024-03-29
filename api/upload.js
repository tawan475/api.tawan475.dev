const createError = require('http-errors');
const fileUpload = require('express-fileupload');
const mime = require('mime-types');
const path = require('path');

module.exports = (app, router, routeName) => {
    app.use(fileUpload({
        limits: {
            fileSize: 150 * 1024 * 1024
        },
        safeFileNames: true,
        preserveExtension: 16,
        abortOnLimit: true,
        useTempFiles: true,
        tempFileDir: path.join(app.dirname, '../upload/temp/')
    }));

    router.get(routeName, (req, res, next) => {
        next(createError(405));
    });

    router.post(routeName, async (req, res, next) => {
        if (!req.files) {
            let err = new Error('No files included.');
            err.status = 400;
            err.message = 'No files included.';
            return next(err);
        }
		
        var file = req.files.file;

        var sql = `SELECT * FROM UID WHERE md5 = ?;`;
        let exist = await app.db.runQuery(sql, [file.md5]).catch(err => {
            return next(createError(err));
        });

        if (exist.length !== 0) {
            exist = JSON.parse(JSON.parse(JSON.stringify(exist))[0].JSON);
            let result = {
                status: 200,
                message: "Found known entity in database.",
                file: {
                    url: "https://go.tawan475.dev/" + exist.uid + exist.ext,
                    fullUrl: "https://go.tawan475.dev/" + exist.uid + "/" + exist.name + exist.ext,
                    uid: exist.uid,
                    file_uid: exist.uid,
                    filename: exist.name + exist.ext
                }
            }

            return res.json(result);
        }

        var ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : (mime.extension(file.mimetype) ? '.' + mime.extension(file.mimetype) : '');
        var name = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) /*.replace(new RegExp(`${ext}\.?${ext}$`), `.${ext}`)*/ ;

        var uid = await app.db.generateUID();
        var nameDate = `${name}-${Date.now()}.${file.md5}.${uid}`;

        file.mv(path.join(app.dirname, '../upload/', nameDate + ext), async function (err) {
            if (err) return next(createError(err));

            var newUpload = {
                type: 'file',
                uid: uid,
                md5: file.md5,
                name: name,
                nameDate: nameDate,
                mimetype: file.mimetype,
                ext: ext,
                size: file.size,
                author: req.trustedip,
                time: Date.now(),
                url: "https://go.tawan475.dev/" + uid + ext,
                fullUrl: "https://go.tawan475.dev/" + uid + "/" + name + ext
            }

            var sql = `INSERT INTO UID (UID, JSON, type, md5, owner) VALUES (?, ?, ?, ?, ?);`;

            await app.db.runQuery(sql, [uid, JSON.stringify(newUpload), "file", file.md5, req.trustedip]).catch(err => {
                return next(createError(err));
            }).then(() => {
                let result = {
                    status: 200,
                    message: "Entity created: Uploaded new file.",
                    file: {
                        url: "https://go.tawan475.dev/" + uid + ext,
                        fullUrl: "https://go.tawan475.dev/" + uid + "/" + name + ext,
                        uid: uid,
                        filename: name + ext,
                        size: file.size
                    }
                };
                return res.json(result);
            })
        });
    });
}