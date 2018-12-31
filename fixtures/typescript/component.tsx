/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { PropTypesMeta } from '../../prop-types-meta';

import { Link } from './link';

enum EnumObject {
  ValueA = 'value-a',
  ValueB = 'value-b'
}

type ComponentProps = {
  text: string;
  isSomething?: boolean;
  number?: number;
  intNumber?: number;
  floatNumber?: number;
  texts?: string[];
  singleObject?: {
    propertyA: string;
  };
  objects: { propertyB: string }[];
  objectArray: Link[];
  nestedList?: string[][][];
  nestedExclude?: {
    a: string;
  };
  nestedNumber?: number[][][];
  nestedShape?: {
    a?: {
      b?: {
        c?: string;
      };
    };
  };
  link?: Link;
  linkList?: Link[];
  linkMeta?: Link;
  linkListMeta?: Link[];
  requiredEnum: EnumObject;
  optionalEnum?: EnumObject;

  // These should be excluded
  excludeMe: number;
  node: JSX.Element;
  function: () => void;
  shapeExclude?: { a: string };
};

class Component extends React.Component<ComponentProps> {
  static propTypes = {};

  static propTypesMeta: PropTypesMeta<ComponentProps> = {
    intNumber: 'int',
    floatNumber: 'float',
    excludeMe: 'exclude',
    shapeExclude: 'exclude',
    nestedExclude: {
      a: 'exclude'
    },
    nestedNumber: [[['float']]]
  };

  render() {
    return <div />;
  }
}

export default Component;
