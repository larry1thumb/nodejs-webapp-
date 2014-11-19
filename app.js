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
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

app.get('/', function(request, response) {
  response.set('Content-Type', 'text/html');
  response.send('<p>Hey, it works!</p>');
});

app.post('/sendLocation', function(request, response) {
	var data = '';
	var login = request.body.login;
	var lat = parseFloat(request.body.lat);
	var lng = parseFloat(request.body.lng);
	var d = new Date();
	var toInsert = {
		"login": login,
		"lat": lat,
		"lng": lng,
		"created_at": d,
	};
		
	db.collection('locations', function(error1, collection) {
		var id = collection.insert(toInsert, function(error2, saved) {
			if (error2) 
			{
				response.send(500);
			}
			else 
			{
				collection.find().toArray(function(error3, cursor) {
					if (!error3) 
					{
						data = collection.find().sort({ created_at: -1 });
						var json = JSON.stringify(data);
						response.send(json);
					}
				});
			}
		});
	}); 
});

app.get('/locations.json', function(request, response) {
	response.setHeader('Content-Type', 'application/json');
	var login = request.query.login;
	var data = '';
	var json = '';
	db.collection('locations', function(error1, collection) {
		collection.find().toArray(function(error2, cursor) {
			if (!error2) {
			data = collection.find({'login':login}).sort( {created_at: -1});
			json = JSON.stringify(data);
			response.send(json);
			}
		});
	});
});

app.get('/redline.json', function(request, response) {
	response.setHeader('Content-Type', 'application/json');
	var http = require('http');
	var options = {
		host: 'developer.mbta.com',
		port: 80,
		path: '/lib/rthr/red.json'	
	};

	http.get(options, function(apiresponse) {
		var data = '';
		apiresponse.on('data', function(chunk) {
			data += chunk;
		});
		apiresponse.on('end', function() {
			response.send(data);
		});
	}).on('error', function(error) {
		response.send(500);
	});
});

app.listen(process.env.PORT || 3000);