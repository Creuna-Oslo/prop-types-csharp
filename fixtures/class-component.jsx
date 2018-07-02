/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import pt from 'prop-types';

import Link from 'components/link';

const enumArray = ['value-1', 'value-2'];
const enumObject = {
  valueA: 'value-a',
  valueB: 'value-b'
};

export default class Component extends React.Component {
  static propTypes = {
    text: pt.string.isRequired,
    isSomething: pt.bool,
    intNumber: pt.number,
    floatNumber: pt.number,
    texts: pt.arrayOf(pt.string),
    singleObject: pt.shape({
      propertyA: pt.string.isRequired
    }),
    objects: pt.arrayOf(
      pt.shape({
        propertyB: pt.string
      })
    ).isRequired,
    externalType: pt.shape(Link.propTypes),
    externalTypeList: pt.arrayOf(pt.shape(Link.propTypes)),
    enumArray: pt.oneOf(enumArray).isRequired,
    enumInline: pt.oneOf([1, 2]),
    enumObject: pt.oneOf(Object.keys(enumObject)),

    // These should be excluded
    instance: pt.instanceOf(Link),
    excludeMe: pt.number,
    node: pt.node,
    element: pt.element,
    function: pt.func
  };

  static propTypesMeta = {
    intNumber: 'int',
    floatNumber: 'float',
    excludeMe: 'exclude'
  };

  render() {
    return <div />;
  }
}

// export default Component;
