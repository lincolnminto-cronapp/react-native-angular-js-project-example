
var cronappModules = [
  'ui.router',
  'ui-select-infinity',
  'ui.select',
  'ngResource',
  'ngSanitize',
  'custom.controllers',
  'custom.services',
  'datasourcejs',
  'chart.js',
  'pascalprecht.translate',
  'tmh.dynamicLocale',
  'ui-notification',
  'ui.bootstrap',
  'ngFileUpload',
  'report.services',
  'dashboard.services',
  'upload.services',
  'ui.tinymce',
  'ngCookies',
  'kendo.directives'
];

if (window.customModules) {
  cronappModules = cronappModules.concat(window.customModules);
}

var onloadCallback = function() {
  window.grecaptcha.render('loginRecaptcha');
  window.grecaptcha.reset();
};

var getRequestData = data => {
  let result = data || {};
  if (data.data && typeof data.data === 'object') {
    result = data.data;
  }
  return result;
};

var app = (function() {

  return angular.module('MyApp', cronappModules)
      .constant('LOCALES', {
        'locales': {
          'pt_br': 'Portugues (Brasil)',
          'en_us': 'English'
        },
        'preferredLocale': 'pt_br',
        'urlPrefix': ''
      })
      .config(['$locationProvider', function($locationProvider) {
        $locationProvider.hashPrefix('');
      }])
      .config([
        '$httpProvider',
        function($httpProvider) {
          var interceptor = [
            '$q',
            '$rootScope',
            function($q, $rootScope) {
              var service = {
                'request': function(config) {
                  var _u = JSON.parse(localStorage.getItem('_u'));
                  if (_u && _u.token) {
                    config.headers['X-AUTH-TOKEN'] = _u.token;
                    window.uToken = _u.token;
                  }
                  return config;
                }
              };
              return service;
            }
          ];
          $httpProvider.interceptors.push(interceptor);
        }
      ])
      .config( [
        '$compileProvider',
        function( $compileProvider )
        {
          $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript|chrome-extension):/);
        }
      ])
      .config(function($stateProvider, $urlRouterProvider, NotificationProvider) {
        NotificationProvider.setOptions({
          delay: 5000,
          startTop: 20,
          startRight: 10,
          verticalSpacing: 20,
          horizontalSpacing: 20,
          positionX: 'right',
          positionY: 'top',
          templateUrl: 'node_modules/cronapp-framework-js/components/templates/angular-ui-notification.template.html'
        });
        window.NotificationProviderOptions = NotificationProvider.options;
        window.stateProviderDefine.handle($stateProvider);

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/error/404");
      })
      .factory('originPath', ['$location', function($location) {
        var originPath = {
          request: function(config) {
            config.headers['origin-path'] = $location.path();
            return config;
          }
        };
        return originPath;
      }])
      .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('originPath');
      }])
      .config(function($translateProvider, tmhDynamicLocaleProvider) {

        $translateProvider.uniformLanguageTag('bcp47');
        $translateProvider.useLoader('customTranslateLoader', {
          files: [{
            prefix: 'i18n/locale_',
            suffix: '.json'
          },
            {
              prefix: 'node_modules/cronapp-framework-js/i18n/locale_',
              suffix: '.json'
            },
            {
              prefix: 'node_modules/cronapi-js/i18n/locale_',
              suffix: '.json'
            }]
        });

        $translateProvider
            .registerAvailableLanguageKeys(
                window.translations.localesKeys,
                window.translations.localesRef
            )
            .determinePreferredLanguage();

        var locale = (window.navigator.userLanguage || window.navigator.language).replace('-', '_').toLowerCase();
        $translateProvider.use(locale);
        $translateProvider.preferredLanguage(locale);
        $translateProvider.fallbackLanguage('en_us');

        $translateProvider.useSanitizeValueStrategy('escaped');

        tmhDynamicLocaleProvider.localeLocationPattern('node_modules/angular-i18n/angular-locale_{{locale}}.js');

        if (moment)
          moment.locale(locale);
      })
      .config(function($sceProvider) {
        $sceProvider.enabled(false);
      })

      .directive('crnValue', ['$parse', function($parse) {
        return {
          restrict: 'A',
          require: '^ngModel',
          link: function(scope, element, attr, ngModelCtrl) {
            var evaluatedValue;
            if (attr.value) {
              evaluatedValue = attr.value;
            } else {
              evaluatedValue = $parse(attr.crnValue)(scope);
            }

            element.attr("data-evaluated", JSON.stringify(evaluatedValue));
            element.bind("click", function(event) {
              scope.$apply(function() {
                ngModelCtrl.$setViewValue(evaluatedValue);
                $(element).data('changed', true);
              }.bind(element));
            });

            scope.$watch(function(){return ngModelCtrl.$modelValue}, function(value, old){
              if (value !== old) {
                var dataEvaluated = element.attr("data-evaluated");
                var changed = $(element).data('changed');
                $(element).data('changed', false);
                if (!changed) {
                  if (value && JSON.stringify(''+value) === dataEvaluated) {
                    $(element)[0].checked = true
                  } else {
                    $(element)[0].checked = false;
                  }
                }
              }
            });
          }
        };
      }])

      .decorator("$xhrFactory", [
        "$delegate", "$injector",
        function($delegate, $injector) {
          return function(method, url) {
            var xhr = $delegate(method, url);
            var $http = $injector.get("$http");
            var callConfig = $http.pendingRequests[$http.pendingRequests.length - 1];
            if (angular.isFunction(callConfig.onProgress))
              xhr.upload.addEventListener("progress",callConfig.onProgress);
            return xhr;
          };
        }
      ])
      // General controller
      .controller('PageController', function($controller, $scope, $stateParams, $location, $http, $rootScope, $translate, Notification, UploadService, $timeout, $state, ReportService, DashboardService) {
        // save state params into scope
        $scope.params = $stateParams;
        $scope.$http = $http;
        $scope.Notification = Notification;
        $scope.UploadService = UploadService;
        $scope.$state = $state;

        app.registerEventsCronapi($scope, $translate, $location);

        $("form").kendoValidator({
            errorTemplate: '<span class="k-widget k-tooltip-validation k-x-invalid-msg-block">#=message#</span>',
            messages:{
                required: ''
            }
        });

        $rootScope.getReport = function(reportName, params, config) {
          ReportService.openReport(reportName, params, config);
        };

        $rootScope.getDashboard = function(dashboardName, params, config) {
          DashboardService.openDashboard(dashboardName, params, config);
        };

        // Query string params
        var queryStringParams = $location.search();
        for (var key in queryStringParams) {
          if (queryStringParams.hasOwnProperty(key)) {
            $scope.params[key] = queryStringParams[key];
          }
        }

        try {
          var contextAfterPageController = $controller('AfterPageController', { $scope: $scope });
          app.copyContext(contextAfterPageController, this, 'AfterPageController');
        } catch(e) {}

        $timeout(function () {
          // Verify if the 'afterPageRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
          if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterPageRender && $scope.blockly.events.afterPageRender instanceof Function) {
            $scope.blockly.events.afterPageRender();
          }
        });

      })

      .run(function($rootScope, $state, $stateParams, $timeout, $transitions) {
        // It's very handy to add references to $state and $stateParams to the $rootScope
        // so that you can access them from any scope within your applications.For example,
        // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
        // to active whenever 'contacts.list' or one of its decendents is active.
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        const $stateChangeError = function(error) {
          if (error) {
            const errorMessage = error.toString();
            if (errorMessage.includes('=404')) {
              $state.go('404');
            }
            else if (errorMessage.includes('=403')) {
              $state.go('403');
            }
            else if (errorMessage.includes('=401')) {
              localStorage.removeItem('_u');
              $state.go('loginReturnUrl', { "returnUrl" : window.location.hash });
            } else {
              $state.go('404');
            }
          } else {
            $state.go('404');
          }
        };

        const $stateChangeSuccess = function(currentRoute) {
          $timeout(() => {
            let systemName = $('#projectName').length ? $('#projectName').val() : $('h1:first').length && $('h1:first').text().trim().length ? $('h1:first').text().trim() : '';

            const urlPattern = /\/(?:.(?!\/))+$/gm;
            let currentWindow = window.location.hash;
            let pageName;

            if ((m = urlPattern.exec(currentWindow)) !== null) {
              m.forEach(match => pageName = match);
            } else {
              pageName = currentRoute.name
            }

            let prettyPageName = window.camelCaseToSentenceCase(window.toCamelCase(pageName.replace("/", "")));
            // Get the H1 or H2 text to concat with the App name to set the title page
            if ($('h1.title').length){
              prettyPageName = $('h1.title').text();
            } else if ($('h2.title').length){
              prettyPageName = $('h2.title').text();
            }

            let title = '';

            title = prettyPageName + (systemName.length ? ' - ' + systemName : ''  );

            $rootScope.viewTitle = title || currentRoute.name;
            $rootScope.viewTitleOnly = prettyPageName || currentRoute.name;
            $rootScope.systemName = systemName;
            let $mainLinks = $('.main-nav-link');
            if ($mainLinks && $mainLinks.length && $($('.main-nav-link').get(0)).is(":visible")) {
              $(".main-access").focus();
              // $($('.main-nav-link').get(0)).focus();
              // $($('.main-nav-link').get(0)).blur();
            } else {
              let $inputsMain = $('[role=main]').find('input');
              if ($inputsMain && $inputsMain.length) {
                let cantFocus = ['date', 'datetime', 'time'];
                let $firstInput = $($inputsMain[0]);
                if ( !cantFocus.includes($firstInput.data('type')) ) {
                  $firstInput.focus();
                }
              }
            }

            $rootScope.renderFinished = true;
            registerComponentScripts();
          });
        };

        $transitions.onSuccess({}, (transition) => $stateChangeSuccess(transition.to()));
        $state.defaultErrorHandler(error =>  $stateChangeError(error));

      });

}(window));

