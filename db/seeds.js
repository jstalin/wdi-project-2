const mongoose   = require("mongoose");
const Bluebird   = require("bluebird");
mongoose.Promise = Bluebird;
const rp         = require("request-promise");
const config     = require("../config/config");
const Restaurant = require("../models/restaurant");

// Building the query
const q          = encodeURIComponent("vegan");
const lat        = 51.5287336;
const lng        = -0.3824771;
const radius     = 20000;
const count      = 100;
let start        = 0;
let uri          = `https://developers.zomato.com/api/v2.1/search?q=${q}&count=${count}&lat=${lat}&lon=${lng}&radius=${radius}&start=${start}`;

mongoose.connect(config.db);

// Clear the restaurants from the database
Restaurant.collection.drop();

function getRestaurants(uri){
let options = {
  uri: uri,
  headers: {
    "user-key": process.env.ZOMATO_API_KEY
  }
};

// Making a request with Request Promise
return rp(options)
  .then(data => {
    // Parse the data (which comes back as a string)
    let json = JSON.parse(data);
    if (json.restaurants.length === 0) return;

    // A way of "collecting" promises in an array and waiting until they are all furfilled
    return Bluebird.map(json.restaurants, (result) => {
      let restaurantData      = {};
      restaurantData.name     = result.restaurant.name;
      restaurantData.url      = result.restaurant.url;

      if (result.restaurant.location) {
        restaurantData.lat   = result.restaurant.location.latitude;
        restaurantData.lng   = result.restaurant.location.longitude;
        restaurantData.address  = result.restaurant.location.address;
      }

      restaurantData.image = result.restaurant.thumb;

      // Returns a promise
      return Restaurant.create(restaurantData);
    });
  })
  .then((data) => {
    if (!data) return process.exit();

    // Let us know what we did
    data.forEach(restaurant => console.log(`${restaurant.name} was saved: %o`, restaurant));
    data.forEach(restaurant => Restaurant.create(restaurant));

    // Make a new request increasing the starting number that we look from
    start += 20;
    let uri = `https://developers.zomato.com/api/v2.1/search?q=${q}&count=${count}&lat=${lat}&lng=${lng}&radius=${radius}&start=${start}`;

    // Recusively call the function getRestaurants
    return getRestaurants(uri);
  })
  .catch(console.error);
}

getRestaurants(uri);
