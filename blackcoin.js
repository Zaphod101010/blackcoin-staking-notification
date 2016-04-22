var blackcoin = require( "node-blackcoin" );
var nodemailer = require("nodemailer");

var client = new blackcoin.Client({
	host: 'localhost',
	port: 8332,
	user: '',  // RPC User
	pass: ''   // RPC Pass
});

var smtpConfig = {
    host: 'smtp.gmail.com',  // SMTP Server
    port: 465,
    secure: true, // use SSL
    auth: {
        user: '',  // SMTP User
        pass: ''   // SMTP Pass
    }
};
var transporter = nodemailer.createTransport(smtpConfig);
var mailOptions = {
	from: '" 👥" <sender@domain.com>', // sender 
	to: "", 						   // receiver
	subject: "New Stakes",
	}; 

// Record time of last TX	
var timeLastTxReceived;
client.cmd( "listtransactions", function( err, result ){ 
	if (err) return console.log(err);
	timeLastTxReceived = getLastTxTime( result );
	console.log( "Connected to blackcoind!  " + new Date() );
});


function checkForNewStake() {
	console.log( "Checking for new stakes..." + new Date() );
	var newStakes = [];
	// get last 10 txns
	client.cmd( "listtransactions", function( err, result ){ 
		if (err) return console.log(err);
		// Check for any new txns since the last time it was checked
		if ( getLastTxTime( result ) > timeLastTxReceived ) {
			for ( i = result.length - 1 ; i >= 0 ; i-- ){
				// Txns that are 'generated' are staked
				if ( result[i].generated === true && result[i].timereceived > timeLastTxReceived ) {
					var timeStamp = new Date(result[i].time * 1000);
					newStakes.push( "Account: "+ result[i].account + " Staked: " + result[i].amount + " Time: " + timeStamp + ".  " );
				}
			}
			console.log(newStakes.length + "New stakes!");
			// Set the body of the email to be sent
			mailOptions.text = String(newStakes);
			// Send email
			transporter.sendMail( mailOptions, function ( err, result ) {
				if (err) return console.log( err );
				console.log('Message sent: ' + result.response);
			});
			// Record time of last txn
			timeLastTxReceived = getLastTxTime( result );		
		} else {
			console.log( "no new stakes." );
		}
	});
}

function getLastTxTime( txArray ) {
	if (typeof( txArray ) === "undefined") {
		console.log( "Transaction Array is Empty." );
	}else{
		return txArray[txArray.length - 1].timereceived;
	}
}

setInterval( checkForNewStake, 600000 ); // Check every 10 min.
