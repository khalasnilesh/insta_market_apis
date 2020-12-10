var port = 8880;

var properties = {
    port: port,
    pg_connection_string: process.env.DATABASE_URL || "postgres://sfez_rw:sfez@localhost:5432/sfezdb",
    secret: "CorrectHorseBatteryStaple",
    apiVersion: "v1",
    moltinAuthUrl: "https://api.moltin.com/oauth/access_token",
    moltinStoreUrl: "https://api.moltin.com/v2",
    clientId: process.env.CLIENT_ID || "eDlPjoMabiu84tszlmr9gcpgm1YJXOJoSZxCBooYuW",
    client_secret: process.env.CLIENT_SECRET || "hqvxfSwzIz9RP3nTLP3SbDZUUDDpfMteRJtfm3rOv3",
    grant_type: "client_credentials",
    olddefaultTaxBand: process.env.TAXBAND || "1278235843793780901", // Brazil ICMS
    defaultTaxBand: process.env.TAXBAND || "1554615357396746864",
    deliveryCharge: "10",
    deliveryOffset: 15,
    granuo : {
      token : '6db0c521-20b5-40d7-b02f-25c6b2d06450',
      urls : {
        registerUser : 'https://api.granuo.com.br/api/cadastroUsuario',
        getRecharge : 'https://api.granuo.com.br/api/recargasUsuario?id=',
        debit: 'https://api.granuo.com.br/api/debitarRecarga',
        recharge: 'https://api.granuo.com.br/api/insereRecargaQRCode',
        redeemRecharge : 'https://api.granuo.com.br/api/resgatarRecarga',
        registerEstablishment : 'https://api.granuo.com.br/api/cadastroEstabelecimento'
      }
    },
    sumup:{
        clientId:"com.sumup.apisampleapp",
        client_secret:"6332ad54-eb47-4b41-8390-074f062da085",
        sumupAuthUrl:"https://api.sumup.com/oauth",
        sumupUrl:"https://api.sumup.com"
    },
    squareAuthUrl:"https://connect.squareup.com/oauth2/token",
    square: {
        apiAddress:"https://connect.squareup.com/",
        locationsUrl: "https://connect.squareup.com/v2/locations",
        clientId:"sq0idp-Y2wa0NUE74KRqxLr2VBMaA",
        clientSecret:"sq0csp-vVijIaxOAGPUC1LluWNOUN_cQB4aLh9dIyzQcauNfbk",
        redirectUrl:"https://www.streetfoodez.com/pb/"
    },
    application_bundle : "com.streetfoodez.sfez",
    fcmServerKey: process.env.fcmServerKey || "AAAAAcAl7Vw:APA91bGzGfWSgV7NE5pOzcbZ4aGH6cH6k41WKuq3oSKZdC4BI4bkgn34tWiF0blBnCv_yaKjlTaghy1Y4XiUmcjV0c0_lO2vqkzL9Ijo-yb_xxYp_NGCDpzdKHR4o5zKJGVCESzJldWU",
    gcmServerKey: process.env.fcmServerKey || "AAAAAcAl7Vw:APA91bGzGfWSgV7NE5pOzcbZ4aGH6cH6k41WKuq3oSKZdC4BI4bkgn34tWiF0blBnCv_yaKjlTaghy1Y4XiUmcjV0c0_lO2vqkzL9Ijo-yb_xxYp_NGCDpzdKHR4o5zKJGVCESzJldWU",
    oldGcmServerKey: process.env.gcmServerKey || "AIzaSyBHjuQ6j05yKC-BYJa6C2ER9-JfNEaPvYI",
    oldFcmServerKey: process.env.gcmServerKey || "AIzaSyBHjuQ6j05yKC-BYJa6C2ER9-JfNEaPvYI",
    facebook_api_key: "1401488693436528",
    FACEBOOK_CLIENT_ID: "1580240262270648",
    FACEBOOK_CLIENT_SECRET: "9262a21aa421194191a90298af79e509",
    facebook_app_id: "1580240262270648",
    facebook_app_secret: "9262a21aa421194191a90298af79e509",
    GOOGLE_CLIENT_ID : "7518678364-1v7mknvd5j8bjffqgkcd9h019gm9narn.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "IYo6MWb6Ci0BK9IBEOx25U-7",
    payStand : {
      client_id : '083d190f7be41776fd4ad560ae61ec7d',
      client_secret : '128c43a5fef520fd0f46e9f26e936ee018a5fe79',
      customer_id:'6qy7lbmowxvpkr0xap7snbai'
    }
};

properties.squareRenewUrl = properties.square.apiAddress + "/oauth2/clients/" + properties.square.clientId + "/access-token/renew";
properties.square.orderUrl = function (locationId) {
    return properties.square.apiAddress + "v2/locations/" + locationId + "/orders/batch-retrieve"
};

module.exports = properties;


