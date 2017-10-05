// TODO generalize sort tables to accept arbitrary columns and attributes
// (combine aa-table-index.js and aa-table-vromms.js into single component)

import React from 'react';
import { Link } from 'react-router';
import { t, getLanguage } from '../utils/i18n';
import _ from 'lodash';
import classnames from 'classnames';

const displayHeader = [
  {key: 'name', value: 'Province'},
  {key: 'done', value: 'Done'},
  {key: 'total', value: 'Total'},
  {key: 'percentageComplete', value: '% ' + 'Complete'},
  {key: 'progress', value: 'Progress'}
];

const AATable = React.createClass({
  displayName: 'AATable',

  propTypes: {
    data: React.PropTypes.array
  },

  getInitialState: function () {
    return {
      sortState: {
        field: 'name',
        order: 'asc'
      }
    };
  },

  renderTableHead: function () {
    return (
      <thead>
        <tr>
          {_.map(displayHeader, (d) => {
            let c = classnames('collecticons', {
              'collecticons-sort-none': this.state.sortState.field !== d.key,
              'collecticons-sort-asc': this.state.sortState.field === d.key && this.state.sortState.order === 'asc',
              'collecticons-sort-desc': this.state.sortState.field === d.key && this.state.sortState.order === 'desc'
            });
            return (
              <th key={d.key} onClick={this.sortLinkClickHandler.bind(null, d.key)}>
                <i className={c}></i>
                <span>{t(d.value)}</span>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  },

  sortLinkClickHandler: function (field, e) {
    e.preventDefault();
    let {field: sortField, order: sortOrder} = this.state.sortState;
    let order = 'asc';
    // Same field, switch order; different field, reset order.
    if (sortField === field) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.setState({
      sortState: {
        field,
        order
      }
    });
  },

  handleSort: function () {
    let sortField = this.state.sortState.field;
    if (sortField === 'progress') {
      sortField = 'percentageComplete';
    }
    let sorted = _(this.props.data).sortBy(sortField);
    if (this.state.sortState.order === 'desc') {
      sorted = sorted.reverse();
    }
    return sorted.value();
  },

  renderTableBody: function () {
    const sorted = this.handleSort(this.props.data);
    return (
      <tbody>
        {_.map(sorted, (province, i) => {
          let percText;
          if (!isNaN(province.total)) {
            if (province.total > 0) {
              percText = `${((province.done / province.total * 100)).toFixed(2)}${t('% Complete')}`;
            } else {
              percText = '';
            }
          } else {
            percText = `100.00${t('% Complete')}`;
          }
          return (
            <tr key={`province-${province.id}`} className={classnames('collecticon-sort-asc', {'alt': i % 2})}>
              <td><Link to={`${getLanguage()}/analytics/${province.id}`}>{province.name}</Link></td>
              <td>{province.done}</td>
              <td>{province.total}</td>
              <td>{percText}</td>
              <td>
                <div className='meter'>
                  <div className='meter__internal' style={ province.total > 0 ? {width: `${province.done / province.total * 100}%`} : {width: 0}}></div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  },

  render: function () {
    return (
      <div className='table'>
        <table>
          {this.renderTableHead()}
          {this.renderTableBody()}
        </table>
      </div>
    );
  }
});
export default AATable;
