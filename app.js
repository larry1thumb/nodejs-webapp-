//Initialization
var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI ||
			   process.env.MONGOHQ_URL ||
			   'mongodb://localhost/assignment3';
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function (error, databaseConnection) {
	db = databaseConnection;
});

app.use(function (req, res, next) {
  	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next();
});

app.get('/', function (request, response) {
  response.set('Content-Type', 'text/html');
  response.send('<p>Hey, it works!</p>');
});

app.post('/sendLocation', function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	response.setHeader("Content-Type", "application/json");
	var login = request.body.login;
	var lat = parseFloat(request.body.lat);
	var lng = parseFloat(request.body.lng);
	var d = new Date();
	if (login==undefined || lat==undefined || lng==undefined) {
		res.send(500);
	}

	var toInsert = {
		"login": login,
		"lat": lat,
		"lng": lng,
		"created_at": d,
	};
		
	db.collection('locations', function (error1, collection) {
		var id = collection.insert(toInsert, function(error2, saved) {
			if (error2) 
			{
				response.send(500);
			}
			else 
			{
				var json = '';
				collection.find().sort({ created_at: -1 });
				collection.find().toArray(function(error3, cursor) {
					if (!error3) 
					{
						json += "{\"characters\":[],\"students\":[";
						var number;
						if (cursor.length - 100 >= 0) {
							var temp = cursor.length - 100;
							number = cursor.length - temp;
						} else {
							number = cursor.length;
						}
						for (var i = number-1; i>=0; i--) {
							json += JSON.stringify(cursor[i]);
							if(i>0) {
								json += ",";
							}
							json += "]}";
						}

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
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
			response.setHeader("Content-Type", "application/json");
			response.send(data);
		});
	}).on('error', function(error) {
		response.send(500);
	});
});

app.listen(process.env.PORT || 3000);