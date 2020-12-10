var admin = require("firebase-admin");

var serviceAccount = require("./instamarkt-1592284680809-firebase-adminsdk-z8gp7-c823b86d8c.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://instamarkt-1592284680809.firebaseio.com"
  });


  const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  const notification = ()=>{
    const  registrationToken = req.body.registrationToken
    const message = req.body.message
    const options =  notification_options
    
      admin.messaging().sendToDevice(registrationToken, message, options)
      .then( response => {

       res.status(200).send("Notification sent successfully")
       
      })
      .catch( error => {
          console.log(error);
      });
  }