require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const { model, Schema } = mongoose;
const bodyParser = require("body-parser");
const dns = require('dns');
const { isNull } = require("util");
const connection_url =
	"mongodb+srv://user:cTMOUMhPi7EyIoZE@cluster0.3q5a84c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const cn = mongoose.connect(connection_url);

const urlSchema = new Schema({
	original_url: { type: String, required: true },
	short_url: { type: Number, required: true }
});

const urlModel = model("urls", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async function (req, res) {
	const url = req.body.url;
	/// check the url
	try {
		new URL(url);
	} catch (error) {
		return res.json({
			"error": "invalid url",
		});
	}
	// http
	try {
		let urlValidated = new URL(url);
		if (
			!(urlValidated.protocol === "http:") &&
			!(urlValidated.protocol === "https:")
		) {
			throw 'error'
		}
	} catch (error) {
		return res.json({
			"error": "invalid url",
		});
	}

	//  DNS checkup
	try {
		let results = await dns.lookup(url, e => ({}))
	} catch (e) {
		return res.json({
			error: 'Invalid Hostname'
		})
	}

	// dbs stuffs 
	try {
		let data = await urlModel.findOne({
			original_url: url
		})
		if (isNull(data)) {
			const count = await urlModel.countDocuments();
			const createData = await urlModel.create({ original_url: url, short_url: count + 1 })
			res.json({
				original_url: createData.original_url,
				short_url: createData.short_url
			})
		} else {
			res.json({
				original_url: data.original_url,
				short_url: data.short_url
			})
		}
	} catch (e) {
		console.log(e)
	}

});

app.get('/api/shorturl/:id', async function (req, res) {
	let id = parseFloat(req.params.id);
	if (isNaN(id)) {
		res.json({
			"error": "Wrong format"
		})
	}
	else {
		const result = await urlModel.findOne({ short_url: id });
		if (result) {
			res.redirect(result.original_url)
		} else {
			res.json(
				{ "error": "No short URL found for the given input" }
			)
		}
	}
})

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
