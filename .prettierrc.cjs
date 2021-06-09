const gtsConfig = require('gts/.prettierrc.json')
const _ = require('lodash')

const modifiedConfig = _.merge(
  {},
  gtsConfig,
  {
    // Print semicolons at the ends of statements.
    semi: true,
    // Include parentheses around a sole arrow function parameter (x => x).
    arrowParens: 'avoid',
    // Specify the line length that the printer will wrap on.
    printWidth: 120,
  }
)

module.exports = modifiedConfig
