window.stateProviderDefine = {
  handle: (s) => {
    if (window.customStateProvider) {
      window.customStateProvider(s);
    }
    else {
      let type = $('script[src*=app\\.js]')[0].src.split("type=")[1] === "withAuth" ? "withAuth" : "withoutAuth";
      !window.stateProviderDefine[type] || window.stateProviderDefine[type](s);
    }
  },
  withAuth: (s) => {
    s
    .state('login', {
      url: "",
      controller: 'LoginController',
      templateUrl: 'views/login.view.html'
    })

    .state('loginReturnUrl', {
      url: "/?:returnUrl",
      controller: 'LoginController',
      templateUrl: 'views/login.view.html'
    })

    .state('signup', {
      url: "/public/signup",
      controller: 'SignupController',
      templateUrl: 'views/public/signup.view.html'
    })

    .state('reset-password', {
      url: "/public/reset-password",
      controller: 'ResetPasswordController',
      templateUrl: 'views/public/reset-password.view.html'
    })

    .state('social', {
      url: "/connected",
      controller: 'SocialController',
      templateUrl: 'views/login.view.html'
    })

    .state('socialError', {
      url: "/notconnected",
      controller: 'SocialController',
      templateUrl: 'views/login.view.html'
    })

    .state('main', {
      url: "/",
      controller: 'LoginController',
      templateUrl: 'views/login.view.html'
    })

    .state('publicRoot', {
      url: "/public/{name:.*}",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/public/' + urlattr.name + '.view.html';
      }
    })

    .state('public', {
      url: "/home/public",
      controller: 'PublicController',
      templateUrl: function(urlattr) {
        return 'views/public/home.view.html';
      }
    })

    .state('public.pages', {
      url: "/{name:.*}",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/public/' + urlattr.name + '.view.html';
      }
    })

    .state('home', {
      url: "/home",
      controller: 'HomeController',
      templateUrl: 'views/logged/home.view.html',
      resolve: {
        data: ["$translate", function($translate) {
          $translate.refresh();
        }]
      }
    })

    .state('home.pages', {
      url: "/{name:.*}",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/' + urlattr.name + '.view.html';
      }
    })

    .state('404', {
      url: "/error/404",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/error/404.view.html';
      }
    })

    .state('403', {
      url: "/error/403",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/error/403.view.html';
      }
    });
  },
  withoutAuth: (s) => {
    s
    .state('index', {
      url: "",
      controller: 'HomeController',
      templateUrl: 'views/home.view.html'
    })

    .state('main', {
      url: "/",
      controller: 'HomeController',
      templateUrl: 'views/home.view.html'
    })

    .state('home', {
      url: "/home",
      controller: 'HomeController',
      templateUrl: 'views/home.view.html'
    })

    .state('home.pages', {
      url: "/{name:.*}",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/' + urlattr.name + '.view.html';
      }
    })

    .state('404', {
      url: "/error/404",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/error/404.view.html';
      }
    })

    .state('403', {
      url: "/error/403",
      controller: 'PageController',
      templateUrl: function(urlattr) {
        return 'views/error/403.view.html';
      }
    });
  }
};