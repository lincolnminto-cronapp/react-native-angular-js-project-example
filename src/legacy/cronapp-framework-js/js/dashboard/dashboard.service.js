(function($app) {
  angular.module('dashboard.services', []).service('DashboardService', function($http, $compile, $modal, $translate, $window, $rootScope) {
    var body = $('body');
    var scope = angular.element(body.get(0)).scope();
    var scriptsStimulsoft = [
      'node_modules/cronapp-lib-js/dist/js/stimulsoft/stimulsoft-all.js',
      'node_modules/cronapp-lib-js/dist/js/stimulsoft/stimulsoft-helper.js'
    ];

    var loadedScripts = [];

    // data
    this.getDashboard = function(dashboardName) {
      var req = {
        url : 'api/rest/dashboard',
        method : 'POST',
        data : angular.toJson({
          'dashboardName' : dashboardName
        })
      };
      return $http(req);
    };

    this.getContentAsString = function(dashboard) {
      var req = {
        url : 'api/rest/dashboard/contentasstring',
        method : 'POST',
        data : angular.toJson(dashboard)
      };
      return $http(req);
    };

    this.openURLContent = function(url) {

      // If Device is Mobile do not open modal. Open Report in new tab.
      if(url && isMobile()) {
        openReportOnMobile(url);
        return;
      }

      var include = function() {
        var frame = $('<iframe/>');
        frame.attr('frameborder', 0);
        var h = parseInt($(window).height());

        frame.attr('height', h - 200);
        frame.attr('width', '100%');
        frame.attr('src', url + "?download=false");
        var m = $('#reportView .modal-body');
        if(m.get(0)) {
          m.html(frame);
          $('#dashboardViewContext .modal-dialog').css('width', '95%');
          setTimeout(function() {
            console.log('open[#dashboardViewContext]');
            $('body').append(context);
            $('#reportView').modal();
          }, 100);
        }
        else {
          console.log('wait[#dashboardViewContext]');
          setTimeout(include, 200);
        }
      }

      setTimeout(include, 200);
    };

    this.initializeStimulsoft = function(language) {
      if (!Stimulsoft.Base.StiLicense.Key) {
        stimulsoftHelper.setLanguage(language);
        var localization = stimulsoftHelper.getLocalization();
        Stimulsoft.Base.Localization.StiLocalization.loadLocalization(localization.xml);
        Stimulsoft.Base.Localization.StiLocalization.cultureName = localization.cultureName;
        Stimulsoft.Base.StiLicense.Key = stimulsoftHelper.getKey();
      }
    }
  
    this.openStimulsoftDashboard = function(json, parameters, datasourcesInBand, config) {

      var context = $('#dashboardViewContext');
      if(!context.get(0)) {
        var htmlViewer = $('<div id="dashboardViewContext" ng-include="\'node_modules/cronapp-framework-js/components/dashboard/dashboard.view.html\'"></div>');
        $(body).append(htmlViewer);
        $compile(htmlViewer)(scope);
        context = $('#dashboardViewContext');
      }

      var h = parseInt($(window).height());
      var heightRepo = (h - 200) + "px";
      var viewerId = "StiViewer" + app.common.generateId();
      var dashboard = Stimulsoft.Report.StiReport.createNewDashboard();
      dashboard.load(json);
    
      var getViewer = () => {
        var options = new Stimulsoft.Viewer.StiViewerOptions();
        options.toolbar.showAboutButton = false;
        if (config) {
          options.toolbar.visible = config.showToolbar;
          options.appearance.scrollbarsMode = config.showScrollbar;
          if (config.height != undefined)
            options.height = config.height + "px";
        } else {
          options.appearance.scrollbarsMode = true;
          options.height = heightRepo;
        }
        var viewer = new Stimulsoft.Viewer.StiViewer(options, viewerId, false);
        viewer.report = dashboard;
        if(StiJsViewer.prototype.IsTouchDevice()) {
          viewer.options.appearance.interfaceType = Stimulsoft.Viewer.StiInterfaceType.Touch;
        }
        return viewer;
      };

      if (config && config.$element) {
        getViewer(config).renderHtml(config.$element[0]);
      } else {
        function observeFullScreen() {
          var $contentReport;
          var $modalBody;
          var $headerBody;
          var $otherHeader;
          var $reportView;
          var observerInterval = setInterval(function() {
            var $renderedReport = $('#'+viewerId);
            if ($renderedReport.length) {
              if (!$contentReport) {
                $contentReport = $renderedReport.parent();
                $modalBody = $contentReport.parent();
                $headerBody = $modalBody.parent();
                $otherHeader = $headerBody.parent(); //coloca o css e coloca o 100% do width (remove modal-dialog modal-lg)
                $reportView = $otherHeader.parent(); //coloca o css (remove modal fade ng-scope in)
              }
            }
            else {
              console.log('cleared interval: ' + viewerId);
              clearInterval(observerInterval);
            }
          }, 100);
        }
      
        function startShow(url) {

          // If Device is Mobile do not open modal. Open Report in new tab.
          if(url && isMobile()) {
            openReportOnMobile(url);
            return;
          }

          var include = setInterval(function() {
            var div = $('<div/>');
            div.attr('id',"contentDashboard");
            div.attr('width', '100%');
            var m = $('#dashboardView .modal-body');
            if(m.get(0)) {
              m.html(div);
              $('#dashboardViewContext .modal-dialog').css('width', '95%');
              setTimeout(function() {
                console.log('open[#dashboardViewContext]');
                $('body').append(context);
                cronapi.screen.showModal('dashboardView');
                getViewer(config).renderHtml("contentDashboard");
                setTimeout(function() { observeFullScreen() },100);
              }, 100);
            
              clearInterval(include);
            }
          }, 200);
        }
        startShow(null);      
      }
      $(`#${viewerId}`).find('img').attr('alt','');
      $(`#${viewerId}`).find('input').attr('aria-label', viewerId);
    
    };

    this.loadSriptsStimulsoft = function(callback) {
      var loadedAllSuccess = true;
      var total = scriptsStimulsoft.length;
      var totalAdded = 0;

      Pace.options.initialRate = 0.7;
      Pace.options.minTime = 1750;
      Pace.options.maxProgressPerFrame = 1;
      Pace.options.ghostTime = 120000;
      let refreshPaceUntilLoad = setInterval( () => Pace.restart(), 2500);

      scriptsStimulsoft.forEach(function(url, idx) {
        this.loadScript(url, function(success) {
          totalAdded++;
          if (!success)
            loadedAllSuccess = false;
          if (totalAdded == total) {
            clearInterval(refreshPaceUntilLoad);
            Pace.options.initialRate = 0.03;
            Pace.options.minTime = 250;
            Pace.options.maxProgressPerFrame = 20;
            Pace.options.ghostTime = 10;
            Pace.stop();
            callback(loadedAllSuccess);
          }
        });
      }.bind(this));
    }

    this.loadScript = function(url, callback) {
      if($.inArray(url, loadedScripts) >= 0) {
        callback && callback(true);
        return;
      }

      if(url.indexOf(".css") != -1) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.media = 'all';
        link.onload = function() {
          loadedScripts.push(url);
          callback && callback(true);
        };
        link.onerror = function() {
          callback && callback(false);
        };
        try {
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        catch(ex) {
          console.log(ex);
        }
      }
      else {
        var script = document.createElement("script")
        script.type = "text/javascript";
        if(script.readyState) { // IE
          script.onreadystatechange = function() {
            if(script.readyState == "loaded" || script.readyState == "complete") {
              script.onreadystatechange = null;
              loadedScripts.push(url);
              callback && callback(true);
            }
          };
        }
        else { // Others
          script.onload = function() {
            loadedScripts.push(url);
            callback && callback(true);
          };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
      }
    }

    this.openDashboard = function(dashboardName, params, config) {
      this.getDashboard(dashboardName).then(function(result) {
        if(result && result.data) {
          if (result.data.dashboardName.endsWith('.dashboard')) {

            this.loadSriptsStimulsoft(function(success) {
              if (success) {
                this.initializeStimulsoft($translate.use());
                this.getContentAsString(result.data).then(
                    function (content) {
                      this.openStimulsoftDashboard(content.data, result.data.parameters, result.data.datasourcesInBand, config);
                    }.bind(this),
                    function (data) {
                      var message = cronapi.internal.getErrorMessage(data, data.statusText);
                      scope.Notification.error(message);
                    }.bind(this)
                );
              }
              else {
                scope.Notification.error("Error loading report script");
              }

            }.bind(this));
          }
        }
      }.bind(this));
    };

    function isMobile() {
      return (navigator.userAgent.match(/Android/i)
          || navigator.userAgent.match(/webOS/i)
          || navigator.userAgent.match(/iPhone/i)
          || navigator.userAgent.match(/iPad/i)
          || navigator.userAgent.match(/iPod/i)
          || navigator.userAgent.match(/BlackBerry/i)
          || navigator.userAgent.match(/Windows Phone/i))
    }

    function openReportOnMobile(url) {
      window.open(url, '_blank');
    }
  });
}(app));