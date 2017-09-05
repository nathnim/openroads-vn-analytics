'use strict';
import React from 'react';
import { connect } from 'react-redux';
import { push, replace } from 'react-router-redux';
import { setGlobalZoom } from '../actions/action-creators';
import { getLanguage } from '../utils/i18n';
import config from '../config';

var Editor = React.createClass({
  displayName: 'Editor',

  propTypes: {
    params: React.PropTypes.object,
    dispatch: React.PropTypes.func,
    _setGlobalZoom: React.PropTypes.func,
    globX: React.PropTypes.number,
    globY: React.PropTypes.number,
    globZ: React.PropTypes.number
  },

  // /////////////////////////////////////////////////////////////////////////////
  // / Message listener (postMessage)
  // /
  // / When receiving a message form the iframe, process the url and set it.
  // / The url now becomes shareable. The action to take on the url will depend on
  // / the app.
  // /
  // / The switch is done based on the app id, defined when the OR_frame_notifier
  // / is included.
  // /
  // /
  // / What this actually does:
  // / When a the iframe's url changes it is sent via postMessage to the parent. It
  // / removes the base portion on the url (defined in the config) and stores
  // / the rest:
  // / - Url on the "editor" changes to:
  // /     http://devseed.com/editor/#background=something
  // / - Prefix is removed resulting in:
  // /     #background=something
  // / - Appended to the current url:
  // /     http://devseed.com/openroads/#/editor/background=something
  // / - When entering the page, everything after (/#/editor/)
  // /   is sent to the iframe alongside the proper prefix.
  // /
  messageListener: function (e) {
    if (e.data.type === 'urlchange') {
      switch (e.data.id) {
        case 'or-editor':
          var hash = this.cleanUrl(e.data.url, config.editorUrl);
          this.props._setGlobalZoom(hash);
          this.props.dispatch(replace(`/${getLanguage()}/editor/${hash}`));
          break;
      }
    } else if (e.data.type === 'navigate') {
      switch (e.data.id) {
        case 'or-editor':
          this.props.dispatch(push(e.data.url));
          break;
      }
    }
  },

  cleanUrl: function (url, base) {
    return url.replace(new RegExp(`(http:|https:)?${base}/?#?`), '');
  },

  componentDidMount: function () {
    window.addEventListener('message', this.messageListener, false);
  },

  componentWillUnmount: function () {
    window.removeEventListener('message', this.messageListener, false);
  },

  shouldComponentUpdate: function () {
    return false;
  },

  render: function () {
    var globalZoomHash = `map=${this.props.globZ.toString()}/${this.props.globX.toString()}/${this.props.globY.toString()}`;
    var path = config.editorUrl + `#${globalZoomHash}`;
    return (
       <iframe src={path} id='main-frame' name='main-frame'></iframe>
    );
  }
});

function selector (state) {
  return {
    globX: state.globZoom.x,
    globY: state.globZoom.y,
    globZ: state.globZoom.z
  };
}

function dispatcher (dispatch) {
  return {
    dispatch,
    _setGlobalZoom: function (url) { dispatch(setGlobalZoom(url)); }
  };
}

module.exports = connect(selector, dispatcher)(Editor);
