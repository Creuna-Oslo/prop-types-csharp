import React from 'react';
import ReactDOM from 'react-dom';

import Component from './func-component';
import ClassComponent from './class-component';

ReactDOM.render(
  <div>
    <Component />
    <ClassComponent />
  </div>,
  document.getElementById('mount-point')
);
