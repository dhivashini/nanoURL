var express  = require('express'),
	sqsdHandler = require('sqsd-handler');
var app      = express();
var aws      = require('aws-sdk');
var queueUri = 'https://sqs.us-west-2.amazonaws.com/060340690398/Team8_Db_Worker';

var mysql      = require('mysql');
var redis = require("redis");

 var server = app.listen(process.env.PORT || 3000, function () {
     var host = server.address().address;
         var port = server.address().port;

             console.log('AWS SQS example app listening at http://%s:%s', host, port);
             });

	
var connection = mysql.createConnection({
  host     : "team8.csbd8ml2tbxl.us-west-2.rds.amazonaws.com",
  user     : "Team8",
  password : "Team8nano",
 port      : '3306'
});

client = redis.createClient(6379, 'team8-lr-redis.8pcr77.0001.usw2.cache.amazonaws.com', {no_ready_check: true});

aws.config.loadFromPath(__dirname + '/config.json');



var handler = sqsdHandler.create(function (msg){
connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... \n\n");
} else {
    console.log("Error connecting database ... \n\n");
}
});

	
	var insertObjt = {shorturl:msg.payload.shortURL, longurl:msg.payload.longURL, nooftimesaccessed:1};
	console.log(insertObjt);

		var query = connection.query('INSERT INTO MainDb.URLManager SET ?', insertObjt, function(err,res){
						  if(err) throw err;
							console.log("Success");
							connection.end();
		});
		console.log(query.sql);
		
		client.on("error", function (err) {
			console.log("Error " + err);
		});
		
		client.set(msg.payload.shortURL, msg.payload.longURL);

		
});
app.use("/data",handler);