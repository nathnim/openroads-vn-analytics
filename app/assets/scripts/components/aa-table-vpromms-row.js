import React from 'react';
import {
  compose,
  getContext,
  withStateHandlers
} from 'recompose';
import {
  withRouter
} from 'react-router';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Link } from 'react-router';
import {
  roadIdIsValid,
  editRoadEpic,
  deleteRoadEpic
} from '../redux/modules/editRoad';
import { api } from '../config';
import T, {
  translate
} from './t';


const RowPropertiesList = ({
  vpromm, adminRoadProperties, expandProperties, toggleExpandProperties
}) => {
  // TODO - properly render props dropdown
  const roadPropDropDown = [];

  if (adminRoadProperties.length !== 0) {
    const adminProp = adminRoadProperties.find((prop) => prop.id === vpromm);
    if (adminProp) {
      _.forEach(adminProp.properties, (prop, key, j) => {
        roadPropDropDown.push(<dt key={`${vpromm}-${key}-${j}-key`}>{key}</dt>);
        roadPropDropDown.push(<dd key={`${vpromm}-${key}-${j}-prop`}>{prop}</dd>);
      });
    } else {
      roadPropDropDown.push(<dt key={`${vpromm}-key`}></dt>);
      roadPropDropDown.push(<dd key={`${vpromm}-prop`}></dd>);
    }
  }

  return adminRoadProperties.length !== 0 ?
    <td className='table-properties-cell'>
      <button
        type='button'
        className={`button-table-expand ${expandProperties ? 'button-table-expand--show' : 'button-table-expand--hide'}`}
        onClick={toggleExpandProperties}
      >
        <span>{expandProperties ? <T>Hide</T> : <T>Show</T>}</span>
      </button>
      <div
        className={`table-properties ${!expandProperties ? 'table-properties--hidden' : ''}`}
      >
        <dl className='table-properties-list'>{roadPropDropDown}</dl>
      </div>
    </td> :
    <td/>;
};

const RowReadView = ({
  vpromm, adminRoadProperties,
  vprommFieldInDB, language, expandProperties,
  toggleExpandProperties, showDeleteView, showEditView
}) => {
  return (
    <tr>
      <td className="table-properties-cell-view-buttons">
        <button
          type="button"
          className="collecticon-trash-bin"
          title={translate(language, 'Delete Road')}
          onClick={showDeleteView}
        />
        <button
          type="button"
          className="collecticon-pencil"
          title={translate(language, 'Edit Road')}
          onClick={showEditView}
        />
      </td>
      <td>
        {vprommFieldInDB ?
          <Link to={`/${language}/explore`}>
            <strong>{vpromm}</strong>
          </Link> :
          vpromm
        }
      </td>
      <td className={vprommFieldInDB ? 'added' : 'not-added'}>
        { vprommFieldInDB &&
          <div className='a-table-actions'>
            <Link
              className='a-table-action'
              to={`/${language}/assets/road/${vpromm}/`}
            >
              <T>Explore</T>
            </Link>
            <a
              className='a-table-action'
              href={`${api}/field/geometries/${vpromm}?grouped=false&download=true`}
            >
              <T>Download</T>
            </a>
          </div>
        }
      </td>
      <RowPropertiesList
        vpromm={vpromm}
        adminRoadProperties={adminRoadProperties}
        expandProperties={expandProperties}
        toggleExpandProperties={toggleExpandProperties}
      />
    </tr>
  );
};

const RowEditView = ({
  vpromm, newRoadId, formIsInvalid, language, status, showReadView, updateNewRoadId, confirmEdit
}) => (
  <tr
    className="edit-row"
  >
    <td
      className="table-properties-cell-view-buttons"
    >
      <button
        type="button"
        className="button close collecticon-xmark"
        title={translate(language, 'Cancel')}
        onClick={showReadView}
      />
    </td>
    <td
      colSpan="3"
    >
      {
          <p>
            <input
              type="text"
              value={newRoadId}
              onChange={updateNewRoadId}
            />
            <button
              className="button button--secondary-raised-dark"
              onClick={confirmEdit}
              disabled={newRoadId === '' || status === 'pending' || newRoadId === vpromm}
            >
              <T>Submit</T>
            </button>
            <button
              className="button button--base-raised-light"
              onClick={showReadView}
            >
              <T>Cancel</T>
            </button>
            {
              status === 'pending' ?
                <T>Loading</T> :
              status === 'error' ?
                <T>Error</T> :
              formIsInvalid ?
                <strong><T>Invalid Road Id</T></strong> :
                <span/>
            }
          </p>
      }
    </td>
  </tr>
);

const RowDeleteView = ({ vpromm, language, status, showReadView, confirmDelete }) => (
  <tr
    className="delete-row"
  >
    <td
      className="table-properties-cell-view-buttons"
    >
      <button
        type="button"
        className="button close collecticon-xmark"
        title={translate(language, 'Cancel')}
        onClick={showReadView}
      />
    </td>
    <td
      colSpan="3"
    >
      {
        status === 'pending' ?
          <p><T>Loading</T></p> :
        status === 'error' ?
          <p><T>Error</T></p> :
          <p>
            <T>Are you sure you want to delete VPRoMMS</T> <strong>{vpromm}</strong>?
            <button
              className="button button--secondary-raised-dark"
              onClick={confirmDelete}
            >
              <T>Delete</T>
            </button>
            <button
              className="button button--base-raised-light"
              onClick={showReadView}
            >
              <T>Cancel</T>
            </button>
          </p>
      }
    </td>
  </tr>
);

const TableRow = (props) => {
  if (props.viewState === 'read') {
    return <RowReadView {...props} />;
  } else if (props.viewState === 'edit') {
    return <RowEditView {...props} />;
  } else if (props.viewState === 'delete') {
    return <RowDeleteView {...props} />;
  }
};


TableRow.propTypes = {
  viewState: React.PropTypes.string.isRequired
};


export default compose(
  getContext({ language: React.PropTypes.string }),
  withRouter,
  connect(
    (state, { vpromm, router: { params: { aaId, aaIdSub } } }) => ({
      status: state.editRoad[vpromm] ? state.editRoad[vpromm].status : 'complete',
      province: state.crosswalk.province[aaId] && state.crosswalk.province[aaId].id,
      district: state.crosswalk.district[aaIdSub] && state.crosswalk.district[aaIdSub]
    }),
    (dispatch, { vpromm }) => ({
      confirmDelete: () => dispatch(deleteRoadEpic(vpromm)),
      submitEdit: (newRoadId) => dispatch(editRoadEpic(vpromm, newRoadId))
    })
  ),
  withStateHandlers(
    ({ vpromm }) => ({
      viewState: 'read', newRoadId: vpromm, expandProperties: false, formIsInvalid: false
    }),
    {
      showReadView: (_, { vpromm }) => () => ({ viewState: 'read', newRoadId: vpromm, formIsInvalid: false }),
      showEditView: () => () => ({ viewState: 'edit' }),
      showDeleteView: () => () => ({ viewState: 'delete' }),
      toggleExpandProperties: ({ expandProperties }) => () => ({ expandProperties: !expandProperties }),
      updateNewRoadId: () => (e) => ({ newRoadId: e.target.value }),
      confirmEdit: ({ newRoadId }, { submitEdit, province, district }) => (e) => {
        e.preventDefault();
        // TODO - expose validation error messages
        if (!roadIdIsValid(newRoadId, province, district)) {
          return { formIsInvalid: true };
        }

        submitEdit(newRoadId);
        return { formIsInvalid: false, newRoadId: '' };
      }
    }
  )
)(TableRow);
