var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var aws = require( "aws-sdk" );
var Q = require( "q" );
var chalk = require( "chalk" );

var queueUrl = "https://sqs.us-west-2.amazonaws.com/060340690398/Team8_LR_TS_Q";

aws.config.loadFromPath(__dirname + '/config.json');

app.use(bodyParser.json());

/*
// Connection URL
var url = 'mongodb://localhost';

// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        removeData(db, function() {
                db.close();
        });
});

var removeData = function(db, callback) {
        db.collection('bitlyAnalyatics').deleteMany(
                { "clientBrowser": "Firefox 42.0" },
                function(err, results) {
                        console.log(results);
                        callback();
                }
        );
};
*/

// Create an instance of our SQS Client.
var sqs = new aws.SQS({
    
    accessKeyId: "AKIAIYPRTVQLUSRLEY5Q",
    secretAccessKey: "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",
    region: "us-east-1",

    // For every request in this demo, I'm going to be using the same QueueUrl; so,
    // rather than explicitly defining it on every request, I can set it here as the
    // default QueueUrl to be automatically appended to every request.
    params: {
        QueueUrl: queueUrl
    }
});

// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
// error / callback pattern and return Promises. Promises are good and make it easier to
// handle sequential asynchronous data.
var receiveMessage = Q.nbind( sqs.receiveMessage, sqs );
var deleteMessage = Q.nbind( sqs.deleteMessage, sqs );

// When pulling messages from Amazon SQS, we can open up a long-poll which will hold open
// until a message is available, for up to 20-seconds. If no message is returned in that
// time period, the request will end "successfully", but without any Messages. At that
// time, we'll want to re-open the long-poll request to listen for more messages. To
// kick off this cycle, we can create a self-executing function that starts to invoke
// itself, recursively.
(function pollQueueForMessages() {

    console.log( chalk.yellow( "Starting long-poll operation." ) );

    // Pull a message - we're going to keep the long-polling timeout short so as to
    // keep the demo a little bit more interesting.
    receiveMessage({
        WaitTimeSeconds: 3, // Enable long-polling (3-seconds).
        VisibilityTimeout: 10
    })
    .then(
        function handleMessageResolve( data ) {

            // If there are no message, throw an error so that we can bypass the
            // subsequent resolution handler that is expecting to have a message
            // delete confirmation.
            if ( ! data.Messages ) {

                throw(
                    workflowError(
                        "EmptyQueue",
                        new Error( "There are no messages to process." )
                    )
                );

            }

            // ---

            // TODO: Actually process the message in some way :P
            console.log(data)
			console.log(data.Messages[0].Body)
			
			var sqsMsgObj = JSON.parse(data.Messages[0].Body)
			console.log(sqsMsgObj.longURL)

			insertData(sqsMsgObj);

            // ---
            console.log( chalk.green( "Deleting:", data.Messages[ 0 ].MessageId ) );	

            // Now that we've processed the message, we need to tell SQS to delete the
            // message. Right now, the message is still in the queue, but it is marked
            // as "invisible". If we don't tell SQS to delete the message, SQS will
            // "re-queue" the message when the "VisibilityTimeout" expires such that it
            // can be handled by another receiver.
            return(
                deleteMessage({
                    ReceiptHandle: data.Messages[ 0 ].ReceiptHandle
                })
            );

        }
    )
    .then(
        function handleDeleteResolve( data ) {

            console.log( chalk.green( "Message Deleted!" ) );

        }
    )

    // Catch any error (or rejection) that took place during processing.
    .catch(
        function handleError( error ) {

            // The error could have occurred for both known (ex, business logic) and
            // unknown reasons (ex, HTTP error, AWS error). As such, we can treat these
            // errors differently based on their type (since I'm setting a custom type
            // for my business logic errors).
            switch ( error.type ) {
                case "EmptyQueue":
                    console.log( chalk.cyan( "Expected Error:", error.message ) );
                break;
                default:
                    console.log( chalk.red( "Unexpected Error:", error.message ) );
                break;
            }

        }
    )

    // When the promise chain completes, either in success of in error, let's kick the
    // long-poll operation back up and look for moar messages.
    .finally( pollQueueForMessages );

})();

