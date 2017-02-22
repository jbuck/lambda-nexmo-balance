var account_name = 'dev';
if (process.env.ACCOUNT_NAME) {
  account_name = process.env.ACCOUNT_NAME;
}

if (!process.env.NEXMO_API_KEY || !process.env.NEXMO_API_SECRET) {
  throw new Error("You must define NEXMO_API_KEY and NEXMO_API_SECRET");
}

var AWS = require("aws-sdk");
var cw = new AWS.CloudWatch();
var Nexmo = require("nexmo");
var nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
});

module.exports.handler = (event, context, callback) => {
  nexmo.account.checkBalance((err, balance) => {
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
