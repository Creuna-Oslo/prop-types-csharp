import React from 'react';
import PropTypes from 'prop-types';

const Link = ({ text, url }) => <a href={url}>{text}</a>;

Link.propTypes = {
  text: PropTypes.string,
  url: PropTypes.string,
  anotherThing: PropTypes.bool
};

export default Link;
