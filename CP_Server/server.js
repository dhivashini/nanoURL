var express  = require('express'),
	bodyParser = require('body-parser'),
	request = require('request');
var app      = express();
var aws      = require('aws-sdk');
var queueUrl = "https://sqs.us-west-2.amazonaws.com/060340690398/Team8_Db_Worker";
var receipt  = "";
var mysql    = require('mysql');

aws.config.loadFromPath(__dirname + '/config.json');

app.use(bodyParser.json());

//Creating RDS connection
var connection = mysql.createConnection({
  host     : "team8.csbd8ml2tbxl.us-west-2.rds.amazonaws.com",
  user     : "Team8",
  password : "Team8nano",
 port      : '3306'
});
 connection.connect(function(err){
            if(!err) {
                console.log("Database is connected ... \n");
            } else {
                console.log("Error connecting database ... \n");
    }
});
var sqs = new aws.SQS();

function checkShortURL( shortURL, callback){
    connection.query('SELECT longurl from MainDb.URLManager where shorturl = ?', [shortURL], function(err,results){
            if(err) 
               throw err;
            console.log("Success");
          //  connection.end();         
            callback(null, results);
    });

}
app.post('/shorten', function shorten(req,res)
{
        var randomstring = "";

        console.log(req.body);
        console.log(req.body.longURL);

        if (!req.body.customFlag) {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var string_length = 8;
            for (var i=0; i<string_length; i++) {
                    var rnum = Math.floor(Math.random() * chars.length);
                    randomstring += chars.substring(rnum,rnum+1);
            }
            console.log("Inside shortening");
            console.log(randomstring);
            writeResponse(req,res,randomstring);
        }else{
            var customURLText = req.body.customURL; 
            
            checkShortURL(customURLText, function(err, results){
                    if(results.length === 0){
                            console.log("The requested short text does not exists in the database and can be used for the short url");
                            randomstring = customURLText;
                            console.log("randomstring ",randomstring);
                            writeResponse(req,res,randomstring);
                        }else{
                            console.log(results[0]);
                            res.writeHead(543, {'Content-Type': 'application/json'});
                            res.end();
                        }
            });

        }      
});

function writeResponse(req, res, randomstring){
      var shortURL = "http://nanourl.elasticbeanstalk.com/" + randomstring;

       var messageBody = {
           longURL : req.body.longURL,
           shortURL: randomstring   
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
        }
        else {
            //res.send(data);
        }
    });
    res.send(shortURL);
}
app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(process.env.PORT || 5000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
