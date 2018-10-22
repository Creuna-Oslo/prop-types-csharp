import React from 'react';
import ReactDOM from 'react-dom';

// Both the following components have the same name in their default export statements.
import Component from './func-component';
import DuplicateComponent from './nested-component/func-component';

ReactDOM.render(
  <div>
    <Component />
    <DuplicateComponent />
  </div>,
  document.getElementById('mount-point')
);
