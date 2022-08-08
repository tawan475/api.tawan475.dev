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
        if (!req.files) return res.status(400).json({
            status: "No files included."
        });
        var file = req.files.file;

        var ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : (mime.extension(file.mimetype) ? '.' + mime.extension(file.mimetype) : '');
        var name = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) /*.replace(new RegExp(`${ext}\.?${ext}$`), `.${ext}`)*/ ;

        var nameDate = name + '-' + Date.now();

        var sql = `SELECT * FROM 'UID' WHERE md5 = ?`;
        let exist = await app.db.query(sql, [file.md5]).catch(err => {
            next(createError(err));
        });
        if (exist) {
            let result = {
                status: "Found known entity in database.",
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

        file.mv(path.join(app.dirname, '../upload/', nameDate + ext), async function (err) {
            if (err) return next(createError(err));

            var uid = await app.generateUID();

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
            
            var sql = `INSERT INTO 'UID' ('UID', 'JSON', 'md5', 'owner') VALUES ?`;
            await app.db.query(sql, [uid, JSON.stringify(newUpload),  file.md5, req.trustedip]).catch(err => {
                next(createError(err));
            });

            let result = {
                status: "Entity created: Uploaded new file.",
                file: {
                    url: "https://go.tawan475.dev/" + uid + ext,
                    fullUrl: "https://go.tawan475.dev/" + uid + "/" + name + ext,
                    uid: uid,
                    filename: name + ext,
                    size: file.size
                }
            };
            return res.json(result);
        });
    });
}