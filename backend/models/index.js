// Central export for all Mongoose models
const Customer = require('./Customer');
const Vehicle = require('./Vehicle');
const Material = require('./Material');
const Driver = require('./Driver');
const Weighment = require('./Weighment');

module.exports = { Customer, Vehicle, Material, Driver, Weighment };
