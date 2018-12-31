/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import pt from 'prop-types';

const FunctionalComponent = props => <div>{props.text}</div>;

FunctionalComponent.propTypes = {
  text: pt.string.isRequired
};

export default FunctionalComponent;
