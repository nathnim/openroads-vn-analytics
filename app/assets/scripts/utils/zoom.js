'use strict';

// Leaflet inspired implementation of extracting a midpoint and zoom level from a set of bounds //
var globMerc = require('global-mercator');
/**
 * transformation object neccessary for mercator to pixel conversion
 * calculations and params are thanks to the below
 * https://github.com/Leaflet/Leaflet/blob/703ae02aa8cbd0b87be5b01e77754b83ad732267/src/geo/crs/CRS.EPSG3395.js
 */
exports.mercatorTransformation = {
  a: 2.495320233665337e-8,
  b: 0.5,
  c: -2.495320233665337e-8,
  d: 0.5
};

/**
 * calculates tranformed pixel point from coordinate point
 * @param {object} geoCoordinate A geographic coordinate
 * @param {number} zoom current map zoom
 * @return {object} tranformed pixel coordinate
 */
exports.transformGeoToPixel = function (geoCoordinate, zoom) {
  var meterCrds = globMerc.lngLatToMeters([geoCoordinate.lng, geoCoordinate.lat]);
  var pixelCrd = globMerc.metersToPixels(meterCrds, zoom);
  return {
    x: pixelCrd[0],
    y: pixelCrd[1]
  };
};

/**
 * generates object with pixel reprentation of distances between bounds' latitude and longitude extrema
 * @param {object} nwPixel northwest bounds coordinate as pixel coordinate
 * @param {object} sePixel southeastbounds coordinate as pixel coordinate
 * @return {object} object with pixel distances
 */
exports.pixelDistances = function (nwPixel, sePixel) {
  return {
    x: Math.abs(nwPixel.x - sePixel.x),
    y: Math.abs(nwPixel.y - sePixel.y)
  };
};

/**
 * @param {object} distances object with bounds distances represented pixels
 * @return {number} factor used to generate new zoom
 */
exports.newZoomScale = function (distances) {
  // hardcoded for testing, will use iframe
  var dimensions = {x: 1000, y: 800};
  return Math.min(dimensions.x / distances.x, dimensions.y / distances. y);
};

/**
 * returns max zoom for showing extent of the bounding box provided
 * @param {number} scale the scale factor used to calcualte the new zoom
 * @param {number} zoom the map's current zoom
 * @return {number} new zoom for bounds
 */
exports.makeNewZoom = function (scale, zoom) {
  // the high level calculation for new zoom comes from:
  // https://github.com/Leaflet/Leaflet/blob/703ae02aa8cbd0b87be5b01e77754b83ad732267/src/geo/crs/CRS.js#L65
  // the high level calculation's components come from
  // https://github.com/Leaflet/Leaflet/blob/703ae02aa8cbd0b87be5b01e77754b83ad732267/src/map/Map.js#L893
  var scaledZoom = 256 * Math.pow(2, zoom);
  var scaledScaledZoom = scale * scaledZoom;
  var newZoom = Math.log(scaledScaledZoom / 256) / Math.LN2;
  // the maximum possible zoom is 24.
  return newZoom > 24 ? 24 : newZoom;
};

/**
 * returns lng/lat midpoint of bbox
 * @param {array} bounds array represntation of lat/lng bounding box
 * @return {object} object representation of bounds midpoint
 */
exports.makeCenterpoint = function (bounds) {
  return {
    x: (bounds[0] + bounds[2]) / 2,
    y: (bounds[1] + bounds[3]) / 2
  };
};

/**
 * @param {array} bounds array representation of lat/lng bounding box
 * @return {object} object representation of bounds' nw and se points
 */
exports.makeNWSE = function (bounds) {
  return {
    nw: {lng: bounds[0], lat: bounds[1]},
    se: {lng: bounds[2], lat: bounds[3]}
  };
};