app.userEvents = {};

//Configuration
app.config = {};
app.config.datasourceApiVersion = 2;

app.bindScope = function($scope, obj) {
  var newObj = {};

  for (var x in obj) {
    if (typeof obj[x] == 'string' || typeof obj[x] == 'boolean')
      newObj[x] = obj[x];
    else if (typeof obj[x] == 'function')
      newObj[x] = obj[x].bind($scope);
    else {
      newObj[x] = app.bindScope($scope, obj[x]);
    }
  }

  return newObj;
};

app.registerEventsCronapi = function($scope, $translate, $location) {

  let $stateParams = $scope.params || {};
  let queryStringParams = $location && $location.search() || {};
  $scope.params = {};

  let makeCopy = (from, to) => {
      for (let key in from) {
          if (from.hasOwnProperty(key)) {
              to[key] = from[key];
          }
      }
  };
  makeCopy($stateParams, $scope.params);
  makeCopy(queryStringParams, $scope.params);


  for (var x in app.userEvents)
    $scope[x] = app.userEvents[x].bind($scope);

  $scope.vars = {};
  $scope.$evt = $evt;

  try {
    if (cronapi) {
      $scope['cronapi'] = app.bindScope($scope, cronapi);
      $scope['cronapi'].$scope = $scope;
      $scope.safeApply = safeApply;
      if ($translate) {
        $scope['cronapi'].$translate = $translate;
      }
    }
  } catch (e) {
    console.info('Not loaded cronapi functions');
    console.info(e);
  }
  try {
    if (blockly) {
      blockly.cronapi = cronapi;
      $scope['blockly'] = app.bindScope($scope, blockly);
    }
  } catch (e) {
    console.info('Not loaded blockly functions');
    console.info(e);
  }
};

