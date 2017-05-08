const cfenv = require('cfenv');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.text());
///////////why app.use bodyparser.json() not in
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
//////////////////////////////////////////////
const Cloudant = require('cloudant');

// Emulating VCAP_VARIABLES if running in local mode
try { require("./vcap-local"); } catch (e) {}
var appEnv = cfenv.getAppEnv();



// AppMetrics monitoring instrumentation
require('appmetrics-dash').attach();

// Cloudant instrumentation
var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
var cloudantDb = cloudant.db.use("mydb");

// Swagger instrumentation
app.use("/swagger/api", express.static("./public/swagger.yaml"));
app.use("/explorer", express.static("./public/swagger-ui"));

// Business logic
app.get("/todoitems", function(req, res, next){
	var todoitems = [];
	cloudantDb.list({ include_docs: true },function(err, body) {
		if(!err) {
			body.rows.forEach(function(row) {
				todoitems.push(row.doc.todo)
			})
			res.json(todoitems);
		}
	})
	/*
	Put your business logic here, e.g.
	cloudantDb.list(function(err, body){
		if (!err){
			body.rows.forEach(function(doc){
				console.log(doc);
			});
		}
	});
	*/
});
/* post an item to the DB
* {
* 	"todo":"do dishes"
* }
*/
app.post("/todoitems", function(req, res, next){
	var todoItem = req.body.todo;
	cloudantDb.insert({"todo":todoItem}, function(err, body, header) {
		if (err) {
			return console.log("error", err.message)
		}
		res.send("item added")
	})
	// Put your business logic here
	//res.json();
});

app.get("/todoitem/:id", function(req, res, next){
	// Put your business logic here
	res.json();
});

app.put("/todoitem/:id", function(req, res, next){
	// Put your business logic here
	res.json();
});

// app.delete("/todoitem/:id", function(req, res, next){
// 	db.get()
// });


// Starting the server
const port = 'PORT' in process.env ? process.env.PORT : 8080;
app.listen(port, function () {
	const address = (this.address().address === '::') ? 'localhost' : this.address().address;
	const port = this.address().port;
	console.log(`Example app listening on ${address}:${port}`)
	console.log(`OpenAPI (Swagger) spec is available at ${address}:${port}/swagger/api`)
	console.log(`Swagger UI is available at ${address}:${port}/explorer`)
});