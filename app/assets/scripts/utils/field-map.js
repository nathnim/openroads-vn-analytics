
import bbox from '@turf/bbox';
/**
 * given a feature collection, returns a mapboxgl geojson feature collection object
 * @func generateSourceFC
 * @param {object} fc feature collection
 * @return {object} mapboxgl object
 */
export function generateSourceFC (fc) {
  // layer spec per this tutorial -> https://www.mapbox.com/mapbox-gl-js/example/multiple-geometries/
  return {
    'type': 'geojson',
    'data': fc
  };
}

/**
 * given a source id, fieldDataSOurce, and vprommsId, generate a unique mapboxgl layer object used to add given feature
 * to mapboxgl map.
 * @func generateLayer
 * @param {object} sourceId mapboxgl source id given for layer's source
 * @param {string} fieldDataSource name of the field data's source, either RoadLabPro, or RouteShoot
 * @param {vprommId} vprommId road's vprommsId. here used to generate part of the layer's id
 * @return {object} layer object used to add layers to mapboxgl map
 */
export function generateLayer (sourceId, fieldDataSource, vprommId) {
  return {
    'id': `${vprommId}-${fieldDataSource}-field-data`,
    'type': 'point',
    'source': sourceId,
    'filter': ['==', 'source', fieldDataSource]
  };
}

/**
 * given a feature collection, returns boudns used to set field data map zoom
 * @param {object} fc feature collection
 * @return {array} bounding box array
 */
export function generateBbox (fc) {
  console.log(fc);
  return bbox(fc);
}
