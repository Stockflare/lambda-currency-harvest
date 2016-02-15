// dependencies
var aws = require('aws-sdk');
var _ = require('underscore');
var path = require('path');
var when = require('when');
var moment = require('moment');
var rest = require('restler');

exports.handler = function(event, context) {

  console.log('event');
  console.log(event);

  rest.get(event.fx_url).on('success', function(fx_result, response) {
    console.log(fx_result);

    // Do a post to api-currency fo every currency
    promises = _.map(_.keys(fx_result), function(key, index, currencies){
      return when.promise(function(resolve, reject, notify){
        rest.post(event.currency_url, {
          data: {
            from: key,
            to: 'usd',
            rate: 1.0 / fx_result[key],
            updated_at: Math.floor(new Date().getTime() / 1000)
          }
        }).on('success', function(currency_result, response){
          resolve(fx_result[key]);
        }).on('fail', function(data, response){
          console.log('Error:', data);
          reject(data);
        });
      });
    });

    when.all(promises).done(function(){
      context.succeed("Successfully harvested currencies");
    }, function(reason){
      context.fail("Failed to post to api-currency: " + reason);
    });

  }).on('fail', function(data, response){
    console.log('Error:', data);
    context.fail("Failed to process fx call");
  });

};
