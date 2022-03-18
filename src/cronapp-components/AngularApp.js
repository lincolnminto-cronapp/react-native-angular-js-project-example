let $injector;
const angularApp = angular.module('MyApp');

angularApp.run([
  '$injector',
  (_$injector) => {
    $injector = _$injector;
    console.log('Injector is present');
  },
]);

module.exports = {angularApp};
