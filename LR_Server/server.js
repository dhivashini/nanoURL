var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var redis = require('redis');
var requestIp = require('request-ip');
var parser = require('ua-parser-js');
var satelize = require('satelize');
var aws = require('aws-sdk');
var mysql = require('mysql');

var queueUrl = "https://sqs.us-west-2.amazonaws.com/060340690398/Team8_LR_TS_Q";

aws.config.loadFromPath(__dirname + '/config.json');

var client = redis.createClient(6379, "team8-lr-redis.8pcr77.0001.usw2.cache.amazonaws.com", {no_ready_check: true});

var connection = mysql.createConnection({
	host     : "team8.csbd8ml2tbxl.us-west-2.rds.amazonaws.com",
	user     : "Team8",
	password : "Team8nano",
	port      : '3306'
});

/*client.on('connect', function() {
        console.log('redis connected');
        client.set('qwertyui', 'https://bitlycmpe281.slack.com/messages/@mayuri.sapre/');
        client.set('asdfghjk', 'https://bitlycmpe281.slack.com/messages/@sagar.bhoite/');
});*/

app.use(bodyParser.json());
var sqs = new aws.SQS();

function getLongURL(shortenURL, callback) {
    connection.query('SELECT longurl FROM MainDb.URLManager WHERE shorturl=?', [shortenURL], function(err, result) {
        if (err) {
            callback(err,null);
		} else {
            callback(null,result[0].longurl);
		}
    });

}

app.get('\/[a-zA-Z0-9]{8}$/', function redirect(req,res) {
        var shortenURL = req.url.substring(1);
        console.log('shortURL: '+shortenURL);

        var clientIp = requestIp.getClientIp(req);
        console.log('clientIp: '+clientIp);

        var ua = parser(req.headers['user-agent']);
        var clientBrowser = ua.browser.name;
        console.log('browser: '+ua.browser.name+' '+ua.browser.version);
        var clientOS = ua.os.name;
        console.log('os: '+ua.os.name+' '+ua.os.version);
        var clientDevice = ua.device.vendor+' '+ua.device.model;
        var clientDeviceType = ua.device.type;
        console.log('device: '+ua.device.vendor+' '+ua.device.model);
        console.log('deviceType: '+ua.device.type);


        var clientCountry = "";
        satelize.satelize({ip:clientIp}, function(err, payload) {
                //console.log('continent: '+payload.continent.en);
                clientCountry = payload.country.en;
                console.log('country: '+payload.country.en);
        });

        var longURL = '';
        client.get(shortenURL, function(err, reply) {
                // reply is null when the key is missing
				
				if(reply == -1){
					getLongURL(shortenURL, function(err, data){
						longURL = data;
					});
				} else {
					longURL = reply;
				}
                console.log("longURL: "+longURL);
				
				var messageBody = {
					shortURL: shortenURL,
					longURL: longURL,
					clientIP: clientIp,
					clientBrowser: clientBrowser,
					clientOS: clientOS,
					clientDevice: clientDevice,
					clientDeviceType: clientDeviceType,
					clientCountry: clientCountry
				};
				//Code to send req.body and randomstring to SQS
				//send shorten url to 
				var params = {
					MessageBody: JSON.stringify(messageBody),
					QueueUrl: queueUrl,
					DelaySeconds: 0
				};

				sqs.sendMessage(params, function(err, data) {
					if(err) {
						res.send(err);
					} else {
						res.send(data);
					}
				});

                /*request.post({
                        url: 'http://ec2-52-91-18-152.compute-1.amazonaws.com:5000/analyticsData',
                        headers: {
                                'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                                "shortURL": shortenURL,
                                "longURL": longURL,
                                "clientIP": clientIp,
                                "clientBrowser": clientBrowser,
                                "clientOS": clientOS,
                                "clientDevice": clientDevice,
                                "clientDeviceType": clientDeviceType,
                                "clientCountry": clientCountry
                        })
                }, function(error, response, body){
                        if(error) {
                                console.log('Error happened: '+ error);
                        } else if(response.statusCode == 200) {
                                res.send(body);
                        } else {
                                console.log("statusCode != 200");
                        }
                });*/

                res.writeHead(302, {
                    'location': longURL
                });
                res.end();
        });
});

app.get('/null', function noURLFound(req,res) {
	res.send("Requested URL does not exist");
});

app.get('/\/[^a-zA-Z\d\s:]/', function wrongURL(req,res) {
	res.send("Requested URL is incorrect");
});

app.listen(process.env.PORT || 5000);
console.log("Server running on port 5000");
