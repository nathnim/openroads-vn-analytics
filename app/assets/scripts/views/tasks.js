import React from 'react';
import {
  compose,
  lifecycle,
  getContext
} from 'recompose';
import { connect } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import config from '../config';
import getExtent from 'turf-extent';
import c from 'classnames';
import intersect from '@turf/line-intersect';
import pointOnLine from '@turf/point-on-line';
import point from 'turf-point';
import { coordReduce } from '@turf/meta';
import getDistance from '@turf/distance';
import {
  queryOsmEpic,
  deleteEntireWaysEpic
} from '../redux/modules/osm';
import {
  setMapPosition
} from '../redux/modules/map';
import {
  fetchNextWayTaskEpic,
  fetchWayTaskCountEpic,
  markWayTaskPendingEpic,
  skipTask,
  selectWayTaskProvince,
  dedupeWayTaskEpic
} from '../redux/modules/tasks';
import { fetchProvinces } from '../actions/action-creators.js';
import { createModifyLineString } from '../utils/to-osm';
import T, {
  translate
} from '../components/t';
import TaskListItem from '../components/task-list-item';
import Select from 'react-select';
import _ from 'lodash';

const source = 'collisions';
const roadHoverId = 'road-hover';
const roadSelected = 'road-selected';
const layers = [{
  id: 'road',
  type: 'line',
  source,
  paint: {
    'line-width': 4,
    'line-opacity': 0.2
  },
  layout: { 'line-cap': 'round' }
}, {
  id: roadHoverId,
  type: 'line',
  source,
  paint: {
    'line-width': 6,
    'line-opacity': 0.9
  },
  layout: { 'line-cap': 'round' },
  filter: ['==', '_id', '']
}, {
  id: roadSelected,
  type: 'line',
  source,
  paint: {
    'line-width': 6,
    'line-opacity': 0.9,
    'line-color': '#FF0000'
  },
  layout: { 'line-cap': 'round' },
  filter: ['==', '_id', '']
}];

const layerIds = layers.map(layer => layer.id);

