const fs = require('fs');
const path = require('path');

const components = {
  classComponent: 'class-component.jsx',
  funcComponent: 'func-component.jsx'
};

const classes = {
  classComponent: 'class-component.cs',
  funcComponent: 'func-component.cs'
};

module.exports = {
  components: Object.entries(components).reduce(
    (accum, [key, filename]) =>
      Object.assign(accum, {
        [key]: fs.readFileSync(path.join(__dirname, filename), 'utf-8')
      }),
    {}
  ),
  classes: Object.entries(classes).reduce(
    (accum, [key, filename]) =>
      Object.assign(accum, {
        [key]: fs.readFileSync(
          path.join(__dirname, 'classes', filename),
          'utf-8'
        )
      }),
    {}
  )
};
