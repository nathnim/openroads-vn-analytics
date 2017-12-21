import React from 'react';
import { connect } from 'react-redux';
import {
  compose,
  getContext
} from 'recompose';
import mapboxgl from 'mapbox-gl';
import T from '../components/t';
import config from '../config';
import lineColors from '../utils/line-colors';
import {
  selectExploreMapLayer,
  exploreMapShowNoVpromms
} from '../actions/action-creators';
import {
  setMapPosition
} from '../redux/modules/map';
import MapSearch from '../components/map-search';
import MapOptions from '../components/map-options';
import MapLegend from '../components/map-legend';


var Explore = React.createClass({
  displayName: 'Explore',

  propTypes: {
    layer: React.PropTypes.string,
    lng: React.PropTypes.number,
    lat: React.PropTypes.number,
    zoom: React.PropTypes.number,
    selectExploreMapLayer: React.PropTypes.func,
    exploreMapShowNoVpromms: React.PropTypes.func,
    setMapPosition: React.PropTypes.func
  },

  componentDidMount: function () {
    mapboxgl.accessToken = config.mbToken;

    const { lng, lat, zoom } = this.props;

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      failIfMajorPerformanceCaveat: false,
      center: [lng, lat],
      zoom: zoom
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

    this.map.on('load', () => {
      // Load all roads with VPRoMMS values, and color by IRI
      this.map.addLayer({
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
      );
    });
  },

  handleLayerChange: function ({ target: { value } }) {
    this.props.selectExploreMapLayer(value);
    this.map.setPaintProperty(
      'conflated',
      'line-color',
      lineColors[value]
    );
  },

  handleShowNoVpromms: function ({ target: { checked } }) {
    this.props.exploreMapShowNoVpromms(checked);

    if (checked) {
      this.map.setFilter('conflated', null);
    } else {
      this.map.setFilter('conflated', ['has', 'or_vpromms']);
    }
  },

  componentWillUnmount: function () {
    const { lng, lat } = this.map.getCenter();
    const zoom = this.map.getZoom();
    this.props.setMapPosition(lng, lat, zoom);
  },

  render: function () {
    return (
      <section className='inpage inpage--alt'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'><T>Explore</T></h1>
            </div>
            <div className='inpage__actions'>
              <MapSearch />
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <figure className='map'>
              <div className='map__media' id='map'></div>
              <div className='map__controls map__controls--top-right'>
                <MapOptions
                  handleLayerChange={this.handleLayerChange}
                  handleShowNoVpromms={this.handleShowNoVpromms}
                />
              </div>
              <div className='map__controls map__controls--bottom-right'>
                <MapLegend
                  layer={this.props.layer}
                />
              </div>
            </figure>
          </div>
        </div>
      </section>
    );
  }
});


export default compose(
  getContext({ language: React.PropTypes.string }),
  connect(
    state => ({
      layer: state.exploreMap.layer,
      lng: state.map.lng,
      lat: state.map.lat,
      zoom: state.map.zoom
    }),
    dispatch => ({
      setMapPosition: (lng, lat, zoom) => dispatch(setMapPosition(lng, lat, zoom)),
      selectExploreMapLayer: (value) => selectExploreMapLayer(value),
      exploreMapShowNoVpromms: (checked) => exploreMapShowNoVpromms(checked)
    })
  )
)(Explore);
