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
	
var timeLastTxReceived;
client.cmd( "listtransactions", function( err, result ){ 
	if (err) return console.log(err);
	timeLastTxReceived = getLastTxTime( result );
});


function checkForNewStake() {
	var newStakes = [];

	client.cmd( "listtransactions", function( err, result ){ 
		if (err) return console.log(err);

		if ( getLastTxTime( result ) > timeLastTxReceived ) {
			for ( i = result.length - 1 ; i >= 0 ; i-- ){
				if ( result[i].generated === true && result[i].timereceived > timeLastTxReceived ) {
					newStakes.push( "Account: "+ result[i].account + " Staked: " + result[i].amount + " Time: " + result[i].time );
				}
			}
			mailOptions.text = String(newStakes);
			transporter.sendMail( mailOptions, function ( err, result ) {
				if (err) return console.log( err );
				console.log('Message sent: ' + result.response);
			});
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

setInterval( checkForNewStake(), 600 ); // Check every 10 min.
