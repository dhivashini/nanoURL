var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var nodemailer = require('nodemailer');
var http = require('http');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

app.post('/longURL', function (req, res) {

	request.post({
		url: 'http://cpserver.elasticbeanstalk.com/shorten',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"longURL": req.body.longURL,
			"customFlag" : req.body.customFlag,
			"customURL" : req.body.customURL.name
		})
	}, function(error, response, body){
		if(error) {
	        console.log('Error happened: '+ error);
	    } else if(response.statusCode == 200) {
	        res.send(body);
	    } else {
	    	console.log(body);
	    }
	});
});

app.get('/analytics', function (req, res) {

	request.post({
		url: 'http://ec2-52-32-215-254.us-west-2.compute.amazonaws.com:5000/getAnalyticsData',
		headers: {
			'Content-Type': 'application/json'
		}
	}, function(error, response, body){
		if(error) {
	        console.log('Error happened: '+ error);
	    } else if(response.statusCode == 200) {
	        res.send(body);
	    } else {
	    	console.log(body);
	    }
	});
});

app.post('/analyticsByURL', function (req, res) {

	request.post({
		url: 'http://ec2-52-32-215-254.us-west-2.compute.amazonaws.com:5000/getAnalyticsDataByURL',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"shortURL": req.body.shortURL
		})
	}, function(error, response, body){
		if(error) {
	        console.log('Error happened: '+ error);
	    } else if(response.statusCode == 200) {
	        res.send(body);
	    } else {
	    	console.log(body);
	    }
	});
});

app.post('/send', function(req, res){

	if(req.body.emailId == "") {
		res.send("Error: Email should not blank");
		return false;
	}

	var smtpTransport = nodemailer.createTransport("SMTP",{
		host: "smtp.gmail.com", // hostname
		secureConnection: true, // use SSL
		port: 465, // port for secure SMTP
		auth: {
			user: "nanourlt8@gmail.com",
			pass: "Nano@team8"
		}
	});
	var mailOptions = {
		from: "Nano URL Emailer ✔ <nanourlt8@gmail.com>",// sender address
		to: req.body.emailId, // list of receivers
		subject: "Success ✔ Your nano URL has been generated", // Subject line
		html: "<b>Thank you for using our service ☺</b><br/><br/><br/><b>Nano url:</b>"+req.body.shortURL+" <br/><br/><b>Your Long url:</b>"+req.body.longURL // html body
	}
	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error){
			res.send("Email could not sent due to error: "+error);
		}else{
			res.send("Email has been sent successfully");
		} 
	}); 
});                    

app.listen(process.env.PORT || 5000);
console.log("Server running on port 5000");
