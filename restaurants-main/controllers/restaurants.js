const Restaurant = require('../models/restaurant');

function restaurantIndex(req, res){
  Restaurant.find((err, restaurant) => {
    if (err) return res.status(500).send();
    return res.status(200).json({ restaurants: restaurants});
  });
}

module.exports = {
  index: restaurantIndex
};