app.copyContext = function(fromContext, toContext, controllerName) {
  if (fromContext) {
    for (var item in fromContext) {
      if (!toContext[item])
        toContext[item] = fromContext[item];
      else
        toContext[item+controllerName] = fromContext[item];
    }
  }
};

app.factory('customTranslateLoader', function ($http, $q) {

  return function (options) {

    if (!options || (!angular.isArray(options.files) && (!angular.isString(options.prefix) || !angular.isString(options.suffix)))) {
      throw new Error('Couldn\'t load static files, no files and prefix or suffix specified!');
    }

    if (!options.files) {
      options.files = [{
        prefix: options.prefix,
        suffix: options.suffix
      }];
    }

    var load = function (file) {
      if (!file || (!angular.isString(file.prefix) || !angular.isString(file.suffix))) {
        throw new Error('Couldn\'t load static file, no prefix or suffix specified!');
      }

      var deferred = $q.defer();

      $http(angular.extend({
        url: [
          file.prefix,
          options.key,
          file.suffix
        ].join(''),
        method: 'GET',
        params: ''
      }, options.$http)).then(function (data) {
        deferred.resolve(getRequestData(data));
      }).catch(function () {
        deferred.resolve({});
      });

      return deferred.promise;
    };

    var deferred = $q.defer(),
        promises = [],
        length = options.files.length;

    for (var i = 0; i < length; i++) {
      promises.push(load({
        prefix: options.files[i].prefix,
        key: options.key,
        suffix: options.files[i].suffix
      }));
    }

    $q.all(promises).then(function (data) {
      var length = data.length,
          mergedData = {};

      for (var i = 0; i < length; i++) {
        for (var key in data[i]) {
          mergedData[key] = data[i][key];
        }
      }

      deferred.resolve(mergedData);

    }, function (data) {
      deferred.reject(data);
    });

    return deferred.promise;
  };

});

