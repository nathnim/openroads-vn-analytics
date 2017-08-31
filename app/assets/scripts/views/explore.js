'use strict';

import React from 'react';
import { connect } from 'react-redux';
import mapboxgl from 'mapbox-gl';

import config from '../config';
import lineColors from '../utils/line-colors';
import {
  selectExploreMapLayer,
  exploreMapShowNoVpromms,
  setGlobalZoom
} from '../actions/action-creators';
import MapOptions from '../components/map-options';
import MapLegend from '../components/map-legend';

var map;

var Explore = React.createClass({
  displayName: 'Explore',

  propTypes: {
    layer: React.PropTypes.string,
    showNoVpromms: React.PropTypes.bool,
    dispatch: React.PropTypes.func
  },

  componentDidMount: function () {
    mapboxgl.accessToken = config.mbToken;
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      failIfMajorPerformanceCaveat: false,
      center: [this.props.globX, this.props.globY],
      zoom: this.props.globZ
    }).addControl(new mapboxgl.NavigationControl(), 'bottom-left');

    map.on('load', () => {
      // Load all roads with VPRoMMS values, and color by IRI
      map.addLayer({
        id: 'conflated',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://openroads.vietnam-conflated'
        },
        'source-layer': 'conflated',
        paint: { 'line-width': 4 },
        layout: { 'line-cap': 'round' }
      }).setPaintProperty(
        'conflated',
        'line-color',
        lineColors['iri']
      ).setFilter('conflated', ['has', 'or_vpromms']);
    });
  },

  handleLayerChange: function (e) {
    const property = e.target.value;
    this.props.dispatch(selectExploreMapLayer(property));
    map.setPaintProperty(
      'conflated',
      'line-color',
      lineColors[property]
    );
  },

  handleShowNoVpromms: function (e) {
    const show = e.target.checked;
    this.props.dispatch(exploreMapShowNoVpromms(show));
    if (show) {
      map.setFilter('conflated', null);
    } else {
      map.setFilter('conflated', ['has', 'or_vpromms']);
    }
  },

  render: function () {
    return (
      <div className='map-container'>
        <div id='map'></div>

        <MapOptions
          handleLayerChange={ this.handleLayerChange }
          handleShowNoVpromms={ this.handleShowNoVpromms }
        />

        <MapLegend
          layer={this.props.layer}
        />
      </div>
    );
  }
});

function selector (state) {
  return {
    layer: state.exploreMap.layer,
    globX: state.globZoom.x,
    globY: state.globZoom.y,
    globZ: state.globZoom.z
  };
}

function dispatcher (dispatch) {
  return {
    _setGlobZoom: function (xyzObj) {dispatch(setGlobalZoom(xyzObj))}
  }
}

module.exports = connect(selector)(Explore);
