'use strict';
import React from 'react';
import _ from 'lodash';
import Search from './search';
import Headerdrop from './headerdrop';
import c from 'classnames';
import { connect } from 'react-redux';
import {
  setSearchType,
  showSearch,
  setLanguage
} from '../actions/action-creators';
import { t, getAvailableLanguages, getLanguage } from '../utils/i18n';
import { Link } from 'react-router';
var SiteHeader = React.createClass({
  displayName: 'SiteHeader',

  propTypes: {
    _showSearch: React.PropTypes.func,
    _setSearchType: React.PropTypes.func,
    _setLanguage: React.PropTypes.func,
    fetchSearchResults: React.PropTypes.func,
    cleanSearchResults: React.PropTypes.func,
    routes: React.PropTypes.array,
    search: React.PropTypes.object,
    pathname: React.PropTypes.string,
    searchType: React.PropTypes.string,
    displaySearch: React.PropTypes.bool
  },

  toggleMenuHandler: function (e) {
    e.preventDefault();
    this.refs.nav.classList.remove('show-search');
    this.refs.nav.classList.toggle('show-menu');
  },

  toggleSearchHandler: function (e) {
    e.preventDefault();
    this.refs.nav.classList.remove('show-menu');
  },

  closeSearch: function () {
    this.refs.nav.classList.remove('show-menu');
  },

  resizeHandler: function () {
    if (document.body.getBoundingClientRect().width > 991) {
      this.refs.nav.classList.remove('show-menu');
    }
  },

  menuClickHandler: function () {
    this.refs.nav.classList.remove('show-menu');
  },

  componentDidMount: function () {
    this.resizeHandler = _.debounce(this.resizeHandler, 200);
    window.addEventListener('resize', this.resizeHandler);
  },

  componentWillUnmount: function () {
    this.refs.toggleMenu.removeEventListener('click', this.toggleMenuHandler);
    window.removeEventListener('resize', this.resizeHandler);
  },

  componentWillReceiveProps: function (nextProps) {
    this.setSearchDisplay(nextProps);
  },

  isSearchAvailable: function (props) {
    let isExplore = new RegExp(/explore/).test(props.pathname);
    let isEditor = new RegExp(/editor/).test(props.pathname);

    return isExplore || isEditor;
  },

  // for the analytics and home page, hide search if open.
  setSearchDisplay: function (nextProps) {
    if (this.props.displaySearch && !this.isSearchAvailable(nextProps)) {
      this.props._showSearch(false);
    }
  },

  displaySearchBar: function () {
    if (this.props.displaySearch) {
      return (
          <div className='site__search'>
            <Search
              searchType={this.props.searchType}
              fetchSearchResults={this.props.fetchSearchResults}
              cleanSearchResults={this.props.cleanSearchResults}
              onResultClick={this.closeSearch}
              results={this.props.search.results}
              query={this.props.search.query}
              fetching={this.props.search.fetching}
              searching={this.props.search.searching} />
          </div>
      );
    } else {
      return (<div/>);
    }
  },

  render: function () {
    return (
      <header className='site__header' ref={(header) => this.header = header }>
        <div className='inner'>
          <div className='site__headline'>
            <h1 className='site__title'>
              <Link to={`/${getLanguage()}`}>
                <img src='assets/graphics/layout/openroads-vn-logo-hor-neg.svg' width='736' height='96' alt='OpenRoads Vietnam logo' /><span>OpenRoads</span> <strong>Vietnam</strong>
              </Link>
            </h1>
          </div>
          <nav className='site__nav' role='navigation' ref='nav'>

            <div className='site__nav-block site__nav-block--language'>
              <h2 className='site__menu-toggle'><a href='#menu-block-language'><span>{t('Language')}</span></a></h2>
              <div className='site__menu-block' id='menu-block-language'>
                <ul className='site__menu'>
                  <li><a href='#' className='site__menu-item' activeClassName='site__menu-item--active' title={t('Change language')}>{t('English')}</a></li>
                  <li><a href='#' className='site__menu-item' activeClassName='site__menu-item--active' title={t('Change language')}>{t('Vietnamese')}</a></li>
                </ul>
              </div>
            </div>

            <div className='site__nav-block site__nav-block--global'>
              <h2 className='site__menu-toggle'><a href='#menu-block-global'><span>{t('Menu')}</span></a></h2>
              <div className='site__menu-block' id='menu-block-global'>
                <ul className='site__menu'>
                  <li><Link to={`/${getLanguage()}/analytics`} className='site__menu-item' activeClassName='site__menu-item--active' onClick={this.menuClickHandler} title={t('Visit')}>{t('Analytics')}</Link></li>
                  <li>
                    <Link to={`/${getLanguage()}/explore`} className='site__menu-item' activeClassName='site__menu-item--active' onClick={this.menuClickHandler} title={t('Visit')}>
                      <span>{t('Explore')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link to={`/${getLanguage()}/editor`} className='site__menu-item' activeClassName='site__menu-item--active' onClick={this.menuClickHandler} title={t('Visit')}>
                      <span>{t('Editor')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link to={`/${getLanguage()}/tasks`} className='site__menu-item' activeClassName='site__menu-item--active' onClick={this.menuClickHandler} title={t('Visit')}>
                      <span>{t('Tasks')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link to={`/${getLanguage()}/upload`} className='site__menu-item' activeClassName='site__menu-item--active' onClick={this.menuClickHandler} title={t('Visit')}>
                      <span>{t('Upload')}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            {/* 
            <div className='menu-wrapper'>
              <Headerdrop
                id='lang-switcher'
                triggerClassName='drop-toggle caret change-lang-button site__lang'
                triggerText={t('Language')}
                triggerElement='a'
                direction='down'
                alignment='right'>
                <ul className='drop-menu drop-menu--select' role='menu'>
                {
                  getAvailableLanguages().map(l => {
                    let cl = c('drop-menu-item', {
                      'drop-menu-item--active': l.key === getLanguage()
                    });
                    let url = this.props.pathname.replace(`/${getLanguage()}`, `/${l.key}`);
                    return (
                      <li key={l.key}>
                        <Link to={url}
                          title={t('Select language')}
                          onClick={(e) => { this.props._setLanguage(l.key); }}
                          className={cl} data-hook='dropdown:close'>
                          {l.name}
                        </Link>
                      </li>
                    );
                  })
                  }
                </ul>
              </Headerdrop>

            </div>
            */} 
          </nav>
        </div>
      </header>
    );
  }
});

function selector (state) {
  return {
    displaySearch: state.searchDisplay.show,
    searchType: state.setSearchType.searchType
  };
}

function dispatcher (dispatch) {
  return {
    _showSearch: (bool) => dispatch(showSearch(bool)),
    _setSearchType: (searchType) => dispatch(setSearchType(searchType)),
    _setLanguage: (lang) => dispatch(setLanguage(lang))
  };
}

module.exports = connect(selector, dispatcher)(SiteHeader);
