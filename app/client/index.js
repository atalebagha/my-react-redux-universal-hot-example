/**
 * THIS IS THE ENTRY POINT FOR THE CLIENT, JUST LIKE server.js IS THE ENTRY POINT FOR THE SERVER.
 */
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import createStore from '../shared/redux/store/createStore';
import SimpleIsoFetch, { syncBindingsWithStore } from 'simple-iso-fetch';
import io from 'socket.io-client';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ReduxAsyncConnect } from 'redux-async-connect';
import useScroll from 'scroll-behavior/lib/useStandardScroll';

// bring in routes
import getRoutes from '../shared/routes';

// set base url for client-side requests
SimpleIsoFetch.setBaseUrl('/api');

// create SimpleIsoFetch instance
const simpleIsoFetch = new SimpleIsoFetch();

const _browserHistory = useScroll(() => browserHistory)();
const dest = document.getElementById('content');
const store = createStore(_browserHistory, simpleIsoFetch, window.__data);
syncBindingsWithStore(simpleIsoFetch, store); // attaches function bindings to state
const history = syncHistoryWithStore(_browserHistory, store); // attaches routing to state

function initSocket() {
  const socket = io('', {path: '/ws'});
  socket.on('news', (data) => {
    console.log(data);
    socket.emit('my other event', { my: 'data from client' });
  });
  socket.on('msg', (data) => {
    console.log(data);
  });

  return socket;
}

global.socket = initSocket();

const component = (
  <Router history={history}
          render={props =>
            <ReduxAsyncConnect {...props} helpers={{client: simpleIsoFetch}} filter={item => !item.deferred}/>}>
    {getRoutes(store)}
  </Router>
);

ReactDOM.render(
  <Provider store={store} key='provider'>
    {component}
  </Provider>,
  dest
);

if (process.env.NODE_ENV !== 'production') {
  window.React = React; // enable debugger

  if (!dest || !dest.firstChild || !dest.firstChild.attributes || !dest.firstChild.attributes['data-react-checksum']) {
    console.error('Server-side React render was discarded. Make sure that your initial render does not contain any client-side code.');
  }
}

if (__DEVTOOLS__ && !window.devToolsExtension) {
  const DevTools = require('../shared/redux/devTools');
  ReactDOM.render(
    <Provider store={store} key='provider'>
      <div>
        {component}
        <DevTools />
      </div>
    </Provider>,
    dest
  );
}
