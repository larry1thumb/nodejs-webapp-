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


app.post('/sendLocation', function(request, response) {
	response.setHeader("Content-Type", "application/json");
	var JSONstring = '{"characters":[],"students":[';
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
	db.collection('locations', function(error1, collection) {
		var id = collection.insert(toInsert, function(error2, saved) {
			if (error2) {
				response.send(500);
			}
			else {
				collection.find().sort({ created_at: -1 });
				collection.find().toArray(function(err, cursor){
					if (!err) {
						for (var count = 0; count < cursor.length; count++) {
							JSONstring += cursor[count];
						}
						JSONstring += "]}";
					}
				});
			}
		});
	});
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

app.get('/redline.json', function(request, response) {
	var http = require('http');
	var options = {
		host: 'http://developer.mbta.com',
		port: 80,
		path: '/lib/rthr/red.json'	
	};
	http.get(options, function(apiresponse) {
		var data = '';
		console.log("Got response:" + apiresponse.statusCode);
		apiresponse.on('data', function(chunk) {
			data += chunk;
		});
		apiresponse.on('end', function() {
			response.setHeader('Content-Type', 'application/json');
			response.send(data);
		});
	}).on('error', function(error) {
		console.log("Got error:" + error.message);
		response.send(500);
	});
});
app.listen(process.env.PORT || 3000);