// When processing the SQS message, we will use errors to help control the flow of the
// resolution and rejection. We can then use the error "type" to determine how to
// process the error object.
function workflowError( type, error ) {

    error.type = type;

    return( error );

}

// Connection URL
var url = 'mongodb://localhost';
var dbCon;
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to server");
		dbCon = db;

});

//app.post('/analyticsData', function shorten(req,res) {
function insertData(jsonData) {

                /*insertDocument(db, function() {
                        getBitlyAnalyatics(db, function() {
                                db.close();
                        });
                });*/

       // var insertDocument = function(db, callback) {
                dbCon.collection('bitlyAnalyatics').insertOne( {
                        "shortURL" : jsonData.shortURL,
                        "longURL" : jsonData.longURL,
                        "clientIP" : jsonData.clientIP,
                        "clientBrowser" : jsonData.clientBrowser,
                        "clientOS" : jsonData.clientOS,
                        "clientDevice" : jsonData.clientDevice,
                        "clientDeviceType" : jsonData.clientDeviceType,
                        "clientCountry": jsonData.clientCountry
                }, function(err, result) {
                        assert.equal(err, null);
                        console.log("Inserted a document into the bitlyAnalyatics collection.");
                        //callback(result);
                });
       // };

        //var getBitlyAnalyatics = function(db, callback) {
                var cursor = dbCon.collection('bitlyAnalyatics').find( );
                cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                                console.dir(doc);
                        } else {
                                //callback();
                        }
                });
       // };
//});
}

app.post('/getAnalyticsData', function shorten(req,res) {

        // Connection URL
        var url = 'mongodb://localhost';

        // Use connect method to connect to the Server
        MongoClient.connect(url, function(err, db) {
                assert.equal(null, err);
                console.log("Connected correctly to server");

                getBitlyAnalyatics(db, function() {
                        db.close();
                });
        });

        /*var getBitlyAnalyatics = function(db, callback) {
                // Get the documents collection
                var collection = db.collection('bitlyAnalyatics');
                collection.find().toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                res.send(result);
                        } else {
                                console.log('No document(s) found');
                        }
                });
        };*/

        var getBitlyAnalyatics = function(db, callback) {
                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $group: { "_id": "$shortURL", "shortURL":{ "$first":"$shortURL"}, "longURL": { "$first": "$longURL" }, "count": { $sum: 1 } } }
                        ]
                ).toArray(function(err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                res.send(result);
                        } else {
                                console.log('No document(s) found');
                        }

                        /*assert.equal(err, null);
                        console.log(result);
                        callback(result);*/
                });
        };
});

app.post('/getAnalyticsDataByURL', function shorten(req,res) {

        // Connection URL
        var url = 'mongodb://localhost';

        // Use connect method to connect to the Server
        MongoClient.connect(url, function(err, db) {
                assert.equal(null, err);
                console.log("Connected correctly to server");

                getBitlyAnalyaticsByURL(db, function() {
                        db.close();
                });
        });

        var getBitlyAnalyaticsByURL = function(db, callback) {
                // Get the documents collection
                var resultArr = [];
                var collection = db.collection('bitlyAnalyatics');
                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientBrowser", "clientBrowser":{ "$first":"$clientBrowser"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }


                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientCountry", "clientCountry":{ "$first":"$clientCountry"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }


                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientDevice", "clientDevice":{ "$first":"$clientDevice"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }


                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientDeviceType", "clientDeviceType":{ "$first":"$clientDeviceType"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }


                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientIP", "clientIP":{ "$first":"$clientIP"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }


                db.collection('bitlyAnalyatics').aggregate(
                        [
                                { $match: { "shortURL": req.body.shortURL } },
                                { $group: { "_id": "$clientOS", "clientOS":{ "$first":"$clientOS"}, "count": { $sum: 1 } } }
                        ]
                ).toArray(function (err, result) {
                        if (err) {
                                console.log(err);
                        } else if (result.length) {
                                resultArr.push(result);
                        } else {
                                console.log('No document(s) found');
                        }
                        res.send(resultArr);
                });});});});});});
        };
});

app.listen(process.env.PORT || 5001);
console.log("Server running on port 5000");
