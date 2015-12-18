'use strict';
import React from 'react';
import { connect } from 'react-redux';
import { fetchAdminSubregions } from '../actions/action-creators';
import AADetails from '../components/aa-details';
import PageHeader from '../components/page-header';

var Home = React.createClass({
  propTypes: {
    children: React.PropTypes.object,
    subregions: React.PropTypes.object,
    dispatch: React.PropTypes.func
  },

  componentDidMount: function () {
    this.props.dispatch(fetchAdminSubregions());
  },

  render: function () {
    return (
      <section className='page'>
        <PageHeader
            pageTitle='OR Philippines' />

        <div className='page__body aa'>

          <div className='aa-main'>
            <div className='inner'>
              <div className='col--sec'>
                Something something dark side...
              </div>
              <div className='col--main'>

                <div className='aa-stats'>
                  <nav className='aa-stats__nav'>
                    <ul>
                      <li><a href='#'>Responsibility</a></li>
                      <li className='active'><a href='#'>Condition</a></li>
                      <li><a href='#'>Completeness</a></li>
                      <li><a href='#'>Projects</a></li>
                      <li><a href='#'>Errors</a></li>
                    </ul>
                  </nav>

                  <div className='chart-wrapper'></div>

                  <div className='aa-stats__controls'>
                    <button className='bttn-stats-prev'><span>Previous stat</span></button>
                    <button className='bttn-stats-next'><span>Next stat</span></button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <AADetails
            level={0}
            adminAreas={this.props.subregions.adminAreas}/>
        </div>
      </section>
    );
  }
});

module.exports = connect(state => {
  return {
    subregions: state.adminSubregions
  };
})(Home);
