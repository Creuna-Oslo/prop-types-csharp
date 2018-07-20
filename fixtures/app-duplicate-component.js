import React from 'react';
import ReactDOM from 'react-dom';

import Component from './func-component';
import ClassComponent from './class-component';

// Both the following components have the same name in their default export statements.
import Link from './link';
import AnotherLink from './nested-component/link';

ReactDOM.render(<Component />, document.getElementById('mount-point'));
