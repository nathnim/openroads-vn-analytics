import {
  compose,
  withStateHandlers,
  lifecycle
} from 'recompose';
import { connect } from 'react-redux';
import RoadTable from '../components/road-table';


const RoadTableContainer = compose(
  connect(
    state => ({
      adminRoads: state.adminRoads.ids,
      adminRoadProperties: state.VProMMsAdminProperties.data
    })
  ),
  withStateHandlers(
    { sortField: 'id', sortOrder: 'asc' },
    {
      sortColumnAction: ({ sortField, sortOrder }) => (field) => (
        sortField === field ?
          { sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' } :
          { sortField: field, sortOrder: 'asc' }
      )
    }
  ),
  lifecycle({
    componentWillMount: () => {
      
    }
  })
)(RoadTable);


export default RoadTableContainer;
