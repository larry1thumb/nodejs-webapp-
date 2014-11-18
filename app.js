//Initialization
var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI ||
			   process.env.MONGOHQ_URL ||
			   'mongodb://localhost/whereintheworld';
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	next();
});

app.get('/locations.json', function(request, response) {
	response.set('Content-Type', 'application/json');
	var login = request.query.login;
	var json = '';
	db.locations.find({'login':login}, function(err, cursor){
		if (err) {
			response.send('[]');
		}
		var json = cursor.toArray();
		response.send(json);
	});
});

app.post('/sendLocation', function(request, response) {
	var login = request.body.login;
	var lat = request.body.lat;
	var lng = request.body.lng;
	var d = new Date();
	var toInsert = {
		"login": login,
		"lat": lat,
		"lng": lng,
		"created_at": d,
	};
	console.log('prior to collection');
	db.collection('locations', function(error1, collection) {
		console.log(error1);
		var id = collection.insert(toInsert, function(error2, saved) {
			if (error2) {
				console.log(error2);
				response.send(500);
			}
			else {
				response.send(200);
			}
		});			
	});
});

app.listen(process.env.PORT || 3000);