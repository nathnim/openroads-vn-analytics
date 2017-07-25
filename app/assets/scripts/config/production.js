'use strict';
var logo = require('./logo');
/*
 * App config for production.
 */
module.exports = {
  environment: 'production',
  consoleMessage: logo,
  api: 'http://openroads-vn-api.herokuapp.com',
  mbToken: 'pk.eyJ1Ijoib3BlbnJvYWRzIiwiYSI6InJ0aUQ2N3MifQ.R3hdFqriZr6kEUr-j_FYpg',
  editorUrl: '//orma.github.io/openroads-vn-iD/',
  roadNetTileLayerUrl: 'http://50.16.162.86/dashboard/{z}/{x}/{y}.png',
  provinceDumpBaseUrl: 'https://s3.amazonaws.com/openroads-vn-dumps/by-province-name/'
};