var Tasks = React.createClass({
  getInitialState: function () {
    return {
      renderedFeatures: null,
      mode: 'dedupe',

       // Steps are 0, 1 and 2 in accordance with new step workflow
      step: 0,
      hoverId: null,
      selectedIds: [],
      selectedStep0: [], // ids of selected features in step 0
      selectedStep1: null, // in step "1", there can only ever be one id selected
      selectedProvince: null,
      selectedVprommids: [],
      chooseVprommids: false,
      applyVprommid: null
    };
  },

  propTypes: {
    fetchNextTask: React.PropTypes.func,
    setMapPosition: React.PropTypes.func,
    _queryOsm: React.PropTypes.func,
    _markTaskAsDone: React.PropTypes.func,
    _deleteWays: React.PropTypes.func,
    skipTask: React.PropTypes.func,
    fetchTaskCount: React.PropTypes.func,
    osmStatus: React.PropTypes.string,
    taskStatus: React.PropTypes.string,
    meta: React.PropTypes.object,
    task: React.PropTypes.object,
    taskId: React.PropTypes.number,
    taskCount: React.PropTypes.number,
    selectOptions: React.PropTypes.object,
    selectedProvince: React.PropTypes.number,
    selectNextTaskProvince: React.PropTypes.func,
    dedupeWayTask: React.PropTypes.func,
    language: React.PropTypes.string
  },

  componentDidMount: function () {
    mapboxgl.accessToken = config.mbToken;
    const map = this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      failIfMajorPerformanceCaveat: false,
      zoom: 12
    }).addControl(new mapboxgl.NavigationControl(), 'bottom-left');

    this.onMapLoaded(() => {
      map.on('mousemove', (e) => {
        // toggle cursor and hover filters on mouseover
        let features = map.queryRenderedFeatures(e.point, { layers: layerIds });
        let id;

        if (features.length && features[0].properties._id) {
          map.getCanvas().style.cursor = 'pointer';
          id = features[0].properties._id;
        } else {
          map.getCanvas().style.cursor = '';
          id = '';
        }

        this.hoverItemOver(id);
        // this.setState({hoverId: id}); // eslint-disable-line react/no-did-mount-set-state
        // map.setFilter(roadHoverId, ['==', '_id', id]);
      });

      map.on('click', (e) => {
        const { step } = this.state;
        let features = map.queryRenderedFeatures(e.point, { layers: [ roadHoverId ] });
        if (features.length && features[0].properties._id) {
          let featId = features[0].properties._id;
          if (step === 0) {
            this.selectStep0(featId);
          } else if (step === 1) {
            this.selectStep1(featId);
          } else {
            return;
          }
        }
      });
          // let selectedIds;
          // let vprommid = [features[0].properties.or_vpromms ? features[0].properties.or_vpromms : 'No ID'];
          // let selectedVprommids = vprommid.concat(this.state.selectedVprommids);
          // let chooseVprommids = false;
          // let applyVprommid = null;

          // if (this.state.mode === 'dedupe') {
          //   selectedIds = [featId];
          //   const uniqVprommids = _.uniq(this.state.selectedVprommids.filter((x) => { return x !== 'No ID'; }));
          //   // check here for if vprommid selection is needed. here are the cases:
          //   if (uniqVprommids.length === 0) {
          //     // 2. if all are null - don't do anything.
          //     chooseVprommids = false;
          //     applyVprommid = 'No ID';
          //   }

          //   if (uniqVprommids.length === 1) {
          //     // 1. if all roads have same vprommid - don't do anything.
          //     chooseVprommids = false;
          //     applyVprommid = uniqVprommids[0];
          //   }

          //   if (uniqVprommids.length > 1) {
          //     chooseVprommids = true;
          //     applyVprommid = null;
          //     selectedVprommids = uniqVprommids.concat('No ID');
          //   }
          // } else if (this.state.mode === 'join') {
          //   if (this.state.selectedIds[0] === featId) {
          //     // in join, don't allow de-selecting the initially selected road
          //     selectedIds = [].concat(this.state.selectedIds);
          //   } else {
          //     // in join, there can only be 2 selections
          //     selectedIds = [this.state.selectedIds[0], featId];
          //   }
          // } else {
          //   // Clone the selected array.
          //   selectedIds = [].concat(this.state.selectedIds);
          //   let idx = findIndex(selectedIds, o => o === featId);

          //   if (idx === -1) {
          //     selectedIds.push(featId);
          //   } else {
          //     selectedIds.splice(idx, 1);
          //   }
          // }

          // map.setFilter(roadSelected, ['in', '_id'].concat(selectedIds));
      //     this.setState({ selectedIds, selectedVprommids, chooseVprommids, applyVprommid }); // eslint-disable-line react/no-did-mount-set-state
      //   }
      // });
    });
  },

  componentWillReceiveProps: function ({ task: nextTask, taskId: nextTaskId, osmStatus: nextOsmStatus }) {
    if (this.props.task !== nextTask) {
      // TODO - ANTIPATTERN: should not mirror properties task and taskId in state
      this.setState({ renderedFeatures: nextTask }, () => this.onMapLoaded(() => this.syncMap()));
    } else if (this.props.osmStatus === 'pending' && nextOsmStatus === 'complete') {
      // We've just successfully completed an osm changeset

      // TODO - move this state into redux store so it can be modified directly by actions
      // specifically, COMPLETE_OSM_CHANGE
      this.setState({
        selectedIds: [],
        mode: null
      });
    }
  },

  componentWillUnmount: function () {
    const { lng, lat } = this.map.getCenter();
    const zoom = this.map.getZoom();
    this.props.setMapPosition(lng, lat, zoom);
  },

  onMapLoaded: function (fn) {
    if (this.map.loaded()) fn();
    else this.map.once('load', fn);
  },

  syncMap: function () {
    const features = this.state.renderedFeatures;
    const { map } = this;
    const existingSource = map.getSource(source);
    const selectedIds = [].concat(this.state.selectedStep0);
    const hoverId = this.state.hoverId;
    if (!existingSource) {
      map.addSource(source, {
        type: 'geojson',
        data: features
      });
      layers.forEach(layer => {
        map.addLayer(layer);
      });
    } else {
      existingSource.setData(features);
    }
    map.fitBounds(getExtent(features), {
      linear: true,
      padding: 25
    });
    map.setFilter(roadSelected, ['in', '_id'].concat(selectedIds));
    map.setFilter(roadHoverId, ['==', '_id', hoverId]);
  },

  renderPropertiesOverlay: function () {
    const { hoverId } = this.state;
    const { task } = this.props;
    const properties = task.features.find(c => hoverId === c.properties._id).properties;
    const displayList = Object.keys(properties).map(key => key.charAt(0) === '_' ? null : [
      <dt key={`${key}-key`}><strong>{key}</strong></dt>,
      <dd key={`${key}-value`}>{properties[key] ? properties[key] : '--'}</dd>
    ]).filter(Boolean);
    return (
      <div className='map__controls map__controls--top-left'>
        <figcaption className='panel properties-panel'>
          <div className='panel__body'>
            <dl>
              {displayList}
            </dl>
          </div>
        </figcaption>
      </div>
    );
  },

  renderInstrumentPanel: function () {
    const { mode, step, renderedFeatures } = this.state;
    const { taskCount, osmStatus, language } = this.props;

    if (osmStatus === 'pending') {
      return (
        <div className='map__controls map__controls--column-right'>
          <div className='panel tasks-panel'>
            <div className='panel__body'>
              <h2><T>Performing action...</T></h2>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className='map__controls map__controls--column-right'>
        <article className='panel task-panel'>
          {renderedFeatures &&
            <header className='panel__header'>
              <div className='panel__headline'>
                <h1 className='panel__sectitle'><T>Task</T> #000</h1>
                <p className='panel__subtitle'><time dateTime='2018-07-15T16:00'><T>Updated 2 days ago</T></time></p>
                <h2 className='panel__title'><T>Prepare workflow</T></h2>
              </div>
            </header>
          }
          <div className='panel__body'>
          {/* Render the mode select drop-down only if in step 0 */}
          { step === 0 &&
            <section className='task-group'>
              <header className='task-group__header'>
                <h1 className='task-group__title'><T>Select action to perform</T></h1>
              </header>
              <div className='task-group__body'>
                <form className='form task-group__actions'>
                  <div className='form__group'>
                    <label className='form__label visually-hidden'><T>Actions</T></label>
                      <select className='form__control' value={ mode } onChange={ this.handleChangeMode }>
                        <option value='dedupe'><T>Remove duplicates</T></option>
                        <option value='join'><T>Create intersection</T></option>
                      </select>
                  </div>
                </form>
              </div>
            </section>
          }
          { mode === 'dedupe' && this.renderDedupeMode() }
          { mode === 'join' && this.renderJoinMode() }
          </div>
          <footer className='panel__footer'>
            <div className='panel__f-actions'>
              <button type='button' className='pfa-secondary'><span><T>Skip task</T></span></button>
              <button type='button' className='pfa-primary'><span><T>Continue</T></span></button>
            </div>
          </footer>
        </article>
      </div>
    );
  },

  onJoin: function () {
    this.setState({mode: 'join'});
  },

  onDedupe: function () {
    const { selectedIds } = this.state;
    const { task } = this.props;
    const selectedFeatures = {
      type: 'FeatureCollection',
      features: selectedIds.map(id => task.features.find(f => f.properties._id === id))
    };

    this.setState({mode: 'dedupe', renderedFeatures: selectedFeatures}, this.syncMap);
  },

  // reset selected items when user changes mode, user can only change mode in step 0
  handleChangeMode: function(event) {
    this.setState({mode: event.target.value, selectedStep0: []}, this.syncMap);
  },

  renderDedupeMode: function () {
    const { step, renderedFeatures } = this.state;
    if (!renderedFeatures) {
      return (
        <div />
      )
    }
    if (step === 0) {
      return this.renderDedupeStep0();
    } else if (step === 1) {
      return this.renderDedupeStep1();
    } else if (step === 2) {
      return this.renderDedupeStep2();
    }

    // const chooseVprommids = this.state.chooseVprommids;
    // return (
    //   <div className='form-group map__panel--form'>
    //     <h2><T>Remove Duplicate Roads</T></h2>
    //     <p><T>Click on a road to keep. The other roads here will be deleted.</T></p>
    //     { chooseVprommids && this.renderVprommidSelect() }
    //     <button className={c('button button--secondary-raised-dark', {disabled: !(this.state.selectedIds.length === 1) || !(this.state.applyVprommid)})} type='button' onClick={this.commitDedupe}><T>Confirm</T></button>
    //     <br />
    //     <button className='button button--base-raised-dark' type='button' onClick={this.exitMode}><T>Cancel</T></button>
    //   </div>
    // );
  },

  // trigger when an item is selected during step 0
  selectStep0: function(id) {
    const { mode, selectedStep0 } = this.state;
    let selectedClone = [].concat(selectedStep0);
    if (mode === 'dedupe') { // user can select multiple
      if (selectedClone.includes(id)) {
        selectedClone.splice(selectedClone.indexOf(id));
      } else {
        selectedClone.push(id);
      }
    } else if (mode === 'join') { // Intersect mode will only allow one element to be selected
      if (selectedClone[0] === id) {
        selectedClone = [];
      } else {
        selectedClone[0] = id;
      }
    }
    this.setState({ selectedStep0: selectedClone }, this.syncMap);
  },

  hoverItemOver: function(id) {
    this.setState({ hoverId: id }, this.syncMap);
  },

  hoverItemOut: function(id) {
    this.setState({ hoverId: null }, this.syncMap);
  },

  renderDedupeStep0: function() {
    const { renderedFeatures, mode, selectedStep0, hoverId } = this.state;
    const { language } = this.props;
    return (
      <section className='task-group'>
        <header className='task-group__header'>
          <h1 className='task-group__title'><T>Select roads to work on</T></h1>
        </header>
        <div className='task-group__body'>
          <ul className='road-list'>
          {
            renderedFeatures.features.map(road => 
              <TaskListItem
                vpromm={ road.properties.or_vpromms }
                _id={ road.properties._id }
                mode={ mode }
                language={ language }
                key={ road.properties._id }
                selected={ selectedStep0.includes(road.properties._id) }
                isHighlighted={ road.properties._id === hoverId }
                onMouseOver={ this.hoverItemOver }
                onMouseOut={ this.hoverItemOut }
                toggleSelect={ this.selectStep0 }
              />
            )
          }
          </ul>
        </div>
      </section>

    );
  },


  renderVprommidSelect: function () {
    const { language } = this.props;
    const uniqVprommids = _.uniq(this.state.selectedVprommids);
    const vprommidOptions = uniqVprommids.map(x => { return {value: x, label: x}; });
    let value = this.state.applyVprommid;
    return (
      <Select
        name="form-vprommid-select"
        searchable={ false }
        value={value}
        onChange={ this.handleSelectVprommid }
        options={ vprommidOptions }
        placeholder={ translate(language, 'Select a VPROMMID to apply') }
      />
    );
  },

  handleSelectVprommid: function (selectedVprommid) {
    this.setState({ applyVprommid: selectedVprommid });
  },

  renderJoinMode: function () {
    return (
      <div className='form-group map__panel--form'>
        <h2>Create an Intersection</h2>
        <p>Click on a road to create an intersection with.</p>
        <button className={c('button button--secondary-raised-dark', {disabled: this.state.selectedIds.length !== 2})} type='button' onClick={this.commitJoin}><T>Confirm</T></button>
        <br />
        <button className='button button--base-raised-dark' type='button' onClick={this.exitMode}><T>Cancel</T></button>
      </div>
    );
  },

  renderSelectMode: function () {
    return (
      <div>
        <div className='form-group'>
          <p>1. <T>Select roads to work on</T></p>
          <div className='map__panel--selected'>
            {this.renderSelectedIds()}
          </div>
        </div>
        <div className='form-group map__panel--form'>
          <p>2. <T>Choose an action to perform</T></p>
          <button
            className={c('button button--base-raised-light', {disabled: this.state.selectedIds.length < 2})}
            type='button'
            onClick={this.onDedupe}
          >
            <T>Remove Duplicates</T>
          </button>
          <br />
          <button
            className={c('button button--base-raised-light', {disabled: this.state.selectedIds.length !== 1})}
            type='button'
            onClick={this.onJoin}
          >
            <T>Create Intersection</T>
          </button>
        </div>
        <div className='form-group map__panel--form'>
          <button
            className='button button--base-raised-light'
            type='button'
            onClick={this.markAsDone}
          >
            <T>Finish task</T>
          </button>
          <br />
          <button
            className='button button--secondary-raised-dark'
            type='button'
            onClick={this.next}
          >
            <T>Skip task</T>
          </button>
        </div>
      </div>
    );
  },

  commitDedupe: function () {
    const { selectedIds, renderedFeatures, applyVprommid } = this.state;
    const { features } = renderedFeatures;
    const toDelete = features.filter(feature => selectedIds[0] !== feature.properties._id);
    const wayIdToKeep = selectedIds[0];
    this.props.dedupeWayTask(this.props.taskId, toDelete.map(feature => feature.properties._id), wayIdToKeep, applyVprommid === 'No ID' ? null : applyVprommid);
    // this.props._deleteWays(this.props.taskId, toDelete.map(feature => feature.properties._id));

    // TODO - should deduping mark task as done?
    this.props._markTaskAsDone(toDelete.map(feature => feature.properties._id));
  },

  commitJoin: function () {
    const { selectedIds, renderedFeatures } = this.state;
    const { features } = renderedFeatures;
    const line1 = features.find(f => f.properties._id === selectedIds[0]);
    const line2 = features.find(f => f.properties._id === selectedIds[1]);
    const intersectingFeatures = intersect(line1, line2);
    const changes = [];

    if (!intersectingFeatures.features.length) {
      // lines don't intersect, find the two nearest points on the two respective lines.
      const closestPoints = coordReduce(line1, (context, line1Point) => {
        // If we find two points with shorter distance between them,
        // set the coordinates on the second line to this variable.
        let closerLine2Point = null;
        let bestDistance = coordReduce(line2, (currentBest, line2Point) => {
          let distance = getDistance(line1Point, line2Point);
          if (distance < currentBest) {
            closerLine2Point = line2Point;
            return distance;
          }
          return currentBest;
        }, context.distance);

        if (closerLine2Point) {
          return {
            distance: bestDistance,
            line1Point,
            line2Point: closerLine2Point
          };
        }
        return context;
      }, {distance: Infinity, line1Point: null, line2Point: null});


      // Figure out where to add the extra point.
      // For either line, if the closest coordinate is at the start or tail end of the line,
      // we can just add it to the beginning or end.
      const line1Point = pointOnLine(line1, point(closestPoints.line1Point));
      const line2Point = pointOnLine(line2, point(closestPoints.line2Point));

      if (line1Point.properties.index === 0
        || line1Point.properties.index === line1.geometry.coordinates.length - 1) {
        changes.push(insertPointOnLine(line1, line2Point));
      } else if (line2Point.properties.index === 0
        || line2Point.properties.index === line2.geometry.coordinates.length - 1) {
        changes.push(insertPointOnLine(line2, line1Point));
      } else {
        changes.push(insertPointOnLine(line1, point(closestPoints.line2Point)));
        changes.push(insertPointOnLine(line2, point(closestPoints.line1Point)));
      }
    } else {
      let intersection = intersectingFeatures.features[0];
      changes.push(insertPointOnLine(line1, intersection));
      changes.push(insertPointOnLine(line2, intersection));
    }

    const changeset = createModifyLineString(changes);

    this.props._queryOsm(this.props.taskId, changeset);

    // TODO - should deduping mark task as done?
    this.props._markTaskAsDone([line1.properties._id, line2.properties._id]);
  },

  markAsDone: function () {
    // This function is different from #next, in that it allows you
    // to specify all visible roads as 'done'
    this.props._markTaskAsDone(this.state.renderedFeatures.features.map(feature => Number(feature.properties._id)));
    this.props.fetchTaskCount();
    this.next();
  },

  next: function () {
    this.map.setFilter(roadSelected, ['all', ['in', '_id', '']]);
    this.props.skipTask(this.props.taskId);
    this.setState({ selectedIds: [], mode: null, selectedVprommids: [] }, this.props.fetchNextTask);
  },

  renderSelectedIds: function () {
    const { selectedIds } = this.state;
    if (!selectedIds.length) {
      return <p className='empty'><T>No roads selected yet. Click a road to select it</T></p>;
    }
    if (selectedIds.length === 1) {
      return <p><T>1 road selected. Select at least one more</T></p>;
    }
    return <p>{selectedIds.length} <T>roads selected</T></p>;
  },

  handleProvinceChange: function (selectedProvince) {
    const value = selectedProvince ? selectedProvince.value : null;
    this.props.selectNextTaskProvince(value);
    this.props.fetchNextTask();
  },

  renderProvinceSelect: function () {
    const { selectedProvince, language } = this.props;
    const provinceOptions = this.props.selectOptions.province.map((p) => { return {value: p.id, label: p.name_en}; });
    const value = selectedProvince;
    return (
      <Select
        name="form-province-select"
        value={value}
        onChange= {this.handleProvinceChange}
        options={ provinceOptions }
        placeholder ={ translate(language, 'Filter tasks by province') }
      />
    );
  },

  render: function () {
    const { taskId, taskStatus } = this.props;
    const { hoverId } = this.state;

    return (
      <section className='inpage inpage--alt'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'><T>Playground</T></h1>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>

            <figure className='map'>
              <div className='map__media' id='map'></div>
              {
                hoverId && this.renderPropertiesOverlay()
              }
              {
                taskStatus === 'error' &&
                <div className='placeholder__fullscreen'>
                  <h3 className='placeholder__message'><T>Error</T></h3>
                </div>
              }
              {
                taskStatus === 'No tasks remaining' &&
                <div className='placeholder__fullscreen'>
                  <h3 className='placeholder__message'><T>No tasks remaining</T></h3>
                </div>
              }
              {
                !taskId && taskStatus === 'pending' &&
                <div className='placeholder__fullscreen'>
                  <h3 className='placeholder__message'><T>Loading</T></h3>
                </div>
              }
              {
                this.renderInstrumentPanel()
              }
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
      task: state.waytasks.geoJSON,
      taskId: state.waytasks.id,
      taskCount: state.waytasks.taskCount,
      taskStatus: state.waytasks.status,
      osmStatus: state.osmChange.status,
      selectOptions: state.provinces.data,
      selectedProvince: state.waytasks.selectedProvince
    }),
    dispatch => ({
      fetchProvinces: () => dispatch(fetchProvinces()),
      selectNextTaskProvince: (provinceId) => dispatch(selectWayTaskProvince(provinceId)),
      dedupeWayTask: (taskId, wayIds, wayIdToKeep, dedupeVprommid) => dispatch(dedupeWayTaskEpic(taskId, wayIds, wayIdToKeep, dedupeVprommid)),
      fetchNextTask: () => dispatch(fetchNextWayTaskEpic()),
      fetchTaskCount: () => dispatch(fetchWayTaskCountEpic()),
      skipTask: (id) => dispatch(skipTask(id)),
      _markTaskAsDone: (taskIds) => dispatch(markWayTaskPendingEpic(taskIds)),
      _queryOsm: (taskId, payload) => dispatch(queryOsmEpic(taskId, payload)),
      _deleteWays: (taskId, wayIds) => dispatch(deleteEntireWaysEpic(taskId, wayIds)),
      setMapPosition: (lng, lat, zoom) => dispatch(setMapPosition(lng, lat, zoom))
    })
  ),
  lifecycle({
    componentDidMount: function () {
      // TODO - data fetching for this page should be moved into a route container
      // fire to get all the provinces here.
      this.props.fetchProvinces();
      this.props.fetchNextTask();
      this.props.fetchTaskCount();
    }
  })
)(Tasks);

function findIndex (haystack, fn) {
  let idx = -1;
  haystack.some((o, i) => {
    if (fn(o)) {
      idx = i;
      return true;
    }
    return false;
  });
  return idx;
}

function insertPointOnLine (feature, point) {
  const nearest = pointOnLine(feature, point);
  const { index } = nearest.properties;
  const coordinates = feature.geometry.coordinates.slice();
  const targetIndex = index === 0 ? 0
    : index === coordinates.length - 1 ? coordinates.length
      : getDistance(point, coordinates[index - 1]) < getDistance(point, coordinates[index + 1]) ? index : index + 1;
  coordinates.splice(targetIndex, 0, point.geometry.coordinates);
  return Object.assign({}, feature, {
    geometry: {
      type: 'LineString',
      coordinates
    }
  });
}
