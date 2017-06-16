var account_name = 'dev';
if (process.env.ACCOUNT_NAME) {
  account_name = process.env.ACCOUNT_NAME;
}

if (!process.env.NEXMO_API_KEY || !process.env.NEXMO_API_SECRET) {
  throw new Error("You must define NEXMO_API_KEY and NEXMO_API_SECRET");
}

var AWS = require("aws-sdk");
var cw = new AWS.CloudWatch({ region: 'us-west-2' });
var https = require("https");

var checkBalance = (cb) => {
  var req = https.request({
    hostname: "rest.nexmo.com",
    path: "/account/get-balance/" + process.env.NEXMO_API_KEY + "/" + process.env.NEXMO_API_SECRET,
    headers: {
      "Accept": "application/json"
    }
  }).on("response", (res) => {
    var data = "";
    res.setEncoding('utf8');
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      var json;

      try {
        json = JSON.parse(data);
      } catch (ex) {
        return cb(ex);
      }

      cb(null, json);
    });
  }).on("error", (err) => {
    cb(err);
  });
  req.end();
};

module.exports.handler = (event, context, callback) => {
  checkBalance((err, balance) => {
    if (err) {
      return callback(err);
    }

    var params = {
      MetricData: [{
        Dimensions: [{
          Name: "Account",
          Value: account_name
        }],
        MetricName: "Balance (Euros)",
        Timestamp: new Date(),
        Unit: "None",
        Value: balance.value
      }],
      Namespace: "Nexmo"
    };

    cw.putMetricData(params, (err, data) => {
      if (err) {
        return callback(err);
      }

      callback(null, balance);
    });
  });
};

if (require.main == module) {
  module.exports.handler(null, null, (err, balance) => {
    console.log("Account: ", account_name);
    console.log("Error: ", err);
    console.log("Balance: ", balance);
  });
}
