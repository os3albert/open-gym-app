module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    import: ['features/support/**/*.ts', 'features/steps/**/*.ts'],
    format: ['progress-bar'],
    publishQuiet: true,
  },
}
