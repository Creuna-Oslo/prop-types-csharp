module.exports = typeName => {
  const names = {
    bool: 'Boolean',
    float: 'Float',
    int: 'Int',
    string: 'String'
  };

  return names[typeName] || typeName;
};
