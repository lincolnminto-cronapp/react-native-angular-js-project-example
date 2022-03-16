(function($app) {
  angular.module('custom.controllers', []);

  // refresh token
  var refreshToken = function ($http, success, error) {
    $http({
      method: 'GET',
      url: 'auth/refresh'
    }).then(function (data, status, headers, config) {
      data = getRequestData(data);
      //Keeping the user information, the auth/refresh only has name and username info
      if (localStorage.getItem("_u")) {
        let currentSession = JSON.parse(localStorage.getItem("_u"));
        if (currentSession.user.username === data.user.username)
          data.user = currentSession.user;
      }
      // Store data response on local storage
      localStorage.setItem("_u", JSON.stringify(data));
      // Recussive
      setTimeout(function () {
        refreshToken($http, success, error);
        // refresh time
      }, (1800 * 1000));
      success();
    }).catch(function () {
      error();
    });
  };

  app.controller('ResetPasswordController', function($scope, $translate, Notification, $location, $http, $state) {
    $scope.resetPassword = function () {
      if (passwordNew.value === '') {
        Notification.error($translate.instant('ResetPasswordNewCanNotBeEmpty'));
        return;
      }

      if (passwordConfirmation.value === '') {
        Notification.error($translate.instant('ResetPasswordConfirmationCanNotBeEmpty'));
        return;
      }

      if (passwordNew.value !== passwordConfirmation.value) {
        Notification.error($translate.instant('ResetPasswordDoesNotMatch'));
        return;
      }

      $http({
        method: 'POST',
        url: 'auth/confirm-reset-password',
        data: $.param({password: passwordNew.value}),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-AUTH-TOKEN': $location.search().token
        }
      }).then(() => {
        Notification.info($translate.instant('ResetPasswordSuccess'));
        passwordNew.value = "";
        passwordConfirmation.value = "";
        $state.go('login');
      }).catch(data =>  {
        let errorMessage = $translate.instant('ResetPasswordDoesNotMatch');
        if (data && data.data) {
          errorMessage = data.data.message || data.data.error;
        }
        Notification.error(errorMessage);
      });
    }
  });

  app.controller('SignupController' , function($controller, $scope, $stateParams, $location, $http, $rootScope, $translate, Notification, UploadService, $timeout, $state, ReportService) {

    app.registerEventsCronapi($scope, $translate);

    $scope.cronapi.screen.changeValueOfField('vars.signupEmail','');
    $scope.cronapi.screen.changeValueOfField('vars.signupUsername','');
    $scope.cronapi.screen.changeValueOfField('vars.signupPassword','');
    $scope.cronapi.screen.changeValueOfField('vars.signupConfirmPassword','');

  });

  app.controller('LoginController', function($controller, $scope, $http, $rootScope, $window, $state, $translate, Notification, ReportService, UploadService, $location, $stateParams, $timeout, $cookies, $templateCache, DashboardService) {

    $http.get(window.NotificationProviderOptions.templateUrl, {cache: true})
        .then((response) => $templateCache.put(window.NotificationProviderOptions.templateUrl, response.data));

    $scope.goHome = () => {
      let returnUrl = cronapi.screen.getParam('returnUrl');
      if (returnUrl) {
        window.location.hash = returnUrl;
      }
      else {
        $state.go('home');
      }
      $scope.cronapi.forceCloseAllModal();
    };

    $scope.$http = $http;
    $scope.params = $stateParams;
    $scope.$state = $state;
    app.registerEventsCronapi($scope, $translate, $location);

    $rootScope.http = $http;
    $rootScope.Notification = Notification;
    $rootScope.UploadService = UploadService;

    $rootScope.getReport = function(reportName, params, config) {
      ReportService.openReport(reportName, params, config);
    };

    $rootScope.getDashboard = function(dashboardName, params, config) {
      DashboardService.openDashboard(dashboardName, params, config);
    };

    $scope.redirectToLogin = function() {
      $scope.cronapi.social.ssoLogin();
    };
    $scope.autoLogin = function(){
      if(localStorage.getItem('_u') && JSON.parse(localStorage.getItem('_u')).token ){
        refreshToken($http, function(){
          $scope.goHome();
        }, function(){
          localStorage.removeItem('_u');
        })
      }
    };
    $scope.autoLogin();
    if (localStorage.getItem('redir_mob')) {
      localStorage.removeItem('redir_mob');
      $window.location.href = '/mobileapp';
    }
    if ($cookies.get('_u')) {
      if (!localStorage.getItem('_u')) {
        var decodedUser = decodeURIComponent($cookies.get('_u'));
        localStorage.setItem("_u", decodedUser);
      }
      $scope.goHome();
    }
    $scope.message = {};
    $scope.renderRecaptcha = function(){
      window.grecaptcha.render('loginRecaptcha');
      window.grecaptcha.reset();
    };
    $scope.login = function(username, password, token) {
      $scope.message.error = undefined;
      if($('form').find('*[class=g-recaptcha]').length){
        if(!$scope.captcha_token && $('form').find('*[class=g-recaptcha]').attr("data-sitekey")=== ""){
          Notification.error($translate.instant('Login.view.EmptySiteKeyCaptcha'));
          return;
        }
        $scope.captcha_token = window.grecaptcha.getResponse();
        if(!$scope.captcha_token && $('form').find('*[class=g-recaptcha]').attr("data-size") !== "invisible"){
          Notification.error($translate.instant('Login.view.InvalidCaptcha'));
          return;
        }
        else if($('form').find('*[class=g-recaptcha]').attr("data-size") === "invisible"){
          window.grecaptcha.execute();
        }
      }
      var user = {
        username : username?username:$scope.username.value,
        password : password?password:$scope.password.value,
        recaptchaToken : $scope.captcha_token ? $scope.captcha_token : undefined
      };

      var headerValues = {
        'Content-Type' : 'application/x-www-form-urlencoded'
      };

      if (token) {
        headerValues["X-AUTH-TOKEN"] = token;
      }

      $http({
        method : 'POST',
        url : 'auth',
        data : $.param(user),
        headers : headerValues
      }).then(handleSuccess).catch(handleError);
    };

    $scope.forgotPassword = function () {
      if (forgotPasswordEmail.value === '') {
        Notification.error($translate.instant('ForgotPasswordEmailCanNotBeEmpty'));
        return;
      }

      if (!forgotPasswordEmail.validity.valid) {
        Notification.error($translate.instant('ForgotPasswordEmailInvalid'));
        return;
      }

      $http({
        method: 'POST',
        url: 'auth/reset-password',
        data: $.param({email: forgotPasswordEmail.value}),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(() => {
        Notification.info($translate.instant('ForgotPasswordSent'));
        forgotPasswordEmail.value = "";
        $("#forgotPasswordModal").modal("hide");
      }).catch(data => Notification.error(data));
    };

    function handleSuccess(data, status, headers, config) {
      data = getRequestData(data);
      // Store data response on session storage
      // The local storage will be cleaned when the browser window is closed
      if(typeof (Storage) !== "undefined") {
        // save the user data on localStorage
        localStorage.setItem("_u", JSON.stringify(data));
        $rootScope.session = JSON.parse(localStorage._u);
      }
      else {
        // Sorry! No Web Storage support.
        // The home page may not work if it depends
        // on the logged user data
      }

      // Redirect to home page
      $scope.goHome();

      // Verify if the 'onLogin' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.onLogin && $scope.blockly.events.onLogin instanceof Function) {
        $scope.blockly.events.onLogin();
      }
    }

    function handleError(data, status, headers, config) {
      status = status || data.status;
      data = getRequestData(data);
      let error;
      if (data !== null && data.message) {
        let message = JSON.parse(data.message);
        error = message.exception
      } else if (typeof data === 'string' && status !== 502) {
        error = data;
        if (!error && status === 401) {
          error = $translate.instant('Login.view.invalidPassword');
        }
      } else {
        error = $translate.instant('Admin.server.out');
      }
      Notification.error(error);
    }

    try {
      var contextAfterLoginController = $controller('AfterLoginController', { $scope: $scope });
      app.copyContext(contextAfterLoginController, this, 'AfterLoginController');
    } catch(e) {}

    $timeout(function () {
      // Verify if the 'afterLoginRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterLoginRender && $scope.blockly.events.afterLoginRender instanceof Function) {
        $scope.blockly.events.afterLoginRender();
      }
    });

  });

  app.controller('HomeController', function($controller, $scope, $http, $rootScope, $state, $translate, Notification, ReportService, UploadService, $location, $stateParams, $timeout, DashboardService) {

    $scope.$http = $http;
    $scope.params = $stateParams;
    $scope.$state = $state;
    app.registerEventsCronapi($scope, $translate, $location);

    $rootScope.http = $http;
    $rootScope.Notification = Notification;
    $rootScope.UploadService = UploadService;

    $rootScope.getReport = function(reportName, params, config) {
      ReportService.openReport(reportName, params, config);
    };

    $rootScope.getDashboard = function(dashboardName, params, config) {
      DashboardService.openDashboard(dashboardName, params, config);
    };

    var idleMonitor = function(timer){
        let userIsIdle = false;
        let userIdleTime = new Date().getTime();

        var notifyIdle = function() {
           if (!userIsIdle) {
             userIsIdle = true;
             console.log("User is Idle");
             try {
               $scope.logout();
             } catch (e) {
               console.log(e)
             }
           }
         }

         var resetIdleTimer = function() {
           userIdleTime = new Date().getTime();
           if (userIsIdle) {
             console.log("User is Back");
           }
           userIsIdle = false;
         }

         var monitorIdleWindow = function(win) {
           win.onload = resetIdleTimer;
           win.onmousemove = resetIdleTimer;
           win.onmousedown = resetIdleTimer;
           win.ontouchstart = resetIdleTimer;
           win.onclick = resetIdleTimer;
           win.onkeypress = resetIdleTimer;
           win.addEventListener('scroll', resetIdleTimer, true);
           resetIdleTimer();
         }

         if(timer && timer > 0){
           monitorIdleWindow(window);
           setInterval(() => {
             if (new Date().getTime() - userIdleTime > (60000 * timer)) {
               notifyIdle();
             }
           }, 1000);
         }
     }

    cronapp.ioc.getInstance(cronapp.configuration.IConfigurationService).getValue("cronapp.framework.auth.idletime").then(idleMonitor);

    $scope.message = {};

    $scope.selecionado = {
      valor : 1
    };

    if ($scope.$state.get().filter(f => f.controller === "LoginController").length === 0) {
      //TO THE NON-PEOPLE:
      //Do not assign the condition directly to the "ignoreAuth" variable,
      //as there may be a login controller and still want to bypass authentication
      $scope.ignoreAuth = true;
    }

    $rootScope.session = (localStorage.getItem('_u') !== undefined) ? JSON.parse(localStorage.getItem('_u')) : null;

    if($rootScope.session) {
      // When access home page we have to check
      // if the user is authenticated and the userData
      // was saved on the browser's localStorage
      $rootScope.myTheme = '';
      if ($rootScope.session.user)
        $rootScope.myTheme = $rootScope.session.user.theme;
      $scope.$watch('myTheme', function(value) {
        if(value !== undefined && value !== "") {
          $('#themeSytleSheet').attr('href', "node_modules/cronapp-framework-js/css/themes/" + value + ".min.css");
        }
      });
      if(localStorage.getItem('_u') && JSON.parse(localStorage.getItem('_u')).token){
        refreshToken($http,function(){},function(){
          localStorage.removeItem('_u');
          $state.go('login');
        })
      }
    }
    else {
      if (!$scope.ignoreAuth) {
        localStorage.removeItem("_u");
        window.location.href = "";
      }
    }

    $rootScope.logout = function logout() {
      $http({
        method : 'GET',
        url : 'logout',
        headers : {
          'Content-Type' : 'application/json'
        }
      }).then(clean).catch(clean);

      function clean(result) {
        result = getRequestData(result);
        $rootScope.session = {};
        if(typeof (Storage) !== "undefined") {
          localStorage.removeItem("_u");
        }

        // In case a logoutUri is defined, after Cronapp logout user is redirected to the logoutUri
        if (result && result.logoutUri) {
          window.location.href = result.logoutUri;
        } else {
          window.location.href = "";
        }
      }
    };

    $scope.changePassword = function() {
      if(verifyCredentials()) {
        var user = {
          oldPassword : oldPassword.value,
          newPassword : newPassword.value,
          newPasswordConfirmation : newPasswordConfirmation.value
        };

        $http({
          method : 'POST',
          url : 'changePassword',
          data : $.param(user),
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
          }
        }).then(changeSuccess).catch(changeError);
      }

      function changeSuccess(data, status, headers, config) {
        Notification.info($translate.instant('Home.view.passwordChanged'));
        cleanPasswordFields();
      }

      function changeError(data, status, headers, config) {
        status = status || data.status;
        data = getRequestData(data);
        var error;

        if (status === 422) {
          error = data;
        } else if (status >= 401) {
          error = $translate.instant('Home.view.InvalidPassword');
        } else {
          error = data;
        }

        Notification.error(error);
      }

      function cleanPasswordFields() {
        oldPassword.value = "";
        newPassword.value = "";
        newPasswordConfirmation.value = "";
        $("#modalPassword").modal("hide");
      }

      function verifyCredentials() {
        if(oldPassword.value === "" || newPassword.value === "" || newPasswordConfirmation.value === "") {
          if(newPasswordConfirmation.value === "") {
            Notification.error($translate.instant('Home.view.ConfirmationPasswordCanNotBeEmpty'));
          }
          if(newPassword.value === "") {
            Notification.error($translate.instant('Home.view.NewPasswordCanNotBeEmpty'));
          }
          if(oldPassword.value === "") {
            Notification.error($translate.instant('Home.view.PreviousPasswordCanNotBeEmpty'));
          }
          return false;
        }
        return true;
      }
    };

    var closeMenuHandler = function() {
      var element = $(this);
      if(element.closest('.sub-menu').length > 0) {
        element.closest(".navbar-nav").collapse('hide');
      }
    };

    $scope.$on('$viewContentLoaded', function() {
      var navMain = $(".navbar-nav");

      // Here your view content is fully loaded !!
      navMain.off("click", "a", closeMenuHandler);
      navMain.on("click", "a", closeMenuHandler);
    });

    $scope.themes = [ "material","cerulean", "cosmo", "cyborg", "darkly", "flatly", "journal", "lumen", "paper", "readable", "sandstone", "simplex", "slate", "spacelab", "superhero", "united", "yeti"];

    $scope.changeTheme = function(theme) {
      if(theme !== undefined) {
        $('body').append('<div id="transition" />');
        $('#transition').css({
          'background-color' : '#FFF',
          'zIndex' : 100000,
          'position' : 'fixed',
          'top' : '0px',
          'right' : '0px',
          'bottom' : '0px',
          'left' : '0px',
          'overflow' : 'hidden',
          'display' : 'block'
        });
        $('#transition').fadeIn(800, function() {
          $('#themeSytleSheet').attr('href', "node_modules/cronapp-framework-js/css/themes/" + theme + ".min.css");
          $rootScope.myTheme = theme;
          $('#transition').fadeOut(1000, function() {
            $('#transition').remove();
          });
        });

        var user = {
          theme : theme
        };

        $http({
          method : 'POST',
          url : 'changeTheme',
          data : $.param(user),
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
          }
        }).then(changeSuccess).catch(changeError);

        function changeSuccess(data, status, headers, config) {
          $rootScope.session.theme = theme;
          $rootScope.session.user.theme = theme;
          localStorage.setItem("_u", JSON.stringify($rootScope.session));
        }

        function changeError(data, status, headers, config) {
          var error = getRequestData(data);
          Notification.error(error);
        }
      }
    };
    try {
      var contextAfterHomeController = $controller('AfterHomeController', { $scope: $scope });
      app.copyContext(contextAfterHomeController, this, 'AfterHomeController');
    } catch(e) {}

    $timeout(function () {
      // Verify if the 'afterHomeRender' event is defined and it is a function (it can be a string pointing to a non project blockly) and run it.
      if ($scope.blockly && $scope.blockly.events && $scope.blockly.events.afterHomeRender && $scope.blockly.events.afterHomeRender instanceof Function) {
        $scope.blockly.events.afterHomeRender();
      }
    });

  });

  app.controller('PublicController', function($controller, $scope) {
    $scope.ignoreAuth = true;
    angular.extend(this, $controller('HomeController', {
      $scope: $scope
    }));
  });

  app.controller('SocialController', function($controller, $scope, $location) {
    $scope.checkSocial = true;
    angular.extend(this, $controller('LoginController', {
      $scope: $scope
    }));

    var queryStringParams = $location.search();
    var params = {};
    for (var key in queryStringParams) {
      if (queryStringParams.hasOwnProperty(key)) {
        params[key] = queryStringParams[key];
      }
    }

    let logoutUri = params["logoutUri"];

    if (logoutUri) {
      window.localStorage.setItem("logoutUri", logoutUri);
    } else {
      window.localStorage.removeItem("logoutUri");
    }

    $scope.login("#OAUTH#", "#OAUTH#", params["_ctk"]);
  });

}(app));

window.safeApply = function(fn) {
  var phase = this.$root.$$phase;
  if(phase === '$apply' || phase === '$digest') {
    if(fn && (typeof (fn) === 'function')) {
      fn();
    }
  }
  else {
    this.$apply(fn);
  }
};