window.safeApply = function(fn) {
  var phase = this.$root.$$phase;
  if (phase === '$apply' || phase === '$digest') {
    if (fn && (typeof(fn) === 'function')) {
      fn();
    }
  } else {
    this.$apply(fn);
  }
};

window.toCamelCase = function(str) {
  if (str !== null) {
    // Lower cases the string
    return str.toLowerCase()
    // Replaces any - or _ or . characters with a space
        .replace( /[-_\.]+/g, ' ')
        // Removes any non alphanumeric characters
        .replace( /[^\w\s]/g, '')
        // Uppercases the first character in each group immediately following a space
        // (delimited by spaces)
        .replace( / (.)/g, function($1) { return $1.toUpperCase(); })
        // Removes spaces
        .replace( / /g, '' );
  }
  return str;
};

window.camelCaseToSentenceCase = function(str){
  if (str !== null) {
    let result = str.replace( /([A-Z])/g, " $1" );
    return result.charAt(0).toUpperCase() + result.slice(1); // capitalize the first letter - as an example.
  }
  return str;
};

const keyCodeFormActions = {
  initialize: () => $(document).on("keypress", "form[crn-datasource]", keyCodeFormActions.handle),
  handle: (e) => !keyCodeFormActions[e.keyCode || e.which] || keyCodeFormActions[e.keyCode || e.which](e),
  13: (e) => e.preventDefault()
};
keyCodeFormActions.initialize();

//Components personalization jquery
var registerComponentScripts = function() {
  //carousel slider
  $('.carousel-indicators li').on('click', function() {
    var currentCarousel = '#' + $(this).parent().parent().parent().attr('id');
    var index = $(currentCarousel + ' .carousel-indicators li').index(this);
    $(currentCarousel + ' > div').carousel(index);
  });
};