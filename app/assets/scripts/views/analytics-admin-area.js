'use strict';
import React from 'react';
import { connect } from 'react-redux';
import { t } from '../utils/i18n';

import AATable from '../components/aa-table-vpromms';
import Headerdrop from '../components/headerdrop';

import { fetchVProMMSids } from '../actions/action-creators';

import config from '../config';

var AnalyticsAA = React.createClass({
  displayName: 'AnalyticsAA',

  propTypes: {
    children: React.PropTypes.object,
    routeParams: React.PropTypes.object,
    params: React.PropTypes.object,
    VProMMSids: React.PropTypes.object,
    VProMMSidsSources: React.PropTypes.object,
    VProMMSidSourceGeoJSON: React.PropTypes.object,
    VProMMSidSourceGeoJSONisFetched: React.PropTypes.bool
  },

  renderDataDumpLinks: function (provinceId) {
    return (
        <Headerdrop
          id='datadump-selector'
          className='drop-road-network'
          triggerClassName='drop-toggle drop-road-network caret bttn bttn-secondary bttn-road-network'
          triggerText={`${t('Download')} ${t('Roads')}`}
          triggerElement='a'
          direction='down'
          alignment='right'>
          <ul className='drop-menu drop-menu--select' role='menu'>
            {
            ['CSV', 'GeoJSON'].map((type, i) => {
              let cl = 'drop-menu-item';
              return (
                <li>
                  <a className={cl} href={`${config.provinceDumpBaseUrl}${provinceId}.${type.toLowerCase()}`}>
                    {`${t('Download')} ${type}`}
                  </a>
                </li>
              );
            })
            }
          </ul>
        </Headerdrop>
    );
  },

  render: function () {
    const provinceId = this.props.routeParams.aaId;
    const data = this.props.VProMMSids.data[provinceId];
    const ids = data.vpromms;
    const done = ids.filter(v => v.inTheDatabase).length;
    const total = ids.length;
    const completion = total !== 0 ? ((done / total) * 100) : 0;
    // completion text is comprised of a main text component and a tail component, both need to be distinct per the existence of ids for the province.
    let completionMainText;
    let completionTailText = t('Information on VPRoMMS roads is not available');
    if (total !== 0) {
      completionMainText = completion.toFixed(2);
      completionTailText = `% ${t('of VProMMS Ids added')} ${done.toLocaleString()} of ${total.toLocaleString()}`;
    }
    return (
      <div>
        <div className="aa-header">
          <div className="aa-headline">
            <h1>{data.provinceName} {t('Province')}</h1>
          </div>
          <div className="aa-head-actions">
            { completion ? this.renderDataDumpLinks(provinceId) : '' }
          </div>
        </div>
        <div className='aa-main__status'>
          <h2><strong>{completionMainText}</strong>{completionTailText}</h2>
          <div className='meter'>
            <div className='meter__internal' style={{width: `${completion}%`}}></div>
          </div>
          {total ? <AATable data={ids} /> : ''}
        </div>
      </div>
    );
  }
});

function selector (state) {
  return {
    VProMMSids: state.VProMMSidsAnalytics
  };
}

module.exports = connect(selector)(AnalyticsAA);
