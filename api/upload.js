const createError = require('http-errors');
const fileUpload = require('express-fileupload');
const mime = require('mime-types');

module.exports = (app, router, path) => {
    app.use(fileUpload({
        limits: { fileSize: 150 * 1024 * 1024 },
        safeFileNames: true,
        preserveExtension: 16,
        abortOnLimit: true,
        useTempFiles: true,
        tempFileDir: path.join(app.dirname, '../upload/temp/')
    }));

    router.get(path, (req, res, next) => {
        next(createError(405));
    });

    router.post(path, async (req, res) => {
		if (!req.files) return res.status(400).json({
			status: "No files included."
		});
		var file = req.files.file;

		var ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : (mime.extension(file.mimetype) ? '.' + mime.extension(file.mimetype) : '');
		var name = (file.name.substring(0, file.name.lastIndexOf('.')) || file.name) /*.replace(new RegExp(`${ext}\.?${ext}$`), `.${ext}`)*/ ;

		var nameDate = name + '-' + Date.now();
		var exist = await app.db.find('uid', 'md5', file.md5);
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

		file.mv("./Storage/uploads/" + nameDate + ext, async function (err) {
			if (err) return res.status(500).json({
				status: "Sever side error, It will be fixed soon."
			});

			var uid = await app.genUID();

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

			await app.db.set("uid", uid, newUpload);
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
