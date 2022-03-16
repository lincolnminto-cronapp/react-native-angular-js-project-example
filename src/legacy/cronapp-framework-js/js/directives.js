//Version 2.0.6
(function($app) {

  app.common = {
    generateId: function() {
      var numbersOnly = '0123456789';
      var result = Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      if (numbersOnly.indexOf(result.substr(0,1)) > -1)
        return this.generateId();
      return result;
    }
  }

  var isoDate = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
  var ISO_PATTERN = new RegExp("(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z))");
  Number.MAX_SAFE_INTEGER_32 = 2147483647;

  /**
   * Função que retorna o formato que será utilizado no componente
   * capturando o valor do atributo format do elemento, para mais formatos
   * consulte os formatos permitidos em http://momentjs.com/docs/#/parsing/string-format/
   *
   */
  var patternFormat = function(element) {
    if (element) {
      return $(element).attr('format') || 'DD/MM/YYYY';
    }
    return 'DD/MM/YYYY';
  }

  var parsePermission = function(perm) {
    var result = {
      visible: {
        public: true
      },
      enabled: {
        public: true
      },
      notvisible: {
        public: false
      },
      notenabled: {
        public: false
      }
    }

    if (perm) {
      var perms = perm.toLowerCase().trim().split(",");
      for (var i=0;i<perms.length;i++) {
        var p = perms[i].trim();
        if (p) {
          var pair = p.split(":");
          if (pair.length == 2) {
            var key = pair[0].trim();
            var value = pair[1].trim();
            if (value) {
              var values = value.split(";");
              var json = {};
              for (var j=0;j<values.length;j++) {
                var v = values[j].trim();
                if (v) {
                  json[v] = true;
                }
              }
              result[key] = json;
            }
          }
        }
      }
    }
    return result;
  };

  app.directive('cronCalendar', ['$timeout', function ($timeout) {
    return {
      restrict: 'E',
      link: async function (scope, element, attrs, ngModelCtrl) {
        let options = {};

        try {
          options = JSON.parse(attrs.options);
        } catch (e) {
          console.error(e);
        }

        const cronCalendarElement = $(element);

        const culture = navigator.language || navigator.userLanguage;
        const expressionInitialDate = options.expressionInitialDate;
        const expressionSelectDates = options.expressionSelectDates;
        const expressionDisableDates = options.expressionDisableDates;
        const expressionMinDate = options.expressionMinDate;
        const expressionMaxDate = options.expressionMaxDate;
        const expressionOnChange = options.expressionOnChange;
        const expressionOnNavigate = options.expressionOnNavigate;

        const initialDate = expressionInitialDate ? await scope.$eval(generateBlocklyCall(expressionInitialDate)) : new Date();
        const selectDates = (expressionSelectDates && options.isSelectableMultiple) ? await scope.$eval(generateBlocklyCall(expressionSelectDates)) : [];
        const disableDates = expressionDisableDates ? await scope.$eval(generateBlocklyCall(expressionDisableDates)) : null;
        const min = expressionMinDate ? await scope.$eval(generateBlocklyCall(expressionMinDate)) : new Date(1900, 0, 1);
        const max = expressionMaxDate ? await scope.$eval(generateBlocklyCall(expressionMaxDate)) : new Date(2099, 11, 31);

        cronCalendarElement.kendoCalendar({
          culture: culture.startsWith('pt') ? 'pt-BR' : 'en-US',
          componentType: options.isClassicType ? 'classic' : 'modern',
          selectable: options.isSelectableSingle ? 'single' : 'multiple',
          weekNumber: options.showWeekNumbers,
          value: initialDate,
          selectDates: selectDates,
          disableDates: disableDates,
          min: min,
          max: max
        });

        let calendar = cronCalendarElement.data('kendoCalendar');

        calendar.bind("change", function () {
          let value = this.value();
          //value is the selected date in the calendar
          if (expressionOnChange) {
            scope.$eval(generateBlocklyCall(expressionOnChange));
          }
        });

        calendar.bind("navigate", function () {
          let view = this.view();
          //name of the current view

          let current = this.current();
          //currently focused date
          if (expressionOnChange) {
            scope.$eval(generateBlocklyCall(expressionOnNavigate));
          }
        });

        function updateView(value) {
          ngModelCtrl.$viewValue = value;
          ngModelCtrl.$render();
        }

        function updateModel(value) {
          ngModelCtrl.$modelValue = value;
          scope.ngModel = value; // overwrites ngModel value
        }
      }
    }
  }]);

  app.directive('justGage', ['$timeout', function ($timeout) {
    return {
      restrict: 'EA',
      scope: {
        id: '@',
        class: '@',
        min: '=',
        max: '=',
        title: '@',
        label: '@',
        value: '@',
        options: '='
      },
      template: '<div id="{{id}}-justgage" class="{{class}}"></div>',
      link: function (scope, element, attrs) {
        $timeout(function () {
          var options = {
            id: scope.id + '-justgage',
            min: scope.min || 0,
            max: scope.max || 100,
            title: scope.title,
            label: scope.label || '',
            value: scope.value
          };

          if (scope.options) {
            for (var key in scope.options) {
              options[key] = scope.options[key];
            }
          }

          var graph = new JustGage(options);

          scope.$watch('max', function (updatedMax) {
            if (updatedMax !== undefined) {
              graph.refresh(scope.value, updatedMax);
            }
          }, true);

          scope.$watch('value', function (updatedValue) {
            if (updatedValue !== undefined) {
              graph.refresh(updatedValue);
            }
          }, true);
        });
      }
    };
  }]);

  app.directive('crnAnchor', ['$rootScope', '$location', '$anchorScroll', function ($rootScope, $location, $anchorScroll) {
    return {
      restrict: 'A',
      link: function (scope, instanceElement, instanceAttributes) {
        instanceElement.bind('click', function() {
          let target = instanceAttributes["crnAnchor"];
          $anchorScroll(target);
          $('#' + target).get(0).focus();
        });
      }
    }
  }]);

  app.directive('input', transformText);

  app.directive('textarea', transformText);

  var generateBlocklyCall = function(blocklyInfo) {
    var call = "";
    if (!blocklyInfo) return call;

    if (blocklyInfo.type == "client")  {
      call = "cronapi.client('" + blocklyInfo.blocklyClass + "." +  blocklyInfo.blocklyMethod + "')";
      var params = "";
      blocklyInfo.blocklyParams.forEach(function(p) {
        if (params.length  > 0) {
          params += ", ";
        }
        params += (p.value ? p.value : "null");
      });
      call += ".run("+params+")";
    }
    else if (blocklyInfo.type == "server") {
      var blocklyName = blocklyInfo.blocklyClass + '.' + blocklyInfo.blocklyMethod;
      call = "cronapi.server('"+blocklyName+"')";

      var params = "";
      blocklyInfo.blocklyParams.forEach(function(p) {
        if (params.length  > 0) {
          params += ", ";
        }
        params += (p.value ? p.value : "null");
      });

      call += ".run("+params+")";

    }
    return call;

  }

  app.directive('asDate', maskDirectiveAsDate)

      .directive('ngDestroy', function() {
        return {
          restrict: 'A',
          link: function(scope, element, attrs, ctrl) {
            element.on('$destroy', function() {
              if (attrs.ngDestroy && attrs.ngDestroy.length > 0)
                if (attrs.ngDestroy.indexOf('app.') > -1 || attrs.ngDestroy.indexOf('blockly.') > -1)
                  scope.$eval(attrs.ngDestroy);
                else
                  eval(attrs.ngDestroy);
            });
          }
        }
      })

      .directive('dynamicImage', function($compile) {
        var template = '';
        return {
          restrict: 'E',
          replace: true,
          scope: {
            ngModel: '@',
            width: '@',
            height: '@',
            style: '@',
            class: '@'
          },
          require: 'ngModel',
          template: '<div></div>',
          init: function(s) {
            if (!s.ngModel)
              s.ngModel = '';
            if (!s.width)
              s.width = '128';
            if (!s.height)
              s.height = '128';
            if (!s.style)
              s.style = '';
            if (!s.class)
              s.class = '';
            if (!this.containsLetter(s.width))
              s.width += 'px';
            if (!this.containsLetter(s.height))
              s.height += 'px';
          },
          containsLetter: function(value) {
            var containsLetter;
            for (var i=0; i<value.length; i++) {
              containsLetter = true;
              for (var number = 0; number <10; number++)
                if (parseInt(value[i]) == number)
                  containsLetter = false;
              if (containsLetter)
                break;
            }
            return containsLetter;
          },
          link: function(scope, element, attr) {
            this.init(scope);
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");
            var templateDyn    = '<div class="form-group upload-image-component" ngf-drop="" ngf-drag-over-class="dragover">\
                                  <img class="$class$" style="$style$; height: $height$; width: $width$;" ng-if="$ngModel$" data-ng-src="{{$ngModel$.startsWith(\'http\') || ($ngModel$.startsWith(\'/\') && $ngModel$.length < 1000)? $ngModel$ : \'data:image/png;base64,\' + $ngModel$}}">\
                                  <img class="$class$" style="$style$; height: $height$; width: $width$;" ng-if="!$ngModel$" data-ng-src="/plugins/cronapp-framework-js/img/selectImg.svg" class="btn" ng-if="!$ngModel$" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.setFile(\'$ngModel$\', $file)" accept="image/*;capture=camera">\
                                  <button class="remove btn btn-danger btn-xs" ng-if="$ngModel$" ng-click="$ngModel$=null">\
                                    <span class="glyphicon glyphicon-remove"></span>\
                                    <span class="sr-only">{{"Remove" | translate}}</span>\
                                  </button>\
                                  <button class="btn btn-info btn-xs start-camera-button" ng-if="!$ngModel$" ng-click="cronapi.internal.startCamera(\'$ngModel$\')">\
                                    <span class="glyphicon glyphicon-facetime-video"></span>\
                                    <span class="sr-only">{{"Upload.camera" | translate}}</span>\
                                  </button>\
                                  <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important; margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
                                </div>';
            element.append(templateDyn
                .split('$height$').join(s.height)
                .split('$width$').join(s.width)
                .split('$ngModel$').join(s.ngModel)
                .split('$style$').join(s.style)
                .split('$class$').join(s.class)
                .split('$required$').join(required)
            );


            $compile(element)(element.scope());
          }
        }
      })
      .directive('dynamicImage', function($compile, $translate) {
        var template = '';
        return {
          restrict: 'A',
          scope: true,
          require: 'ngModel',
          link: function(scope, element, attr) {
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");
            var content = element.html();
            var templateDyn    =
                '<div ngf-drop="" ngf-drag-over-class="dragover">\
           <img alt="$picture$" style="width: 100%;" ng-if="$ngModel$" data-ng-src="{{$ngModel$.startsWith(\'http\') || ($ngModel$.startsWith(\'/\') && $ngModel$.length < 1000)? $ngModel$ : \'data:image/png;base64,\' + $ngModel$}}">\
           <input id="$id$" aria-label="$userHtml$" ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important; margin-left: 85px !important;margin-top: 50px !important; display: none;" type=text ng-model="$ngModel$" $required$>\
           <button id="$idbutton$" class="btn" ng-if="!$ngModel$" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.setFile(\'$ngModel$\', $file)" ngf-pattern="\'image/*\'" ngf-max-size="$maxFileSize$">\
             $userHtml$\
           </button>\
           <button class="remove-image-button btn btn-danger btn-xs" ng-if="$ngModel$" ng-click="$ngModel$=null">\
             <span class="glyphicon glyphicon-remove"></span>\
             <span class="sr-only">{{"Remove" | translate}}</span>\
           </button>\
           <button class="btn btn-info btn-xs start-camera-button-attribute" ng-if="!$ngModel$" ng-click="cronapi.internal.startCamera(\'$ngModel$\')">\
             <span class="glyphicon glyphicon-facetime-video"></span>\
             <span class="sr-only">{{"Upload.camera" | translate}}</span>\
           </button>\
         </div>';
            var maxFileSize = "";
            if (attr.maxFileSize)
              maxFileSize = attr.maxFileSize;

            var imgAltText = "";

            attr.imgAltText ? imgAltText = attr.imgAltText : imgAltText = "Admin.view.Picture";

            templateDyn = $(templateDyn
                .split('$id$').join(attr.id?attr.id+"-input":"textinput-picture")
                .split('$idbutton$').join(attr.id?attr.id+"-button":"textinput-picture-button")
                .split('$ngModel$').join(attr.ngModel)
                .split('$required$').join(required)
                .split('$userHtml$').join(content)
                .split('$maxFileSize$').join(maxFileSize)
                .split('$picture$').join($translate.instant(imgAltText))
            );

            element.html(templateDyn);
            $compile(templateDyn)(element.scope());
          }
        }
      })
      .directive('dynamicFile', function($compile, $translate) {
        var template = '';
        return {
          restrict: 'A',
          scope: true,
          require: 'ngModel',
          link: function(scope, element, attr) {
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");

            var splitedNgModel = attr.ngModel.split('.');
            var datasource = splitedNgModel[0];
            var field = splitedNgModel[splitedNgModel.length-1];
            var number = Math.floor((Math.random() * 1000) + 20);
            var content = element.html();

            var maxFileSize = "";
            if (attr.maxFileSize)
              maxFileSize = attr.maxFileSize;
            let fileInfo = attr.fileInfo ? `'${attr.fileInfo}'`: 'undefined';

            var templateDyn    = '\
                                <div ng-show="!$ngModel$" ngf-drop="" ngf-drag-over-class="dragover">\
                                  <input id="$id$" aria-label="$userHtml$" ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important;margin-left: 85px !important;margin-top: 50px !important; display: none;" type=text ng-model="$ngModel$" $required$>\
                                  <button id="$idbutton$" class="btn" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.uploadFile(\'$ngModel$\', $file, \'uploadprogress$number$\', $fileInfo$, $invalidFiles)" ngf-max-size="$maxFileSize$">\
                                    $userHtml$\
                                  </button>\
                                  <div class="progress" data-type="bootstrapProgress" id="uploadprogress$number$" style="display:none">\
                                    <div class="progress-bar" role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" style="width:0%">\
                                      <span class="sr-only"></span>\
                                    </div>\
                                  </div>\
                                </div> \
                                <div ng-show="$ngModel$" class="upload-image-component-attribute"> \
                                  <button class="btn btn-danger btn-xs ng-scope" style="float:right;" ng-if="$ngModel$" ng-click="$ngModel$=null"> \
                                    <span class="glyphicon glyphicon-remove"></span> \
                                    <span class="sr-only">{{"Remove" | translate}}</span> \
                                  </button> \
                                  <div> \
                                    <div ng-bind-html="cronapi.internal.generatePreviewDescriptionByte($ngModel$, $fileInfo$)"></div> \
                                    <a href="javascript:void(0)" ng-click="cronapi.internal.downloadFileEntity($datasource$,\'$field$\', undefined, $fileInfo$)">$lblDownload$</a> \
                                  </div> \
                                </div> \
                                ';
            templateDyn = $(templateDyn
                .split('$id$').join(attr.id?attr.id+"-input":"textinput-file")
                .split('$idbutton$').join(attr.id?attr.id+"-button":"textinput-file-button")
                .split('$ngModel$').join(attr.ngModel)
                .split('$datasource$').join(datasource)
                .split('$field$').join(field)
                .split('$number$').join(number)
                .split('$required$').join(required)
                .split('$userHtml$').join(content)
                .split('$maxFileSize$').join(maxFileSize)
                .split('$lblDownload$').join($translate.instant('download'))
                .split('$fileInfo$').join(fileInfo)
            );

            element.html(templateDyn);
            $compile(templateDyn)(element.scope());
          }
        }
      })
      .directive('dynamicFile', function($compile) {
        var template = '';
        return {
          restrict: 'E',
          replace: true,
          scope: {
            ngModel: '@',
          },
          require: 'ngModel',
          template: '<div></div>',
          init: function(s) {
            if (!s.ngModel)
              s.ngModel = '';
          },
          link: function(scope, element, attr) {
            this.init(scope);
            var s = scope;
            var required = (attr.ngRequired && attr.ngRequired == "true"?"required":"");

            var splitedNgModel = s.ngModel.split('.');
            var datasource = splitedNgModel[0];
            var field = splitedNgModel[splitedNgModel.length-1];
            var number = Math.floor((Math.random() * 1000) + 20);

            var templateDyn    = '\
                                <div ng-show="!$ngModel$">\
                                  <input ng-if="!$ngModel$" autocomplete="off" tabindex="-1" class="uiSelectRequired ui-select-offscreen" style="top: inherit !important;margin-left: 85px !important;margin-top: 50px !important;" type=text ng-model="$ngModel$" $required$>\
                                  <div class="form-group upload-image-component" ngf-drop="" ngf-drag-over-class="dragover"> \
                                    <img class="ng-scope" style="height: 128px; width: 128px;" ng-if="!$ngModel$" data-ng-src="/plugins/cronapp-framework-js/img/selectFile.png" ngf-drop="" ngf-select="" ngf-change="cronapi.internal.uploadFile(\'$ngModel$\', $file, \'uploadprogress$number$\')" accept="*">\
                                    <progress id="uploadprogress$number$" max="100" value="0" style="position: absolute; width: 128px; margin-top: -134px;">0</progress>\
                                  </div>\
                                </div> \
                                <div ng-show="$ngModel$" class="form-group upload-image-component"> \
                                  <div class="btn btn-danger btn-xs ng-scope" style="float:right;" ng-if="$ngModel$" ng-click="$ngModel$=null"> \
                                    <span class="glyphicon glyphicon-remove"></span> \
                                  </div> \
                                  <div> \
                                    <div ng-bind-html="cronapi.internal.generatePreviewDescriptionByte($ngModel$)"></div> \
                                    <a href="javascript:void(0)" ng-click="cronapi.internal.downloadFileEntity($datasource$,\'$field$\')">download</a> \
                                  </div> \
                                </div> \
                                ';
            element.append(templateDyn
                .split('$ngModel$').join(s.ngModel)
                .split('$datasource$').join(datasource)
                .split('$field$').join(field)
                .split('$number$').join(number)
                .split('$required$').join(required)
            );
            $compile(element)(element.scope());
          }
        }
      })
      .directive('pwCheck', [function() {
        'use strict';
        return {
          require: 'ngModel',
          link: function(scope, elem, attrs, ctrl) {
            var firstPassword = '#' + attrs.pwCheck;
            elem.add(firstPassword).on('keyup', function() {
              scope.$apply(function() {
                var v = elem.val() === $(firstPassword).val();
                ctrl.$setValidity('pwmatch', v);
              });
            });
          }
        }
      }])
      .directive('ngClick', [function() {
        'use strict';
        return {
          link: function(scope, elem, attrs, ctrl) {
            if (scope.rowData) {
              var crnDatasource = elem.closest('[crn-datasource]')
              if (crnDatasource.length > 0) {
                elem.on('click', function() {
                  scope.$apply(function() {
                    var datasource = eval(crnDatasource.attr('crn-datasource'));
                    datasource.active = scope.rowData;
                  });
                });
              }
            }
          }
        }
      }])

      /**
       * Validação de campos CPF e CNPJ,
       * para utilizar essa diretiva, adicione o atributo valid com o valor
       * do tipo da validação (cpf ou cnpj). Exemplo <input type="text" valid="cpf">
       */
      .directive('valid', function() {
        return {
          require: '?ngModel',
          restrict: 'A',
          link: function(scope, element, attrs, ngModel) {
            var validator = {
              'cpf': CPF,
              'cnpj': CNPJ
            };

            if (ngModel) {
              ngModel.$validators[attrs.valid] = function(modelValue, viewValue) {
                var value = modelValue || viewValue;
                var fieldValid = validator[attrs.valid].isValid(value);
                if (!fieldValid && value !== null) {
                  element.scope().$applyAsync(function(){ element[0].setCustomValidity(element[0].dataset['errorMessage']); }) ;
                } else {
                  element[0].setCustomValidity("");
                }
                return (fieldValid || !value);
              };
            } else {
              let validate = function() {
                setTimeout(()=>{
                  var value = element.data('rawvalue');
                  var fieldValid = validator[attrs.valid].isValid(value);
                  if (!fieldValid && value !== null) {
                    element.addClass('k-invalid');
                  } else {
                    element.removeClass('k-invalid');
                  }
                })
              };
              element.on('keydown', validate).on('keyup', validate);
            }
          }
        }
      })

      .directive('cronappSecurity', function($rootScope) {
        return {
          restrict: 'A',
          priority: Number.MIN_SAFE_INTEGER,
          link: function(scope, element, attrs) {
            var roles = [];
            var user = JSON.parse(localStorage.getItem('_u'))
            if (user && user.roles) {
              roles = user.roles.toLowerCase().split(",");
            }

            var perms = parsePermission(attrs.cronappSecurity);
            var show = false;
            var enabled = false;
            for (var i=0;i<roles.length;i++) {
              var role = roles[i].trim();
              if (role) {
                if (perms.visible[role]) {
                  show = true;
                }
                if (perms.enabled[role]) {
                  enabled = true;
                }
              }
            }

            for (var i=0;i<roles.length;i++) {
              var role = roles[i].trim();
              if (role) {
                if (perms.notvisible[role]) {
                  show = false;
                }
                if (perms.notenabled[role]) {
                  enabled = false;
                }
              }
            }

            let $element = $(element);
            let applyPermission = () => {
              if (!show) {
                $element.hide();
              }
              if (!enabled) {
                $element.find('*').addBack().attr('disabled', true).off('click').on('click', e => e.preventDefault());
              }
            };

            let wait = setInterval(()=>{
              if ($rootScope.renderFinished) {
                applyPermission();
                clearInterval(wait);
              }
            });

          }
        }
      })

      .directive('qr', ['$window', function($window){
        return {
          restrict: 'A',
          require: '^ngModel',
          template: '<canvas ng-hide="image"></canvas><img ng-if="image" ng-src="{{canvasImage}}"/>',
          link: function postlink(scope, element, attrs, ngModel){
            if (scope.size === undefined  && attrs.size) {
              scope.text = attrs.size;
            }
            var getTypeNumeber = function(){
              return scope.typeNumber || 0;
            };
            var getCorrection = function(){
              var levels = {
                'L': 1,
                'M': 0,
                'Q': 3,
                'H': 2
              };
              var correctionLevel = scope.correctionLevel || 0;
              return levels[correctionLevel] || 0;
            };
            var getText = function(){
              return ngModel.$modelValue || "";
            };
            var getSize = function(){
              let outerWidth = $(element).outerWidth();
              let outerHeight = $(element).outerHeight();
              let bestFit = outerWidth < outerHeight ? outerWidth : outerHeight;
              return scope.size || bestFit;
            };
            var isNUMBER = function(text){
              var ALLOWEDCHARS = /^[0-9]*$/;
              return ALLOWEDCHARS.test(text);
            };
            var isALPHA_NUM = function(text){
              var ALLOWEDCHARS = /^[0-9A-Z $%*+\-./:]*$/;
              return ALLOWEDCHARS.test(text);
            };
            var is8bit = function(text){
              for (var i = 0; i < text.length; i++) {
                var code = text.charCodeAt(i);
                if (code > 255) {
                  return false;
                }
              }
              return true;
            };
            var checkInputMode = function(inputMode, text){
              if (inputMode === 'NUMBER' && !isNUMBER(text)) {
                throw new Error('The `NUMBER` input mode is invalid for text.');
              }
              else if (inputMode === 'ALPHA_NUM' && !isALPHA_NUM(text)) {
                throw new Error('The `ALPHA_NUM` input mode is invalid for text.');
              }
              else if (inputMode === '8bit' && !is8bit(text)) {
                throw new Error('The `8bit` input mode is invalid for text.');
              }
              else if (!is8bit(text)) {
                throw new Error('Input mode is invalid for text.');
              }
              return true;
            };
            var getInputMode = function(text){
              var inputMode = scope.inputMode;
              inputMode = inputMode || (isNUMBER(text) ? 'NUMBER' : undefined);
              inputMode = inputMode || (isALPHA_NUM(text) ? 'ALPHA_NUM' : undefined);
              inputMode = inputMode || (is8bit(text) ? '8bit' : '');
              return checkInputMode(inputMode, text) ? inputMode : '';
            };
            var canvas = element.find('canvas')[0];
            var canvas2D = !!$window.CanvasRenderingContext2D;
            scope.TYPE_NUMBER = getTypeNumeber();
            scope.TEXT = getText();
            scope.CORRECTION = getCorrection();
            scope.SIZE = getSize();
            scope.INPUT_MODE = getInputMode(scope.TEXT);
            scope.canvasImage = '';
            var draw = function(context, qr, modules, tile){
              for (var row = 0; row < modules; row++) {
                for (var col = 0; col < modules; col++) {
                  var w = (Math.ceil((col + 1) * tile) - Math.floor(col * tile)),
                      h = (Math.ceil((row + 1) * tile) - Math.floor(row * tile));
                  context.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
                  context.fillRect(Math.round(col * tile), Math.round(row * tile), w, h);
                }
              }
            };
            var render = function(canvas, value, typeNumber, correction, size, inputMode){
              var trim = /^\s+|\s+$/g;
              var text = value.replace(trim, '');
              var qr = new QRCode(typeNumber, correction, inputMode);
              qr.addData(text);
              qr.make();
              var context = canvas.getContext('2d');
              var modules = qr.getModuleCount();
              var tile = size / modules;
              canvas.width = canvas.height = size;
              if (canvas2D) {
                draw(context, qr, modules, tile);
                scope.canvasImage = canvas.toDataURL() || '';
              }
            };

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              if (value !== old || value !== scope.TEXT) {
                scope.text = ngModel.$modelValue;
                scope.TEXT = getText();
                scope.INPUT_MODE = getInputMode(scope.TEXT);
                render(canvas, scope.TEXT, scope.TYPE_NUMBER, scope.CORRECTION, scope.SIZE, scope.INPUT_MODE);
              }
            });
            render(canvas, scope.TEXT, scope.TYPE_NUMBER, scope.CORRECTION, scope.SIZE, scope.INPUT_MODE);
          }};
      }])

      .directive('uiSelect', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {

            let waitAngularReady = () => {
              if (scope.$$phase !== '$apply' && scope.$$phase !== '$digest') {
                element.find('i').remove();
              }
              else {
                setTimeout( () => waitAngularReady(), 200);
              }
            };
            waitAngularReady();

            if (attrs.required != undefined || attrs.ngRequired === "true") {
              $(element).append("<input autocomplete=\"off\" tabindex=\"-1\" class=\"uiSelectRequired ui-select-offscreen\" style=\"left: 50%!important; top: 100%!important;\" type=text ng-model=\""+attrs.ngModel+"\" required>");
              var input = $(element).find("input.uiSelectRequired");
              $compile(input)(element.scope());
            }
          }
        };
      })

      .filter('raw',function($translate) {
        return function(o) {
          if (o != null && o !== undefined) {
            if (typeof o == 'number') {
              return o + "";
            }
            if (typeof o == 'boolean') {
              return o + "";
            }
            if (o instanceof Date) {
              return "datetimeoffset'" + o.toISOString() + "'";
            }
            else {
              if (o.length >= 10 && o.match(ISO_PATTERN)) {
                return "datetimeoffset'" + o + "'";
              } else {
                return "'" + o.replaceAll("'", "''") + "'";
              }
            }
          } else {
            return "";
          }
        }
      })

      .filter('js',function($translate) {
        return function(o) {
          if (o != null && o !== undefined) {
            if (typeof o == 'number' || typeof o == 'boolean') {
              return o + "";
            }
            if (o instanceof Date) {
              return cronapi.toDate(o.toISOString());
            }
            else {
              if (o.length >= 10 && o.match(ISO_PATTERN)) {
                return cronapi.toDate(o);
              } else {
                return "'" + o + "'";
              }
            }
          }
          else {
            return "undefined";
          }
        }
      })

      .filter('mask',function($translate) {
        return function(value, maskValue, type) {
          maskValue = parseMaskType(maskValue, $translate);
          if (!maskValue)
            return value;


          var useUTC;

          if (type !== undefined) {
            useUTC = type == 'date' || type == 'datetime' || type == 'time';

            if (!window.fixedTimeZone) {
              useUTC = false;
            }
          } else {
            useUTC = window.fixedTimeZone;
          }

          if (maskValue.indexOf(";local") > 0) {
            useUTC = false;
          }

          maskValue = maskValue.replace(';1', '').replace(';0', '').replace(';local', '').trim();
          if ((typeof value == "string" && value.match(isoDate)) || value instanceof Date) {
            if (useUTC) {
              return moment(value).utcOffset(window.timeZoneOffset).format(maskValue);
            } else {
              return moment(value).format(maskValue);
            }
          } else if (typeof value == 'number') {
            return format(maskValue, value);
          }  else if (value != undefined && value != null && value != "" && maskValue != '') {
            var input = $("<input type=\"text\">");
            input.mask(maskValue);
            return input.masked(value);
          } else {
            return value;
          }
        };
      })

      .directive('screenParams', [function() {
        'use strict';
        return {
          link: function(scope, elem, attrs, ctrl) {
            var screenParams = eval(attrs.screenParams);
            if (screenParams && screenParams.length) {
              screenParams.forEach(function(screenParam) {
                if (scope.params && !scope.params[screenParam.key])
                  scope.params[screenParam.key] = screenParam.value || '';
              });
            }
          }
        }
      }])

      .directive('mask', maskDirectiveMask)

      .directive('cronappFilter', function($compile) {
        return {
          restrict: 'A',
          require: '?ngModel',
          setFilterInButton: function($element, bindedFilter, operator) {
            var fieldset = $element.closest('fieldset');
            if (!fieldset)
              return;
            var button = fieldset.find('button[cronapp-filter]');
            if (!button)
              return;

            var filters = button.data('filters');
            if (!filters)
              filters = [];

            var index = -1;
            var ngModel = $element.attr('ng-model');
            $(filters).each(function(idx) {
              if (this.ngModel == ngModel)
                index = idx;
            });

            if (index > -1)
              filters.splice(index, 1);

            if (bindedFilter.length > 0) {
              var bindedFilterJson = {
                "ngModel" : ngModel,
                "bindedFilter" : bindedFilter
              };
              filters.push(bindedFilterJson);
            }
            button.data('filters', filters);
          },
          makeAutoPostSearch: function($element, bindedFilter, datasource, attrs) {
            var fieldset = $element.closest('fieldset');
            if (fieldset && fieldset.length > 0) {
              var button = fieldset.find('button[cronapp-filter]');
              if (button && button.length > 0) {
                var filters = button.data('filters');
                if (filters && filters.length > 0) {
                  bindedFilter = '';
                  $(filters).each(function() {
                    bindedFilter += this.bindedFilter+";";
                  });
                }
              }
            }
            datasource.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
          },
          inputBehavior: function(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost) {
            var filterTemplate = '';
            var filtersSplited = attrs.cronappFilter.split(';');
            var datasource;
            if (attrs.crnDatasource) {
              datasource = eval(attrs.crnDatasource);
            } else {
              var fieldset = $element.closest('fieldset');
              if (!fieldset)
                return;
              var button = fieldset.find('button[cronapp-filter]');
              if (!button)
                return;

              if (!button.attr('crn-datasource')) {
                return;
              }

              datasource = eval(button.attr('crn-datasource'));
            }

            var isOData = datasource.isOData()

            $(filtersSplited).each(function() {
              if (this.length > 0) {
                if (filterTemplate != "") {
                  if (isOData) {
                    filterTemplate += " or ";
                  } else {
                    filterTemplate += ";";
                  }
                }

                if (isOData) {
                  if (operator == "=" && typeElement == 'text') {
                    filterTemplate += "substringof({value.lower}, tolower("+this+"))";
                  }
                  else if (operator == "=") {
                    filterTemplate += this + " eq {value}";
                  }
                  else if (operator == "!=") {
                    filterTemplate += this + " ne {value}";
                  }
                  else if (operator == ">") {
                    filterTemplate += this + " gt {value}";
                  }
                  else if (operator == ">=") {
                    filterTemplate += this + " ge {value}";
                  }
                  else if (operator == "<") {
                    filterTemplate += this + " lt {value}";
                  }
                  else if (operator == "<=") {
                    filterTemplate += this + " le {value}";
                  }
                } else {
                  if (typeElement == 'text') {
                    filterTemplate += this + '@' + operator + '%{value}%';
                  } else {
                    filterTemplate += this + operator + '{value}';
                  }
                }
              }
            });
            if (filterTemplate.length == 0) {
              if (isOData) {
                filterTemplate = "{value}";
              } else {
                filterTemplate = '%{value}%';
              }
            }

            var selfDirective = this;
            if (ngModelCtrl) {
              scope.$watch(attrs.ngModel, function(newVal, oldVal) {
                if (angular.equals(newVal, oldVal)) { return; }
                var eType = $element.data('type') || $element.attr('type');
                var value = ngModelCtrl.$modelValue;

                if (isOData) {

                  if (value instanceof Date) {
                    if (eType == "datetime-local") {
                      value = "datetimeoffset'" + value.toISOString() + "'";
                    } else {
                      value = "datetime'" + value.toISOString().substring(0, 23) + "'";
                    }
                  }

                  else if (typeof value == "number") {
                    value = value + "M";
                  }

                  else if (typeof value == "boolean") {
                    value = value;
                  } else {
                    value = "'" + value + "'";
                  }

                } else {
                  if (value instanceof Date) {
                    value = value.toISOString();
                    if (eType == "date") {
                      value = value + "@@date";
                    }
                    else if (eType == "time" || eType == "time-local") {
                      value = value + "@@time";
                    }
                    else {
                      value = value + "@@datetime";
                    }
                  }

                  else if (typeof value == "number") {
                    value = value + "@@number";
                  }

                  else if (typeof value == "boolean") {
                    value = value + "@@boolean";
                  }

                }
                var bindedFilter = filterTemplate.split('{value}').join(value);
                if (typeof value == 'string') {
                  if (bindedFilter.startsWith('substringof({')) {
                    var values = value.split("'").join("").toLowerCase().trim().split(' ');
                    var fulltextIndexFilter = '';
                    values.forEach(function(v, ix) {
                      fulltextIndexFilter += bindedFilter.split('{value.lower}').join("'" + v + "'");
                      if (ix < (values.length - 1)) {
                        fulltextIndexFilter += ' or ';
                      }
                    });
                    bindedFilter = fulltextIndexFilter;
                  }
                  else {
                    bindedFilter = bindedFilter.split('{value.lower}').join(value.toLowerCase());
                  }
                } else {
                  bindedFilter = bindedFilter.split('{value.lower}').join(value);
                }
                if (ngModelCtrl.$viewValue.length == 0)
                  bindedFilter = '';

                selfDirective.setFilterInButton($element, bindedFilter, operator);
                if (autopost)
                  selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);

              });
            }
            else {
              if (typeElement == 'text') {
                $element.on("keyup", function() {
                  var datasource = eval(attrs.crnDatasource);
                  var value = undefined;
                  if (ngModelCtrl && ngModelCtrl != undefined)
                    value = ngModelCtrl.$viewValue;
                  else
                    value = this.value;
                  var bindedFilter = filterTemplate.split('{value}').join(value);
                  if (this.value.length == 0)
                    bindedFilter = '';

                  selfDirective.setFilterInButton($element, bindedFilter, operator);
                  if (autopost)
                    selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);
                });
              }
              else {
                $element.on("change", function() {
                  var datasource = eval(attrs.crnDatasource);
                  var value = undefined;
                  var typeElement = $(this).attr('type');
                  if (attrs.asDate != undefined)
                    typeElement = 'date';

                  if (ngModelCtrl && ngModelCtrl != undefined) {
                    value = ngModelCtrl.$viewValue;
                  }
                  else {
                    if (typeElement == 'checkbox')
                      value = $(this).is(':checked');
                    else if (typeElement == 'date') {
                      value = this.value;
                      if (this.value.length > 0) {
                        var momentDate = moment(this.value, patternFormat(this));
                        value = momentDate.toDate().toISOString();
                      }
                    }
                    else
                      value = this.value;
                  }
                  var bindedFilter = filterTemplate.split('{value}').join(value);
                  if (value.toString().length == 0)
                    bindedFilter = '';

                  selfDirective.setFilterInButton($element, bindedFilter, operator);
                  if (autopost)
                    selfDirective.makeAutoPostSearch($element, bindedFilter, datasource, attrs);
                });
              }
            }
          },
          forceDisableDatasource: function(datasourceName, scope) {
            var disableDatasource = setInterval(function() {
              try {
                var datasourceInstance = eval(datasourceName);
                if (datasourceInstance) {
                  $(document).ready(function() {
                    var time = 0;
                    var intervalForceDisable = setInterval(function() {
                      if (time < 10) {
                        scope.$apply(function () {
                          datasourceInstance.enabled = false;
                          datasourceInstance.data = [];
                        });
                        time++;
                      }
                      else
                        clearInterval(intervalForceDisable);
                    }, 20);
                  });
                  clearInterval(disableDatasource);
                }
              }
              catch(e) {
                //try again, until render
              }
            },10);
          },
          buttonBehavior: function(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost) {
            var datasourceName = '';
            if (attrs.crnDatasource)
              datasourceName = attrs.crnDatasource;
            else
              datasourceName = $element.parent().attr('crn-datasource');

            var datasource = eval(datasourceName);
            var isOData = datasource.isOData()

            var requiredFilter = attrs.requiredFilter && attrs.requiredFilter.toString() == "true";
            if (requiredFilter) {
              this.forceDisableDatasource(datasourceName, scope);
            }

            $element.on('click', function() {
              var $this = $(this);
              var filters = $this.data('filters');
              if (datasourceName && datasourceName.length > 0 && filters) {
                var bindedFilter = '';
                $(filters).each(function() {
                  if (bindedFilter != '') {
                    bindedFilter += (isOData?" and ":";");
                  }
                  bindedFilter += this.bindedFilter;
                });

                var datasourceToFilter = eval(datasourceName);

                if (requiredFilter) {
                  datasourceToFilter.enabled = bindedFilter.length > 0;
                  if (datasourceToFilter.enabled) {
                    datasourceToFilter.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
                  }
                  else {
                    scope.$apply(function () {
                      datasourceToFilter.data = [];
                    });
                  }
                }
                else
                  datasourceToFilter.search(bindedFilter, (attrs.cronappFilterCaseinsensitive=="true"));
              }
            });
          },
          link: function(scope, element, attrs, ngModelCtrl) {
            var $element = $(element);
            var typeElement = $element.data('type') || $element.attr('type');
            if (attrs.asDate != undefined)
              typeElement = 'date';

            var operator = '=';
            if (attrs.cronappFilterOperator && attrs.cronappFilterOperator.length > 0)
              operator = attrs.cronappFilterOperator;

            var autopost = true;
            if (attrs.cronappFilterAutopost && attrs.cronappFilterAutopost == "false")
              autopost = false;

            //Correção para aceitar datasources fora de ordem
            setTimeout(function() {
              if ($element[0].tagName == "INPUT")
                this.inputBehavior(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost);
              else
                this.buttonBehavior(scope, element, attrs, ngModelCtrl, $element, typeElement, operator, autopost);
            }.bind(this), 100);
          }
        }
      })
      .directive('cronRichEditor', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          parseToTinyMCEOptions: function(optionsSelected) {
            var toolbarGroup = {};
            toolbarGroup["allowFullScreen"] = "fullscreen |";
            toolbarGroup["allowPage"] = "fullpage newdocument code pagebreak |";
            toolbarGroup["allowPrint"] = "preview print |";
            toolbarGroup["allowTransferArea"] = "cut copy paste |";
            toolbarGroup["allowDoUndo"] = "undo redo |";
            toolbarGroup["allowSymbol"] = "charmap |";
            toolbarGroup["allowEmbeddedImage"] = "bdesk_photo |";
            toolbarGroup["allowFont"] = "formatselect fontselect fontsizeselect strikethrough bold italic underline removeformat |";
            toolbarGroup["allowLinks"] = "link unlink anchor |";
            toolbarGroup["allowParagraph"] = "alignleft aligncenter alignright alignjustify numlist bullist outdent indent blockquote hr |";
            toolbarGroup["allowFormulas"] = "tiny_mce_wiris_formulaEditor tiny_mce_wiris_formulaEditorChemistry tiny_mce_wiris_CAS |";

            var tinyMCEOptions = {
              menubar: false,
              statusbar: false,
              plugins: "bdesk_photo advlist anchor autolink autoresize autosave charmap code colorpicker contextmenu directionality emoticons fullpage fullscreen hr image imagetools importcss insertdatetime legacyoutput link lists media nonbreaking noneditable pagebreak paste preview print save searchreplace tabfocus table template toc visualblocks visualchars wordcount tiny_mce_wiris",
              toolbar: "",
              content_style: ""
            };

            for (var key in optionsSelected) {
              if (key.startsWith("allow")) {
                if (optionsSelected[key])
                  tinyMCEOptions.toolbar += " " + toolbarGroup[key];
              }
            }
            tinyMCEOptions.menubar = optionsSelected.showMenuBar;
            tinyMCEOptions.statusbar = optionsSelected.showStatusBar;
            tinyMCEOptions.content_style = optionsSelected.contentStyle;
            tinyMCEOptions.readonly = optionsSelected.allowReadonly;

            return JSON.stringify(tinyMCEOptions);
          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var optionsSelected = JSON.parse(attrs.options);
            var tinyMCEOptions = this.parseToTinyMCEOptions(optionsSelected);

            var templateDyn = '\
                  <textarea \
                    ui-tinymce="$options$" \
                    ng-model="$ngModel$" \
                    id="$id$" \
                    aria-label="cronRichEditor" \
                    ng-cron-click="$ngClick$" \
                    ng-cron-dblclick="$ngDblclick$" \
                    ng-cron-mousedown="$ngMouseDown$" \
                    ng-cron-mouseup="$ngMouseUp$" \
                    ng-cron-mousemove="$ngMouseMove$" \
                    ng-cron-mouseover="$ngMouseOver$" \
                    ng-cron-mouseenter="$ngMouseEnter$" \
                    ng-cron-mouseleave="$ngMouseLeave$" \
                    ng-cron-keydown="$ngKeydown$" \
                    ng-cron-keyup="$ngKeyup$" \
                    ng-cron-keypress="$ngKeypress$"\
                    ng-context-menu="$ngContextMenu$" \
                    ng-cron-paste="$ngPaste$" \
                    ng-cron-init="$ngInit$" \
                    ng-cron-focus="$ngFocus$" \
                    ng-cron-blur="$ngBlur$" \
                    ng-before-set-content="$ngBeforeSetContent$" \
                    ng-set-content="$ngSetContent$" \
                    ng-get-content="$ngGetContent$" \
                    ng-pre-process="$ngPreProcess$" \
                    ng-post-process"$ngPostProcess$" \
                    ng-node-change="$ngNodeChange$" \
                    ng-cron-undo="$ngUndo$" \
                    ng-cron-redo="$ngRedo$" \
                    ng-cron-change="$ngChange$" \
                    ng-cron-dirty="$ngDirty$" \
                    ng-cron-remove="$ngRemove$" \
                    ng-exec-command="$ngExecCommand$" \
                    ng-paste-pre-process="$ngPastePreProcess$" \
                    ng-paste-post-process="$ngPastePostProcess$" \
                    ng-add-editor="$ngAddEditor$" \
                    ng-remove-editor="$ngRemoveEditor$"> \
                  </textarea> \
                ';
            templateDyn = $(templateDyn
                .split('$ngModel$').join(attrs.ngModel)
                .split('$ngClick$').join(attrs.ngCronClick || "")
                .split('$ngDblclick$').join(attrs.ngCronDblclick || "")
                .split('$ngMouseDown$').join(attrs.ngCronMouseDown || "")
                .split('$ngMouseUp$').join(attrs.ngCronMouseUp || "")
                .split('$ngMouseMove$').join(attrs.ngCronMousemove|| "")
                .split('$ngMouseOver$').join(attrs.ngCronMouseOver|| "")
                .split('$ngMouseEnter$').join(attrs.ngCronMouseenter|| "")
                .split('$ngMouseLeave$').join(attrs.ngCronMouseleave|| "")
                .split('$ngKeydown$').join(attrs.ngCronKeydown|| "")
                .split('$ngKeyup$').join(attrs.ngCronKeyup|| "")
                .split('$ngKeypress$').join(attrs.ngCronKeypress|| "")
                .split('$ngContextMenu$').join(attrs.ngContextMenu|| "")
                .split('$ngPaste$').join(attrs.ngCronPaste|| "")
                .split('$ngInit$').join(attrs.ngCronInit|| "")
                .split('$ngFocus$').join(attrs.ngCronFocus|| "")
                .split('$ngBlur$').join(attrs.ngCronBlur|| "")
                .split('$ngBeforeSetContent$').join(attrs.ngBeforeSetContent|| "")
                .split('$ngSetContent$').join(attrs.ngSetContent|| "")
                .split('$ngGetContent$').join(attrs.ngGetContent|| "")
                .split('$ngPreProcess$').join(attrs.ngPreProcess|| "")
                .split('$ngPostProcess$').join(attrs.ngPostProcess|| "")
                .split('$ngNodeChange$').join(attrs.ngNodeChange|| "")
                .split('$ngUndo$').join(attrs.ngCronUndo|| "")
                .split('$ngRedo$').join(attrs.ngCronRedo|| "")
                .split('$ngChange$').join(attrs.ngCronChange|| "")
                .split('$ngDirty$').join(attrs.ngCronDirty|| "")
                .split('$ngRemove$').join(attrs.ngRemove|| "")
                .split('$ngExecCommand$').join(attrs.ngExecCommand|| "")
                .split('$ngPastePreProcess$').join(attrs.ngPastePreProcess|| "")
                .split('$ngPastePostProcess$').join(attrs.ngPastePostProcess|| "")
                .split('$ngAddEditor$').join(attrs.ngAddEditor|| "")
                .split('$ngRemoveEditor$').join(attrs.ngRemoveEditor|| "")
                .split('$id$').join(attrs.id || app.common.generateId())
                .split('$options$').join(escape(tinyMCEOptions))
            );

            var x = angular.element(templateDyn);
            element.html('');
            element.append(x);
            element.attr('id' , null);
            $compile(x)(scope);

            let $containerCronRichEditor = $(`cron-rich-editor[ng-model="${attrs.ngModel}"]`);
            let waitRenderTinyMCE = setInterval(() => {
              if ($containerCronRichEditor.find('.mce-container').length) {
                $containerCronRichEditor.find('button').each((idx, button) => {
                  let $button = $(button);
                  let ariaLabel = $button.parent().attr('aria-label') || "";
                  $button.attr('aria-label', ariaLabel);
                });
                clearInterval(waitRenderTinyMCE);
              }
            }, 100);
          }
        };
      })
      .directive('cronDashboardViewer', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {

            function executeDashboard(attrsOptions) {
              var config = JSON.parse(attrsOptions);
              var contextVars = { 'element': element };
              scope.$eval(config.dashboardCommand, contextVars);
            }

            executeDashboard(attrs.options);

            var filterTimeout = null;
            scope.$watch(function(){ return attrs.options }, function(value, old){
              if (value !== old) {

                if (filterTimeout) {
                  clearInterval(filterTimeout);
                  filterTimeout = null;
                }

                filterTimeout = setTimeout(function() {
                  executeDashboard(value);
                }.bind(this), 500);
              }
            });
          }
        };
      })
      .directive('cronReportViewer', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {

            function executeReport(attrsOptions) {
              var config = JSON.parse(attrsOptions);
              var contextVars = { 'element': element };
              scope.$eval(config.reportCommand, contextVars);
            }

            executeReport(attrs.options);

            var filterTimeout = null;
            scope.$watch(function(){ return attrs.options }, function(value, old){
              if (value !== old) {

                if (filterTimeout) {
                  clearInterval(filterTimeout);
                  filterTimeout = null;
                }

                filterTimeout = setTimeout(function() {
                  executeReport(value);
                }.bind(this), 500);
              }
            });


          }
        };
      })
      .directive('cronTimeline', ['$compile', '$parse', function($compile, $parse){
        'use strict';

       var defaultAdvancedTemplate = "<ul class=\"timeline\">\r\n   <timeline-event side=\"\" class=\"ng-scope\" ng-repeat=\"rowData in datasource\">\r\n      <li class=\"timeline-event {{rowData[options.fields.field4] == '2' ? 'timeline-inverted' : ''}}\">\r\n         <timeline-badge class=\"{{$odd ? 'info' : 'warning'}} bounce-in\">\r\n            <div class=\"timeline-badge\">\r\n               <i class=\"glyphicon {{rowData[options.fields.field3] ? rowData[options.fields.field3] : 'glyphicon-check'}}\"><\/i>\r\n            <\/div>\r\n         <\/timeline-badge>\r\n         <timeline-panel class=\"info bounce-in\">\r\n            <div class=\"timeline-panel\">\r\n               <timeline-heading class=\"ng-scope\">\r\n                  <div class=\"timeline-heading\">\r\n                     <h4 class=\"ng-binding ng-scope\">{{rowData[options.fields.field0]}}<\/h4>\r\n                     <p class=\"ng-scope\">\r\n                        <small class=\"text-muted ng-binding\"><i class=\"glyphicon glyphicon-time\"><\/i>{{rowData[options.fields.field1]|mask:options.fields.mask2:options.fields.type1}}<\/small>\r\n                     <\/p>\r\n                  <\/div>\r\n               <\/timeline-heading>\r\n               <p ng-if=\"rowData[options.fields.field2]\" class=\"ng-binding ng-scope\">{{rowData[options.fields.field2]}}<\/p>\r\n            <\/div>\r\n         <\/timeline-panel>\r\n      <\/li>\r\n   <\/timeline-event>\r\n<\/ul>";

        var getExpression = function(dataSourceName) {
          return 'rowData in '.concat(dataSourceName).concat('.data');
        }

        return {
          restrict: 'E',
          require: '?ngModel',
          scope: true,
          priority: 9999998,
          terminal: true,
          link: function(scope, element, attrs, ngModelCtrl) {

            scope.hasValue = value => value !== null && value !== undefined;
            var optionsList = {};
            var dataSourceName = '';

            try {
              optionsList = JSON.parse(attrs.options);
              dataSourceName = optionsList.dataSourceScreen.name;
              var dataSource = eval(optionsList.dataSourceScreen.name);

              scope.options = optionsList;

              if(attrs['ngModel']){
                scope.changeRowDataField = function(rowData){
                  rowData = dataSource.getKeyValues(rowData);
                  var keys = Object.keys(rowData);
                  if(keys.length === 1){
                    rowData = rowData[keys];
                  }
                  return rowData;
                }
              }

              scope.options = optionsList;
              scope.options.fields = {};
              scope.options.randomModel = Math.floor(Math.random() * (9000)) + 1000;

              var visibleColumns = [];

              for (var i = 0; i < optionsList.columns.length; i++) {
                var column = optionsList.columns[i];
                if (column.visible) {
                  visibleColumns.push(optionsList.columns[i]);
                }
              }

              for (var i = 0; i < visibleColumns.length; i++) {
                var column = visibleColumns[i];
                if (column.field && column.dataType == 'Database') {
                  scope.options.fields["security" + i] = column.security;
                  scope.options.fields["field" + i] = column.field;
                  scope.options.fields["type" + i] = column.type;
                  scope.options.fields["mask" + i] = column.format;
                }
              }
            } catch(err) {
              console.log('CronTimeline invalid configuration! ' + err);
            }

            if(scope.options.fields.image && scope.options.imageType != 'do-not-show'){
              scope.options.imageClassPosition = "item-" + scope.options.imageType + '-' + scope.options.imagePosition;
            }

            if(!scope.options.advancedTemplate){
              scope.options.advancedTemplate = defaultAdvancedTemplate;
            }

            var templateDyn = scope.options.advancedTemplate;

            for (let index = 0; index < visibleColumns.length; index++) {
              let column = visibleColumns[index];
              if (column.field && column.dataType === 'Database' && scope.options.fields[`security${index}`]) {
                let find = `ng-if="rowData[options.fields.field${index}]"`;
                let toReplace = `${find} cronapp-security="${scope.options.fields['security' + index]}"`;
                templateDyn = templateDyn.replace(find, toReplace);
              }
            }
            templateDyn = $(templateDyn);

            scope.options.xattrTextPosition = attrs.xattrTextPosition;

            $(element).replaceWith(templateDyn);
            var $element = templateDyn;

            var eventItem = $element.find('timeline-event');
            if($(eventItem).attr('ng-repeat') === "rowData in datasource"){
                eventItem.attr('ng-repeat', getExpression(dataSourceName));
            }

            $compile(templateDyn, null, 9999998)(scope);
          }
        }
      }])
      .directive('cronScheduler', ['$compile', '$translate', function($compile, $translate) {
        return {
          estrict: 'E',
          replace: true,
          initCulture: function() {
            var culture = $translate.use();
            culture = culture.replace(/_/gm, '-');
            var parts = culture.split('-');
            parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
            culture = parts.join('-');
            kendo.culture(culture);
          },
          getSchedulerModel: function(datasourceFields) {
            let model = {
              id: "id", // The "id" of the event is the "taskId" field
              fields: {}
            };
            for(let key in datasourceFields) {
              model.fields[key] = {from: datasourceFields[key].name, validation: { required: !datasourceFields[key].nullable } };
            }

            return model
          },
          mergeSchedulerEventWithDatasourceActive: (datasource, item) => {
            //In order to merge the new event info with the active item from datasorce.
            return Object.assign(datasource.active, item);
          },
          setDatasourceActiveItem: function (datasource, item, keyField) {
            if (item) {
              for (let key in datasource.data) {
                let dsItem = datasource.data[key][keyField];
                if (dsItem !== null && dsItem === item[keyField]) {
                  datasource.active = datasource.copy(datasource.data[key], {});
                  return datasource.active;
                }
              }
              // If item is not present clean active
              datasource.startEditing({});
              return datasource.active;
            }
          },
          getSchedulerProperties: function(options, datasource, scope) {
            let schedulerStartDate = (options.initialDateStrategy === 'Expression' ? scope.$eval(generateBlocklyCall(options.initialDateBlocklyInfo)) : options.initialDate);
            let lastSearchedPeriod = {start: null, end: null};
            let needsToFetchData = function(searchablePeriod) {
              return !angular.equals(lastSearchedPeriod, searchablePeriod);
            };
            let visibleViews = [];
            if(options.views) {
              for(let viewIndex in options.views) {
                let view = options.views[viewIndex];
                if(view.visible) {
                  visibleViews.push(view);
                }
              }
            } else {
              if(options.showDayTab) {
                visibleViews.push('day');
              }
              if(options.showAgendaTab) {
                visibleViews.push('agenda');
              }
              if(options.showMonthTab) {
                visibleViews.push('month');
              }
              if(options.showTimelineTab) {
                visibleViews.push('timeline');
              }
              if(options.showWeekTab) {
                visibleViews.push('week');
              }
              if(options.showWorkWeekTab) {
                visibleViews.push('workWeek');
              }
            }


            let cronSchedulerProperties = {
              dateHeaderTemplate: kendo.template(`#=kendo.toString(date, ${kendo.culture().name.toLowerCase().includes('pt')?'\'ddd dd/M\'':'\'ddd M/dd\''})#`),
              showWorkHours: options.showWorkHours,
              selectable: true,
              date: schedulerStartDate,
              mobile: true,
              allDaySlot: options.allDaySlot,
              messages: {
                editor: {
                  timezone: $translate.instant('TimezoneEvent')
                }
              },
              currentTimeMarker: (options.currentTimeMarker ? {
                updateInterval: 10000,
                useLocalTimezone: false
              } : options.currentTimeMarker),
              views: visibleViews,
              navigate: function(e) {
                //Navigated from
                let view = e.sender.view();

                // The view has:
                // A startDate method which returns the start date of the view.
                // An endDate method which returns the end date of the view.

                //kendo.format("view:: start: {0:d}; end: {1:d};", view.startDate(), view.endDate())
              },
              dataBound: function(e) {
                //Navigated to
                let view = e.sender.view();

                // The view has:
                // A startDate method which returns the start date of the view.
                // An endDate method which returns the end date of the view.

                //kendo.format("view:: start: {0:d}; end: {1:d};", view.startDate(), view.endDate())
              },
              change: (e) => {
                if (e && e.events && e.events.length) {
                  this.setDatasourceActiveItem(datasource, e.events[0], 'id');
                } else {
                  datasource.startInserting({});
                }
                console.log('Active: ', datasource.active);
              },
              edit: function (e) {
                if (options && options.allowCustomAction) {
                  let container = e.container;

                  let btnLabel = options.customActionLabel ? options.customActionLabel : $translate.instant(Details);
                  /* ACTION: ADD custom button */
                  let detailButton = $('<a class="k-button">' + btnLabel + '</a>');

                  //wire its click event
                  detailButton.click(function (e) {
                    scope.safeApply(() => {
                      scope.$eval(generateBlocklyCall(options.customActionBlockly));
                    });
                  });

                  //add the button to the container
                  let buttonsContainer = container.find(".k-edit-buttons");
                  buttonsContainer.append(detailButton);

                }

              },
              dataSource: {
                batch: false, // Enable batch updates
                transport: {
                  read: function(read) {
                    read.data = read.data || {};
                    // verify if lastSearchedPeriod is the same searched now. If so ignore search.
                    if(needsToFetchData(read.data)) {
                      lastSearchedPeriod = read.data;

                      if(jQuery.isEmptyObject(read.data)) {
                        read.data[options.schedulerDataModel.start.name] = schedulerStartDate;
                      }
                      let paramsOData = kendo.data.transports.odata.parameterMap(read.data, 'read');
                      let orderBy = '';
                      let fetchData = {};
                      fetchData.params = paramsOData;
                      datasource.fetch(fetchData, {
                        success: function(data) {
                          read.success(angular.copy(data));
                        },
                        canceled: function(data) {
                          // notify the data source that the request failed
                          read.error(angular.copy(data));
                        }
                      }, false);
                    } else {
                      read.error();
                    }
                  }.bind(this),
                  update: (update) => {
                    let item = this.parseToDatasourceSchema(datasource, update.data, options);
                    datasource.startEditing(datasource.active);
                    this.mergeSchedulerEventWithDatasourceActive(datasource, item);
                    datasource.update(
                        datasource.active,
                        (data) => {
                          let updatedItem = angular.copy(data);
                          update.success(updatedItem);
                          datasource.fetch({}, {
                            success: (allData) => {
                              this.setDatasourceActiveItem(datasource, updatedItem, 'id');
                            },
                            canceled: (data) => {
                              // notify the data source that the request failed
                            }
                          }, false);
                        },
                        (data) => {
                          update.error(angular.copy(data));
                        }
                    );
                  },
                  create: (create) => {
                    let item = this.parseToDatasourceSchema(datasource, create.data, options);
                    this.mergeSchedulerEventWithDatasourceActive(datasource, item);
                    datasource.insert(
                        datasource.active,
                        (data) => {
                          let newItem = angular.copy(data);
                          create.success(newItem);
                          datasource.fetch({}, {
                            success: (allData) => {
                              this.setDatasourceActiveItem(datasource, newItem, 'id');
                            },
                            canceled: function(data) {
                              // notify the data source that the request failed
                            }
                          }, false);
                        },
                        (data) => {
                          create.error(angular.copy(data));
                        }
                    );
                  },
                  destroy: function(destroy) {
                    datasource.removeSilent(
                        this.parseToDatasourceSchema(datasource, destroy.data, options),
                        function(data) {
                          destroy.success(angular.copy(data));
                        },
                        function(data) {
                          destroy.error(angular.copy(data));
                        }
                    );
                  }.bind(this)
                },
                schema: {
                  model: this.getSchedulerModel(options.schedulerDataModel)
                }
              }
            };
            if(!options.views) {
              cronSchedulerProperties.editable = options.editable;
            }
            if(window.fixedTimeZone && window.timeZone) {
              cronSchedulerProperties.timezone = window.timeZone;
            }
            return cronSchedulerProperties;
          },
          showError: function(scope, title, message) {
            let info = {
              message: message,
              title: title,
              delay: null
            };
            scope.Notification.error(info);
          },
          parseToDatasourceSchema: function(datasource, object, options) {
            let parsedObj = {};
            //Antigo parse setava nulo no campo title (se viesse vazio e quebrava o kendo na visualização do tipo mensal)
            for(let key in datasource.schema) {
              let name = datasource.schema[key].name;
              parsedObj[name] = object[name];
            }

            parsedObj[options.schedulerDataModel.isAllDay.name] = parsedObj[options.schedulerDataModel.isAllDay.name] === true;
            if (!parsedObj[options.schedulerDataModel.id.name])
              delete parsedObj[options.schedulerDataModel.id.name];
            return parsedObj;
          },
          link: function(scope, element, attrs, ngModelCtrl) {
            let schedulerElement = $('<div></div>');
            let options = JSON.parse(attrs.options || "{}");
            let datasource;
            if(options.dataSourceScreen && options.dataSourceScreen.entityDataSource) {
              datasource = eval(options.dataSourceScreen.entityDataSource.name);
            }
            //Validate Component Configuration
            if(!datasource) {
              // There is no Datasource
              let errorObject = {};
              $translate('DatasourceNotFoundMessage').then((datasourceNotFoundMessage) => {
                errorObject.message = datasourceNotFoundMessage;
                return $translate('Scheduler');
              }).then((scheduler) => {
                errorObject.component = scheduler;
                return $translate('DatasourceNotFoundTitle');
              }).then((datasourceNotFoundTitle) => {
                errorObject.title = datasourceNotFoundTitle;
                this.showError(scope, errorObject.title, errorObject.message.replace('{0}', errorObject.component));
              });
              return;
            }else if(jQuery.isEmptyObject(options.schedulerDataModel)){
              //TODO ADD Message to not relation fields added
              return;
            }

            let baseUrl = 'node_modules/cronapp-lib-js/dist/js/kendo-ui/js/messages/kendo.messages.';
            if($translate.use() === 'pt_br') {
              baseUrl += "pt-BR.min.js";
            } else {
              baseUrl += "en-US.min.js";
            }

            this.initCulture();

            $.getScript(baseUrl, function() {

              let kendoDatasource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, true, options.dataSourceScreen.rowsPerPage);

              let schedulerProperties = this.getSchedulerProperties(options, datasource, scope);

              schedulerElement.kendoScheduler(schedulerProperties);

              // Get reference to the kendo.ui.Scheduler instance
              let scheduler = schedulerElement.data("kendoScheduler");
              let lastView;

              scheduler.bind('navigate', function(e) {
                scheduler._previousView = e.sender.view();
              });
              scheduler.bind('dataBound', function(e) {
                scheduler._currentView = e.sender.view();
                if(scheduler._previousView) {
                  let sameView = compare(scheduler._previousView._dates, scheduler._currentView._dates);
                  if(!sameView) {
                    let params = {};
                    params[options.schedulerDataModel.start.name] = scheduler._currentView._startDate;
                    params[options.schedulerDataModel.end.name] = scheduler._currentView._endDate;
                    scheduler.dataSource.read(params);
                    scheduler._previousView = scheduler._currentView;
                  }
                }

              });

              function compare(arr1, arr2) {
                if(!arr1 || !arr2) return
                let result;
                arr1.forEach((e1, i) => arr2.forEach(e2 => {
                  if(e1.getTime() !== e2.getTime()) {
                    result = false
                  } else {
                    result = true
                  }
                }));
                return result
              }
            }.bind(this));

            element.html(schedulerElement);
            $compile(schedulerElement)(element.scope());
          }
        }
      }])


      .directive('cronGrid', ['$compile', '$translate', function($compile, $translate) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          initCulture: function() {
            var culture = $translate.use();
            culture = culture.replace(/_/gm,'-');
            var parts = culture.split('-');
            parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
            culture = parts.join('-');
            kendo.culture(culture);
          },
          changeObjectField: function(dataSource, obj){
            obj = dataSource.getKeyValues(obj);
            var keys = Object.keys(obj);
            if(keys.length === 1){
              obj = obj[keys];
            }
            return obj;
          },
          removeSpecialChar: function(value) {
              return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          },
          generateToolbarButtonCall: function(toolbarButton, scope, options, attrs) {
            var buttonCall;
            var generateObjTemplate = function(functionToCall, title, iconClass) {
              var obj = {
                template: function() {
                  return createTemplateButton(functionToCall, title, iconClass);
                }.bind(this)
              };
              return obj;
            }.bind(this);

            var createTemplateButton = function(functionToCall, title, iconClass) {
              var template = '';

              let security = toolbarButton.security ? `cronapp-security="${toolbarButton.security}"` : "";

              let modelName = this.removeSpecialChar(attrs.ngModel);
              let buttonType = this.removeSpecialChar(toolbarButton.type);
              let buttonDesc = toolbarButton.title ? this.removeSpecialChar(toolbarButton.title): this.removeSpecialChar(toolbarButton.iconClass);
              let buttonId = `${modelName}-${buttonType}-${buttonDesc}`;

              if (toolbarButton.type == "SaveOrCancelChanges") {
                if (toolbarButton.saveButton)
                  template = '<a #SECURITY# role="button" class="saveorcancelchanges k-button k-button-icontext k-grid-save-changes" data-id="#BUTTONID#" href="javascript:void(0)"><span class="k-icon k-i-check"></span>#TITLE#</a>';
                else
                  template = '<a #SECURITY# role="button" class="saveorcancelchanges k-button k-button-icontext k-grid-cancel-changes" data-id="#BUTTONID#" href="javascript:void(0)"><span class="k-icon k-i-cancel" ></span>#TITLE#</a>';
              }
              else if (toolbarButton.type == "Blockly" || toolbarButton.type == "Customized") {
                template = '<a #SECURITY# class="k-button k-grid-custom" data-id="#BUTTONID#" href="javascript:void(0)"><span class="#ICONCLASS#" ></span>#TITLE#</a>';
              }
              else if (toolbarButton.type == "Native" && toolbarButton.title == 'create') {
                template = '<a #SECURITY# role="button" data-id="#BUTTONID#" class="k-button k-button-icontext k-grid-add" href="javascript:void(0)"><span class="k-icon k-i-plus"></span>{{"Add" | translate}}</a>';
              }
              else if (toolbarButton.type == "Native" && toolbarButton.title == 'excel') {
                template = '<a #SECURITY# role="button" data-id="#BUTTONID#" class="k-button k-button-icontext k-grid-excel" href="javascript:void(0)"><span class="k-icon k-i-file-excel"></span>{{"exportExcel" | translate}}</a>';
              }
              else if (toolbarButton.type == "Native" && toolbarButton.title == 'pdf') {
                template = '<a #SECURITY# role="button" data-id="#BUTTONID#" class="k-button k-button-icontext k-grid-pdf" href="javascript:void(0)"><span class="k-icon k-i-file-pdf"></span>{{"exportPDF" | translate}}</a>';
              }

              template = template
                  .split('#BUTTONID#').join(buttonId)
                  .split('#FUNCTIONCALL#').join(this.encodeHTML(functionToCall))
                  .split('#TITLE#').join(title)
                  .split('#ICONCLASS#').join(iconClass)
                  .split('#SECURITY#').join(security);

              var cronappDatasource = eval(options.dataSourceScreen.entityDataSource.name);

              var waitRender = setInterval(function() {
                if ($(`[data-id=${buttonId}]`).length > 0) {
                  scope.safeApply(function() {
                    var x = angular.element($(`[data-id=${buttonId}]`));
                    $compile(x)(scope);
                    $(`[data-id=${buttonId}]`).attr('id', buttonId);
                  });

                  $(`[data-id=${buttonId}]`).click(function() {

                    var currentGrid = options.refComponent;
                    var selectedRows = [];
                    currentGrid.select().each(function() {
                      var gridRow = currentGrid.dataItem(this);
                      cronappDatasource.data.forEach(function(dsRow) {
                        if (dsRow.__$id == gridRow.__$id)
                          selectedRows.push(dsRow);
                      });
                    });

                    var consolidated = {
                      item: selectedRows.length ? cronappDatasource.active : null,
                      index: selectedRows.length ? cronappDatasource.cursor : null
                    }

                    let selectedRowsKeyOrObj = [];
                    if(options.fieldType && options.fieldType === 'key') {
                      selectedRows.forEach(item => {
                        selectedRowsKeyOrObj.push(this.changeObjectField(cronappDatasource, cronappDatasource.findObjInDs(item)));
                      });
                    }
                    else {
                      selectedRowsKeyOrObj = selectedRows;
                    }

                    var contextVars = {
                      'currentData': cronappDatasource.data,
                      'datasource': cronappDatasource.copyWithoutAngularObj(),
                      'selectedIndex': selectedRows.length ? cronappDatasource.cursor : null,
                      'index': selectedRows.length ? cronappDatasource.cursor : null,
                      'selectedRow': selectedRows.length ? cronappDatasource.active : null,
                      'consolidated': consolidated,
                      'item': selectedRows.length ? cronappDatasource.active : null,
                      'selectedKeys': selectedRows.length ? cronappDatasource.getKeyValues(cronappDatasource.findObjInDs(selectedRows[0]), true) : null,
                      'selectedRows': selectedRowsKeyOrObj
                    };

                    scope.$eval(functionToCall, contextVars) ;
                  }.bind(this));

                  clearInterval(waitRender);
                }
              }.bind(this),200);

              return template;
            }.bind(this);

            var call = '';
            if (toolbarButton.type == 'Customized')
              call = toolbarButton.execute;
            else if (toolbarButton.methodCall)
              call = toolbarButton.methodCall;
            else
              call = generateBlocklyCall(toolbarButton.blocklyInfo);

            var title = toolbarButton.title == undefined ? '': toolbarButton.title;
            buttonCall = generateObjTemplate(call, title, toolbarButton.iconClass);
            return buttonCall;
          },
          generateModalSaveOrCancelButtonCall: function(buttonType, functionToCall, datasourceName, modalId, scope) {

            var buttonId = app.common.generateId();
            var compileTemplateAngular = function(buttonType, functionToCall, datasourceName, modalId) {
              var template;
              if (buttonType == 'save')
                template = '<button id="#BUTTONID#" aria-label="#ARIALABELSAVE#" class="btn btn-primary btn-fab ng-binding grid-save-button-modal k-button" data-component="crn-button" ng-click="#FUNCTIONCALL#" onclick="(!#DATASOURCENAME#.missingRequiredField(true)?$(\'##MODALID#\').modal(\'hide\'):void(0))"><span class="k-icon k-i-check"></span></button>';
              else if (buttonType == 'saveAdd')
                template = '<button id="#BUTTONID#" aria-label="#ARIALABELSAVEADD#" class="btn btn-primary btn-fab ng-binding grid-save-add-button-modal k-button" data-component="crn-button" ng-click="#FUNCTIONCALL#"><span class="k-icon k-i-plus"></span></button>';
              else
                template = '<button id="#BUTTONID#" aria-label="#ARIALABELCANCEL#" type="button" class="btn btn-default btn-fab ng-binding k-button" data-component="crn-button" data-dismiss="modal"><span class="k-icon k-i-cancel"></span></button>'
              template = template
                  .split('#BUTTONID#').join(buttonId)
                  .split('#FUNCTIONCALL#').join(functionToCall)
                  .split('#DATASOURCENAME#').join(datasourceName)
                  .split('#ARIALABELSAVE#').join($translate.instant('SaveChanges'))
                  .split('#ARIALABELSAVEADD#').join($translate.instant('SaveAddChanges'))
                  .split('#ARIALABELCANCEL#').join($translate.instant('CancelChanges'))
                  .split('#MODALID#').join(modalId);

              var waitRender = setInterval(function() {
                if ($('#' + buttonId).length > 0) {
                  scope.safeApply(function() {
                    var x = angular.element($('#' + buttonId ));
                    $compile(x)(scope);
                    clearInterval(waitRender);
                  });
                }
              },200);

              return template;
            };
            buttonCall = compileTemplateAngular(buttonType, functionToCall, datasourceName, modalId);
            return buttonCall;
          },
          addButtonsInModal: function(modal, datasourceName, scope, saveAdd) {
            var $footerModal = $('#' + modal).find('.modal-footer');
            if (!$footerModal.find('.grid-save-button-modal').length) {
              var functionToCall = datasourceName + '.post();'
              var buttonSave = this.generateModalSaveOrCancelButtonCall('save', functionToCall, datasourceName, modal, scope);
              $footerModal.append(buttonSave);

              if (saveAdd) {
                let buttonSaveAdd = this.generateModalSaveOrCancelButtonCall('saveAdd', functionToCall + datasourceName + '.startInserting();', datasourceName, modal, scope);
                $footerModal.append(buttonSaveAdd);
              }

              var buttonCancel = this.generateModalSaveOrCancelButtonCall('cancel', null, null, null, scope);
              $footerModal.append(buttonCancel);
            }
          },
          getObjectId: function(obj) {
            if (!obj)
              obj = "";
            else if (obj instanceof Date) {
              var momentDate = moment.utc(obj);
              obj = new Date(momentDate.format('YYYY-MM-DDTHH:mm:ss'));
            }
            else if (typeof obj === 'object') {
              //Verifica se tem id, senão pega o primeiro campo
              if (obj["id"])
                obj = obj["id"];
              else {
                for (var key in obj) {
                  obj = obj[key];
                  break;
                }
              }
            }
            return obj;
          },
          encodeHTML: function(value){
            return value.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
          },
          decodeHTML: function(value){
            return value.replace(/&apos;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
          },
          getColumnByField: function(options, fieldName) {
            var selected = null;
            options.columns.forEach(function(column)  {
              if (column.field == fieldName)
                selected = column;
            });
            return selected;
          },

          resizeGridUsingWidthForDevice: function(grid){
            for (let idx = 0; idx < grid.columns.length; idx++) {
              let widthDevice = this.getWidthForDevice(grid.columns[idx]);
              grid.columns[idx].width = widthDevice.width;
              if (!widthDevice.visible)
                grid.hideColumn(idx);
              else
                grid.showColumn(idx);
            }
            if (grid.options.hasSecurity) {
              let $lastCol = $(grid.element.find('col')).last();
              $lastCol.css('width','0px');
            }
          },

          getWidthForDevice: function(column) {
            let widthDeviceBig = 1210;
            let widthDeviceDesktop = 1002;
            let widthDeviceMedium = 778;
            let widthDeviceSmall = 424;

            let currentWindowWidth = $(window).width();

            let getDevice = function(device) {
              let wd;
              column.widthDevices.forEach( d => {
                if (d.device === device)
                  wd = d;
              });

              //Se não tiver definido o width para determinada resolução procura a proxima acima, se n tiver acima, pega a que existir
              if (wd === undefined) {
                if (device === "deviceSmall")
                  wd = getDevice("deviceMedium");
                else if (device === "deviceMedium")
                  wd = getDevice("deviceDesktop");
                else if (device === "deviceDesktop")
                  wd = getDevice("deviceBig");
                else
                  wd = column.widthDevices[0];
              }
              return wd;
            };


            let widthDevice = { width: column.width };
            if (column.visible !== undefined && column.visible !== null)
              widthDevice.visible = column.visible;
            else
              widthDevice.visible = !column.hidden;

            if (column.widthDevices !== null && column.widthDevices !== undefined && column.widthDevices.length > 0) {
              if (currentWindowWidth >= widthDeviceBig)
                widthDevice = getDevice("deviceBig");
              else if (currentWindowWidth >= widthDeviceDesktop && currentWindowWidth < widthDeviceBig)
                widthDevice = getDevice("deviceDesktop");
              else if (currentWindowWidth >= widthDeviceMedium && currentWindowWidth < widthDeviceDesktop)
                widthDevice = getDevice("deviceMedium");
              else
                widthDevice = getDevice("deviceSmall");
            }
            return widthDevice;
          },

          getColumns: function(options, datasource, scope, tooltips, attrs) {
            var helperDirective = this;

            function getTemplate(column) {
              var template = "#=showTreatedValue("+column.field+")#";
              if (column.inputType == 'switch') {
                template =
                    '<span class="k-switch km-switch k-widget km-widget k-switch-off km-switch-off" style="width: 100%">\
                  <span class="k-switch-wrapper km-switch-wrapper">\
                    <span class="k-switch-background km-switch-background" style="margin-left: #=' + column.field + ' ? "80%": "0%" #"></span>\
                  </span>\
                  <span class="k-switch-container km-switch-container">\
                    <span class="k-switch-handle km-switch-handle" style=#=' + column.field + ' ? "float:right;margin-right:-1px": "margin-left:0%" #>\
                    </span>\
                  </span>\
                </span>';
              }
              else if (column.inputType == 'checkbox' || column.type == 'boolean') {
                template = "<input crn-set-indeterminate=#=" + column.field + "# type='checkbox' class='k-checkbox' #=" + column.field + " ? \"checked='checked'\": '' # />" +
                    "<label class='k-checkbox-label k-no-text'></label>"
              }
              else if (column.displayField && column.displayField.length > 0) {
                if (hasMask(column.type) || (column.format && column.format != 'null')) {
                  template = "#= useMask("+column.displayField+",'"+column.format+"','"+column.type+"') #";
                }
                else {
                  template = "#="+column.displayField+"#";
                }
              }
              else if (hasMask(column.type) || (column.format && column.format != 'null')   ) {
                template = "#= useMask("+column.field+",'"+column.format+"','"+column.type+"') #";
              }
              else if (column.showAsImage) {
                template = column.showAsImageTemplate ? column.showAsImageTemplate :  "<img src='#:${column.field}#'/>";
                template = eval('`' + template + '`');
              }
              return template;
            }

            function hasMask(type){
              if(type && (typeof type === "string")){
                return (type.startsWith('date') || type.startsWith('month')
                    || type.startsWith('time') || type.startsWith('week')
                    || type.startsWith('money') || type.startsWith('number')
                    || type.startsWith('tel') || type.startsWith('integer'));
              }else{
                return false;
              }
            }

            function getFormat(column) {
              if (!hasMask(column.type))
                return column.format;
              return undefined;
            }

            function isRequired(fieldName) {
              var required = false;
              var selected = null;
              if (datasource.schema.model.fields[fieldName]){
                selected = datasource.schema.model.fields[fieldName];
              }
              if (selected)
                required = !selected.nullable;
              return required;
            }

            function getEditor(column) {
              return editor.bind(this);
            }

            async function editor(container, opt) {

              let compileAfterRender = (componentId) => {
                return new Promise((resolve, reject) => {
                  let waitRender = setInterval(function() {
                    let $myElement = $('#' + componentId);
                    if ($myElement.length > 0) {
                      let $closeTdElemen = $myElement.closest('td');
                      let x = angular.element($closeTdElemen || $myElement);
                      $compile(x)(scope);
                      clearInterval(waitRender);
                      resolve(componentId);
                    }
                  },10);
                });
              };

              let changeGridModel = (value) => {
                if (value !== opt.model[opt.field]) {
                  opt.model[opt.field] = value;
                  opt.model.dirty = true;
                  opt.model.dirtyFields[opt.field] = true;
                }
              };

              var column = this.getColumnByField(options, opt.field);
              if (column.visibleCrud != undefined && !column.visibleCrud) {
                container.parent().find('.k-edit-label [for='+ column.field +']').parent().remove();
                container.remove();
              }
              var required = isRequired(opt.field) ? "required" : "";
              var buttonId = app.common.generateId();

              let ngModel = `${options.dataSourceScreen.name}.active.${opt.field}`;
              var $input = $(`<input ${required} name="${opt.field}" id="${buttonId}" from-grid=true ng-model="${ngModel}" />`); //
              $input.data('change-grid-model', changeGridModel);
              $input.data('column-type', column.type);

              if (column.inputType == 'dynamicComboBox' || column.inputType == 'comboBox') {
                var kendoConfig = app.kendoHelper.getConfigComboboxSync(column.comboboxOptions, scope);
                kendoConfig.autoBind = true;
                kendoConfig.optionLabel = undefined;
                if (column.displayField) {
                  kendoConfig.change = function(e) {
                    opt.model.set(column.displayField, this.text());
                    opt.model.dirty = true;
                    opt.model.dirtyFields[column.displayField] = true;
                  }
                }
                let dropdown = $input.appendTo(container).kendoDropDownList(kendoConfig, scope).data('kendoDropDownList');
                $input.data('kendoDropDownList', dropdown);
              }
              else if (column.inputType == 'slider') {
                var kendoConfig = app.kendoHelper.getConfigSlider(column.sliderOptions);
                kendoConfig.change = (e) => scope.$apply(() => scope.$eval(`${ngModel}=${e.value}`));
                let slider = $input.appendTo(container).kendoSlider(kendoConfig, scope).data('kendoSlider');
                $input.data('kendoSlider', slider);
              }
              else if (column.inputType == 'switch') {
                var kendoConfig = app.kendoHelper.getConfigSwitch(column.switchOptions);
                $input.appendTo(container).kendoMobileSwitch(kendoConfig, scope);
              }
              else if (column.inputType == 'checkbox' || column.type == 'boolean') {
                $input = $(`<input id="${buttonId}" name="${opt.field}" ng-false-value="false" ng-true-value="true" crn-allow-null-values="${!required}" class="k-checkbox" type="checkbox" from-grid=true ng-model="${ngModel}"><label class="k-checkbox-label" for="${buttonId}"></label>`);
                $input.data('change-grid-model', changeGridModel);
                $input.appendTo(container);
              }
              else if (column.inputType == 'date') {
                $input.attr('cron-date', '');
                $input.attr('options', JSON.stringify(column.dateOptions));
                $input.data('initial-date', opt.model[opt.field]);
                $input.attr('type', "datetime");
                $input.appendTo(container).off('change');
              }
              else {
                $input.attr('type', column.type);
                $input.attr('mask', column.format ? column.format : '');
                if (column.format === '999.999.999-99;0' || column.format === '99.999.999/9999-99;0') {
                  $input.attr('valid', column.format === '999.999.999-99;0' ? 'cpf' : 'cnpj');
                  $input.attr('data-' + column.field.toLocaleLowerCase() + 'validation-msg', $translate.instant('invalid.' + $input.attr('valid')));
                }
                $input.css('text-align', column.alignment);
                $input.attr('class', 'k-input k-textbox');
                $input.data('initial-value', opt.model[opt.field]);
                $input.appendTo(container);
              }

              compileAfterRender(buttonId).then((resultId) => {
                $(`#${resultId}`).data('alreadycompiled', true);
                $(`#${resultId}`).data('$compile', $compile);
                $(`#${resultId}`).data('ref-component', options.refComponent)
              });

            }

            function setIdCommandButton(idForCommand, command) {
              let waitRender = setInterval(() => {
                if ($(`.k-grid-${idForCommand}`).is(":visible")) {
                  clearInterval(waitRender);
                  var currentGrid = options.refComponent;

                  $(`.k-grid-${idForCommand}`).each((idx,elem) => {
                    let $elem = $(elem);
                    if (!$elem.attr('id')) {
                      let item = currentGrid.dataItem($elem.closest('tr'));

                      let modelName = this.removeSpecialChar(attrs.ngModel);
                      let key = item["_objectKey"];
                      let id = `${modelName}-${command}-${key}`;
                      $elem.attr('id', id);
                    }
                  });

                }
              }, 200);
            }

            function getCommandForEditButtonDatabase(opt, command) {
              var cmd;
              let idForCommand = app.common.generateId();
              let ariaLabel = $translate.instant('Edit');
              let template = `<a href class='k-button k-grid-edit k-grid-${idForCommand}' aria-label='${ariaLabel}'><span class='k-icon k-i-edit'></span></a>`;
              if ((opt.editable == 'popupCustom') || (opt.editable == 'datasource')) {
                cmd = {
                  name: idForCommand,
                  template: template,
                  click: function(e) {
                    e.preventDefault();
                    var tr = $(e.target).closest("tr");
                    var grid = tr.closest('table');
                    var item = this.dataItem(tr);
                    var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                    scope.safeApply(function() {
                      if (!options.hideModalButtons) {
                        helperDirective.addButtonsInModal(options.popupEdit, cronappDatasource.name, scope, false);
                      }

                      var currentItem = cronappDatasource.goTo(item);
                      cronappDatasource.startEditing(currentItem, function(xxx) {});
                      if (opt.editable != 'datasource') {
                        cronapi.screen.showModal(options.popupEdit);
                      }
                      else {
                        cronapi.internal.focusFormInput();
                      }
                    });
                    return;
                  }
                };
              }
              else {
                cmd = {
                  name: command,
                  template: template,
                  text: { edit: " ", update: " ", cancel: " " },
                };
              }
              setIdCommandButton.bind(this)(idForCommand, command);
              return cmd;
            }

            function getCommandForRemoveButtonDatabase(opt, command) {
              var cmd;
              let idForCommand = app.common.generateId();
              let ariaLabel = $translate.instant('Remove');
              let template = `<a href class='k-button k-grid-delete k-grid-${idForCommand}' aria-label='${ariaLabel}'><span class='k-icon k-i-close'></span></a>`;

              if ((opt.editable == 'popupCustom') || (opt.editable == 'datasource')) {
                cmd = {
                  name: idForCommand,
                  template: template,
                  click: function(e) {
                    e.preventDefault();
                    var tr = $(e.target).closest("tr");
                    var item = this.dataItem(tr);
                    var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                    var self = this;
                    scope.safeApply(function() {
                      var currentItem = cronappDatasource.goTo(item);
                      cronappDatasource.remove(currentItem);
                    });
                  }
                };
              } else {
                cmd = {
                  name: command,
                  template: template
                };
              }
              setIdCommandButton.bind(this)(idForCommand, command);
              return cmd;
            }

            function getAggregate(column) {
              if (column && column.aggregates) {
                var aggregates = [];
                column.aggregates.forEach(function(a) {
                  aggregates.push(a.type);
                });
                if (aggregates.length > 0)
                  return aggregates;
              }
              return undefined;
            }

            function getAggregateFooter(column, group) {
              if (column && column.aggregates) {
                var footer = [];
                column.aggregates.forEach(function(a) {

                  var typeForLabel = '#=data.' + column.field + ' ? data.' + column.field + '.' + a.type + ' : 0 #';
                  if (a.type == 'average' || a.type == 'sum') {
                    typeForLabel = "#=useMask(data." + column.field  + " ? data." + column.field + "." + a.type + " : 0" + ",'" + column.format + "','" + column.type + "')#";
                  }

                  var typeForTemplate = group ? a.groupFooterTemplate : a.footerTemplate;

                  if (typeForTemplate) {
                    typeForTemplate = typeForTemplate + ': ';
                  } else {
                    typeForTemplate = '';
                  }

                  var footerTemplate = typeForTemplate + typeForLabel;

                  if (column.alignment) {
                    // alinha o rodapé ao conteúdo quando o alinhamento selecionado for 'Direita'
                    if (column.alignment === 'right' && !group) {
                      footerTemplate = '<div style="text-align: ' + column.alignment + '" class="k-fix-margin">' + footerTemplate + '</div>';
                    } else {
                      footerTemplate = '<div style="text-align: ' + column.alignment + '">' + footerTemplate + '</div>';
                    }
                  }

                  footer.push(footerTemplate);
                });
                return footer.join('<br/>');
              }
              return undefined;
            }

            function getAggregateHeader(column) {
              if (hasMask(column.type) || (column.format && column.format != 'null')) {
                return column.headerText +": #=useMask(value,'"+column.format+"','"+column.type+"')#";
              }
              return undefined;
            }

            function getAttributes(column) {
              let attributes = {};
              if (column) {
                if (column.alignment) {
                  attributes["style"] = "text-align: " + column.alignment + ";"
                }
                if (column.security) {
                  attributes["cronapp-security"] = column.security;
                }
              }
              return attributes;
            }

            var columns = [];
            if (options.columns) {
              options.columns.forEach(function(column)  {

                let widthDevice = this.getWidthForDevice(column);

                if (column.dataType == "Database") {

                  var addColumn = {
                    field: column.field,
                    title: column.headerText,
                    type: column.type,
                    width: widthDevice.width,
                    sortable: column.sortable,
                    filterable: column.filterable,
                    hidden: !widthDevice.visible
                  };
                  addColumn.template = getTemplate(column);
                  addColumn.format = getFormat(column);
                  addColumn.editor = getEditor.bind(this)(column);
                  addColumn.aggregates = getAggregate(column);
                  addColumn.footerTemplate = getAggregateFooter(column, false);
                  addColumn.groupFooterTemplate = getAggregateFooter(column, true);
                  addColumn.groupHeaderTemplate = getAggregateHeader(column);
                  addColumn.attributes = getAttributes(column);
                  addColumn.headerAttributes = addColumn.attributes;
                  addColumn.widthDevices = column.widthDevices;
                  columns.push(addColumn);
                }
                else if (column.dataType == "Command") {
                  //Se não for editavel, não adiciona colunas de comando
                  if (options.editable != 'no') {
                    var command = column.command.split('|');

                    var commands = [];
                    command.forEach(function(f) {
                      var cmd;
                      if ( f == "edit") {
                        cmd = getCommandForEditButtonDatabase.bind(this)(options, f);
                      }
                      else {
                        cmd = getCommandForRemoveButtonDatabase.bind(this)(options, f);
                      }
                      commands.push(cmd);
                    }.bind(this));

                    var addColumn = {
                      command: commands,
                      title: column.headerText,
                      width: widthDevice.width ? widthDevice.width : 155,
                      hidden: !widthDevice.visible,
                      attributes: getAttributes(column)
                    };
                    columns.push(addColumn);
                  }
                }
                else if (column.dataType == "Blockly" || column.dataType == "Customized" || column.dataType == "CustomizedLink") {
                  var label = column.label == undefined ? '': column.label;
                  if (column.iconClass && label)
                    label = '&nbsp;' + label;

                  var className = '';
                  if (column.dataType == "CustomizedLink") {
                    className = 'k-custom-link';
                  }
                  else {
                    className = 'k-custom-command' + (label ? ' k-button-with-label' : '');
                  }
                  if (column.theme)
                    className += ' ' + column.theme;

                  var tooltip = '';
                  if (column.tooltip && column.tooltip.length)
                    tooltip = column.tooltip;

                  if (tooltip)  {
                    var classForTooltip = app.common.generateId();
                    tooltips[classForTooltip] = tooltip;
                    className += ' ' + classForTooltip;
                  }

                  let idForCommand = app.common.generateId();
                  let ariaLabel = tooltip || label || idForCommand;
                  let template = `<a href class='k-button ${className} k-grid-${idForCommand}' aria-label='${ariaLabel}'><span class='${column.iconClass}'></span>${label}</a>`;

                  var addColumn = {
                    command: [{
                      name: idForCommand,
                      template: template,
                      click: function(e) {
                        e.preventDefault();
                        var tr = $(e.target).closest("tr");
                        var grid = tr.closest('table');

                        var itemAsObj = this.dataItem(tr);
                        var item = this.dataItem(tr);
                        var index = $(grid.find('tbody')[0]).children().index(tr)


                        var call = undefined;
                        if (column.dataType == "Customized" || column.dataType == "CustomizedLink")
                          call = column.execute;
                        else
                          call = generateBlocklyCall(column.blocklyInfo);

                        var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                        var currentGrid = options.refComponent;
                        var selectedRows = [];
                        currentGrid.select().each(function() {
                          var gridRow = currentGrid.dataItem(this);
                          cronappDatasource.data.forEach(function(dsRow) {
                            if (dsRow.__$id == gridRow.__$id)
                              selectedRows.push(dsRow);
                          });
                        });

                        if (!(cronappDatasource.inserting || cronappDatasource.editing)) {
                          var tr = e.currentTarget.parentElement.parentElement;
                          this.select(tr);
                        }

                        let selectedRowsKeyOrObj = [];
                        if(options.fieldType && options.fieldType === 'key') {
                          item = helperDirective.changeObjectField(cronappDatasource, cronappDatasource.findObjInDs(item));
                          selectedRows.forEach(row => {
                            selectedRowsKeyOrObj.push(helperDirective.changeObjectField(cronappDatasource, cronappDatasource.findObjInDs(row)));
                          });
                        }
                        else {
                          selectedRowsKeyOrObj = selectedRows;
                        }

                        var consolidated = {
                          item: item,
                          index: index
                        }

                        var contextVars = {
                          'currentData': cronappDatasource.data,
                          'datasource': cronappDatasource.copyWithoutAngularObj(),
                          'selectedIndex': index,
                          'index': index,
                          'selectedRow': item,
                          'consolidated': consolidated,
                          'item': item,
                          'selectedKeys': cronappDatasource.getKeyValues(cronappDatasource.findObjInDs(itemAsObj), true),
                          'selectedRows': selectedRowsKeyOrObj
                        };

                        cronappDatasource.goTo(itemAsObj);
                        scope.$eval(call, contextVars);
                        return;
                      }
                    }],
                    width: widthDevice.width,
                    title: column.headerText ? column.headerText: '',
                    hidden: !widthDevice.visible,
                    attributes: getAttributes(column)
                  };
                  columns.push(addColumn);
                  setIdCommandButton.bind(this)(idForCommand, column.dataType);
                }
                else if (column.dataType == "Selectable") {
                  var checkColumn = {
                    selectable: true,
                    attributes: getAttributes(column)
                  };
                  columns.push(checkColumn);
                }
              }.bind(this));
            }

            return columns;
          },
          getPageAble: function(options) {
            var pageable = {
              refresh:  options.allowRefreshGrid,
              pageSizes: options.allowSelectionTotalPageToShow,
              buttonCount: 5
            };

            if (!options.allowPaging)
              pageable = options.allowPaging;

            return pageable;
          },
          getToolbar: function(options, scope, attrs) {

            function generateToolbarTemplate(toolbarButton) {
              let security = toolbarButton.security ? `cronapp-security="${toolbarButton.security}" class` : "class";
              if (toolbarButton.template)
                toolbarButton.template = toolbarButton.template.split("class").join(security);
              let buttonTemplate =  { template: toolbarButton.template };
              return buttonTemplate;
            }

            var toolbar = [];

            options.toolBarButtons.forEach(function(toolbarButton) {
              if (toolbarButton.type == "Native") {
                //Se a grade for editavel, adiciona todos os commands
                if (options.editable != 'no') {
                  if ((options.editable == 'datasource' || options.editable == 'popupCustom') &&  toolbarButton.title == 'create') {
                    var datasourceName = options.dataSourceScreen.name;
                    var popupInsert = options.popupInsert;
                    toolbarButton.methodCall = datasourceName + ".startInserting();";
                    if (options.editable == 'popupCustom') {
                      toolbarButton.methodCall = toolbarButton.methodCall + " cronapi.screen.showModal('"+popupInsert+"');";
                    }
                    else {
                      toolbarButton.methodCall += "cronapi.internal.focusFormInput();"
                    }
                    var button = this.generateToolbarButtonCall(toolbarButton, scope, options, attrs);
                    toolbar.push(button);

                    if (!options.hideModalButtons) {
                      this.addButtonsInModal(popupInsert, datasourceName, scope, options.enableModalSaveAdd);
                    }
                  }
                  else {
                    let toolbarOp = this.generateToolbarButtonCall(toolbarButton, scope, options, attrs);
                    toolbar.push(toolbarOp);
                  }
                }
                //Senão, adiciona somente commands que não sejam de crud
                else {
                  if (toolbarButton.title == "pdf" || toolbarButton.title == "excel") {
                    toolbar.push(toolbarButton.title);
                  }
                }
              }
              else if (toolbarButton.type == "Blockly" || toolbarButton.type == "Customized") {
                var buttonBlockly = this.generateToolbarButtonCall(toolbarButton, scope, options, attrs);
                toolbar.push(buttonBlockly);
              }
              else if (toolbarButton.type == "SaveOrCancelChanges") {
                if (options.editable != 'no') {
                  var buttonSaveOrCancel = this.generateToolbarButtonCall(toolbarButton, scope, options, attrs);
                  toolbar.push(buttonSaveOrCancel);
                }
              }
              else if (toolbarButton.type == "Template" || toolbarButton.type == "Title") {
                let buttonTemplate = generateToolbarTemplate(toolbarButton);
                toolbar.push(buttonTemplate);
              }

            }.bind(this));

            if (toolbar.length == 0)
              toolbar = undefined;
            return toolbar;
          },
          getEditable: function(options) {
            var editable = {
              mode:  options.editable,
              confirmation: false
            };
            if (options.editable == 'batch') {
              editable = true;
            }
            else if (options.editable == 'no' || options.editable == 'popupCustom' || options.editable == 'datasource') {
              editable = false;
            }
            return editable;
          },
          getTooltipsDefault: function() {
            var tooltips = {
              k_grid_edit : $translate.instant('Edit'),
              k_grid_delete: $translate.instant('Remove'),
              k_grid_update: $translate.instant('Save'),
              k_grid_cancel: $translate.instant('Cancel')
            };
            return tooltips;
          },
          setTooltips: function($divContainer, tooltips) {
            for (var key in tooltips) {
              var classFilter = '.' + key.replace(/_/g,'-');
              $divContainer.kendoTooltip({
                filter: classFilter,
                content: function(e){
                  var classKey = e.sender.options.filter.substr(1).replace(/-/g,'_');
                  return tooltips[classKey];
                }
              });
            }
          },
          generateKendoGridInit: function(options, scope, ngModelCtrl, attrs, tooltips) {

            var helperDirective = this;
            function detailInit(e) {
              //Significa que está fechando o detalhe (não é para fazer nada)
              if (e.masterRow.find('a').hasClass('k-i-expand')) {
                collapseCurrent(this, e.detailRow, e.masterRow);
                return;
              }

              var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
              if (!(cronappDatasource.inserting || cronappDatasource.editing)) {
                if (this.selectable) {
                  this.select(e.masterRow);
                }
                else {
                  setToActiveInCronappDataSource.bind(this)(e.data);
                  collapseAllExcecptCurrent(this, e.detailRow, e.masterRow);
                }
                //Obtendo todos os detalhes da grade atual, fechando e removendo todos (exceto o que esta sendo aberto agora)
                e.sender.options.listCurrentOptions.forEach(function(currentOptions) {
                  var currentKendoGridInit = helperDirective.generateKendoGridInit(currentOptions, scope, undefined, undefined, tooltips);

                  var $gridDiv = $("<div/>");
                  var grid = $gridDiv.appendTo(e.detailCell).kendoGrid(currentKendoGridInit).data('kendoGrid');
                  app.kendoHelper.receivePushData(grid);
                  currentOptions.refComponent = grid;
                  //Resize da tela para ajustar obter o widthDevices correto
                  window.addEventListener("resize", () => { helperDirective.resizeGridUsingWidthForDevice(grid) });

                  helperDirective.setTooltips($gridDiv, tooltips);
                });
              }
              else
                collapseAllExcecptCurrent(this, null, null);


            }

            var collapseAllExcecptCurrent = function(grid, trDetail, trMaster) {

              var masters = grid.table.find('.k-master-row');
              masters.each(function() {
                if (trMaster == null || this != trMaster[0]) {
                  grid.collapseRow(this);
                }
              });

              var details = grid.table.find('.k-detail-row');
              details.each(function() {
                if (trDetail == null || this != trDetail[0]) {
                  $(this).remove();
                }
              });

            };

            var collapseCurrent = function(grid, trDetail, trMaster) {

              var masters = grid.table.find('.k-master-row');
              masters.each(function() {
                if (trMaster != null || this == trMaster[0]) {
                  grid.collapseRow(this);
                }
              });

              var details = grid.table.find('.k-detail-row');
              details.each(function() {
                if (trDetail != null || this == trDetail[0]) {
                  $(this).remove();
                }
              });

            };

            var setToActiveInCronappDataSource = function(item) {
              var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
              if (!(cronappDatasource.inserting || cronappDatasource.editing))
                scope.safeApply(cronappDatasource.goTo(item));
            };

            var compileListing = function(e) {
              if (e.sender.tbody && e.sender.tbody.length) {

                var toCompile = e.sender.tbody;
                if (!$(e.sender.tbody).find('.k-grid-edit-row').length) {
                  if (toCompile.parent() && toCompile.parent().parent() && toCompile.parent().parent().parent() )
                    toCompile = toCompile.parent().parent().parent();
                }
                else {
                  toCompile = $(e.sender.tbody).find('tr:not(.k-grid-edit-row)');
                }

                scope.safeApply(function() {
                  var trs = $(toCompile);
                  var x = angular.element(trs);
                  $compile(x)(scope);
                  if (options.refComponent) {
                    helperDirective.resizeGridUsingWidthForDevice(options.refComponent);
                  }
                });
              }
            };

            var anyFilterableColumn = function(options) {
              var hasFilterableColumn = false;
              if (options.columns) {
                for (var i = 0; i<options.columns.length; i++) {
                  if (options.columns[i].dataType == "Database") {
                    if (options.columns[i].filterable){
                      hasFilterableColumn = true;
                      break;
                    }
                  }
                }
              }
              return hasFilterableColumn;
            };

            var getVisibleColumnByIdx = function(idx) {
              var result;
              var currIdx = 0;
              options.columns.forEach(function(column)  {
                if (column.dataType == "Database") {
                  if (currIdx == idx && column.visible) {
                    result = column;
                  }
                  if (column.visible)
                    currIdx++;
                }
              });
              return result;
            };

            var excelExport = function(e) {
              let sheet = e.workbook.sheets[0];
              let regexAngular = new RegExp("\{\{(.*?)\}\}");

              for (let rowIndex = 1; rowIndex < sheet.rows.length; rowIndex++) {
                let row = sheet.rows[rowIndex];
                for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex ++) {

                  let column = getVisibleColumnByIdx(cellIndex);
                  //Formata pro excel e adiciona o timezone
                  if (column && row.cells[cellIndex].value instanceof Date) {
                    let dateValue = new Date(row.cells[cellIndex].value.getTime());
                    dateValue.setMinutes(dateValue.getMinutes() + dateValue.getTimezoneOffset());
                    dateValue.setSeconds(dateValue.getSeconds());
                    row.cells[cellIndex].value = dateValue;
                    if (column.type == 'time')
                      row.cells[cellIndex].format = "[$-x-systime]hh:mm:ss";
                    else if (column.type == 'datetime')
                      row.cells[cellIndex].format = "dd/mm/yyyy hh:mm:ss;@";
                  }

                  if (row.type === "footer") {
                    if (row.cells[cellIndex].value) {
                      let rawValue = row.cells[cellIndex].value;
                      let content = $(rawValue)[0].innerHTML;
                      let regexExecution = regexAngular.exec(content);
                      if (regexExecution && regexExecution.length > 1) {
                        content = content.replace(regexExecution[0],"");
                        let evaluatedExpression = scope.$eval(regexExecution[1]);
                        row.cells[cellIndex].value = `${content}${evaluatedExpression}`;
                      }
                    }
                  }
                }
              }
            };



            var datasource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, options.allowPaging, options.pageCount, options.columns, options.groupings);

            var columns = this.getColumns(options, datasource, scope, tooltips, attrs);
            var pageAble = this.getPageAble(options);
            var toolbar = this.getToolbar(options, scope, attrs);
            var editable = this.getEditable(options);
            var filterable = anyFilterableColumn(options);

            var kendoGridInit = {
              hasSecurity: options.columns.filter(c => c.security).length,
              toolbar: toolbar,
              pdf: {
                allPages: true,
                avoidLinks: true,
                paperSize: "A4",
                margin: { top: "2cm", left: "1cm", right: "1cm", bottom: "1cm" },
                landscape: true,
                repeatHeaders: true,
                scale: 0.8
              },
              dataSource: datasource,
              editable: editable,
              height: options.height,
              groupable: options.allowGrouping,
              sortable: options.allowSorting,
              filterable: true,
              pageable: pageAble,
              columns: columns,
              selectable: options.allowSelectionRow,
              detailInit: (options.details && options.details.length > 0) ? detailInit : undefined,
              listCurrentOptions: (options.details && options.details.length > 0) ? options.details : undefined,
              excelExport: excelExport,
              edit: function(e) {
                this.dataSource.transport.options.disableAndSelect(e);
                var container = e.container;
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                if (e.model.isNew()) {
                  var model = e.model;
                  cronappDatasource.startInserting(null, function(active) {
                    for (var key in active) {
                      if (model.fields[key]) {
                        if (model.fields[key].validation && model.fields[key].validation.required) {
                          var input = container.find("input[name='" + key + "']");
                          if (input.length) {
                            //TODO: Verificar com a telerik https://stackoverflow.com/questions/22179758/kendo-grid-using-model-set-to-update-the-value-of-required-fields-triggers-vali
                            input.val(active[key]).trigger('change');
                          }
                        }
                        model.set(key, active[key]);
                      }
                    }
                  });
                }
                else if (!e.model.isNew() && !e.model.dirty) {
                  scope.safeApply(function() {
                    var currentItem = cronappDatasource.goTo(e.model);
                    cronappDatasource.startEditing(currentItem, function(xxx) {});
                  });
                }

                if (attrs && attrs.ngEdit) {
                  scope.$eval(attrs.ngEdit);
                }

                compileListing(e);
              },
              change: function(e) {
                var item = this.dataItem(this.select());
                setToActiveInCronappDataSource.bind(this)(item);
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                if(options.fieldType && options.fieldType === 'key'){
                  cronappDatasource.active = helperDirective.changeObjectField(cronappDatasource, cronappDatasource.active);
                }
                if (ngModelCtrl) {
                  if ("multiple" === options.allowSelectionRowType) {
                    let selecteds = [];
                    this.select().each((i, row)=> {
                      let item = this.dataItem(row);
                      let objInDs = cronappDatasource.findObjInDs(item, false);
                      if(options.fieldType && options.fieldType === 'key'){
                        objInDs = helperDirective.changeObjectField(cronappDatasource, objInDs);
                      }
                      if (objInDs !== null){
                        selecteds.push(objInDs);
                      }
                    });
                    ngModelCtrl.$setViewValue(selecteds);
                  }
                  else{
                    if (item) {
                      ngModelCtrl.$setViewValue(cronappDatasource.active);
                    }
                    else {
                      ngModelCtrl.$setViewValue(null);
                    }
                  }
                }
                collapseAllExcecptCurrent(this, this.select().next(), this.select());

                if (attrs && attrs.ngChange) {
                  scope.$eval(attrs.ngChange);
                }

                compileListing(e);

                $(".k-command-cell a[class*='k-grid-']").each((idx, elem) => {
                  let $elem = $(elem);
                  if (!$elem.attr('id')) {
                    let item = this.dataItem($elem.closest('tr'));
                    let command = 'destroy';
                    if ($elem.hasClass('k-grid-update')) {
                      command = 'update';
                    }
                    else if ($elem.hasClass('k-grid-cancel')) {
                      command = 'cancel';
                    }
                    else if ($elem.hasClass('k-grid-edit')) {
                      command = 'edit';
                    }

                    let modelName = helperDirective.removeSpecialChar(attrs.ngModel);
                    let key = item["_objectKey"];
                    let id = `${modelName}-${command}-${key}`;
                    $elem.attr('id', id);
                  }
                });
              },
              cancel: function(e) {
                var cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                scope.safeApply(cronappDatasource.cancel());
                this.dataSource.transport.options.enableAndSelect(e);
                setTimeout(function() {
                  if (attrs && attrs.ngCancel) {
                    scope.$eval(attrs.ngCancel);
                  }

                  compileListing(e);
                }.bind(this));
              },
              dataBound: function(e) {
                setTimeout(() => this.dataSource.transport.options.selectActiveInGrid(), 100);

                if (attrs && attrs.ngDataBound) {
                  scope.$eval(attrs.ngDataBound);
                }

                for(let i=0;i<this.columns.length;i++){
                  let col = helperDirective.getColumnByField(options, this.columns[i].field);
                  if (col.visible)
                    this.showColumn(i);
                }
                if ($('div.k-grouping-header').length == 0) {
                  if (options.groupings) {
                    options.groupings.forEach((c) => this.hideColumn(c.field));
                  }
                }
                else {
                  $("div.k-group-indicator").each((i,v) => {
                    this.hideColumn($(v).data("field"));
                  });
                }
                //Colocando tabindex para poder focar - acessibilidade
                let grid = this;
                setTimeout(function() {
                  if (grid.pager) {
                    grid.pager.element.find("a").not(".k-state-disabled").attr("tabindex", "0");
                  }
                });

                compileListing(e);
              }
            };

            if (kendoGridInit.selectable) {
              if ("multiple" == options.allowSelectionRowType) {
                kendoGridInit.selectable = "multiple"
              }
            }
            kendoGridInit.originalSelectable = kendoGridInit.selectable;

            if (attrs && attrs.ngBeforeEdit) {
              kendoGridInit.beforeEdit =  function(e) {scope.$eval(attrs.ngBeforeEdit);};
            }
            if (attrs && attrs.ngDataBinding) {
              kendoGridInit.dataBinding = function(e) {scope.$eval(attrs.ngDataBinding);};
            }
            if (attrs && attrs.ngSave) {
              kendoGridInit.save = function(e) {scope.$eval(attrs.ngSave);};
            }
            if (attrs && attrs.ngSaveChanges) {
              kendoGridInit.saveChanges = function(e) {scope.$eval(attrs.ngSaveChanges);};
            }
            if (attrs && attrs.ngRemove) {
              kendoGridInit.remove = function(e) {scope.$eval(attrs.ngRemove);};
            }

            return kendoGridInit;

          },
          link: function (scope, element, attrs, ngModelCtrl) {

            if (element.children().length)
              return;

            var $templateDyn = $('<div></div>');
            var baseUrl = 'node_modules/cronapp-lib-js/dist/js/kendo-ui/js/messages/kendo.messages.';
            if ($translate.use() == 'pt_br')
              baseUrl += "pt-BR.min.js";
            else
              baseUrl += "en-US.min.js";


            this.initCulture();
            var helperDirective = this;
            $.getScript(baseUrl, function () {

              var options = JSON.parse(attrs.options || "{}");

              app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope).batchPost = false;
              var batchMode = options.batchMode == undefined || options.batchMode;
              if (batchMode && options.editable != 'datasource' && app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope) && !app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope).dependentLazyPost) {
                app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope).batchPost = true;

                options.toolBarButtons = options.toolBarButtons || [];
                options.toolBarButtons.push({
                  type: "SaveOrCancelChanges",
                  title: $translate.instant('SaveChanges'),
                  methodCall: options.dataSourceScreen.entityDataSource.name + ".postBatchData()",
                  saveButton: true
                });
                options.toolBarButtons.push({
                  type: "SaveOrCancelChanges",
                  title: $translate.instant('CancelChanges'),
                  methodCall: options.dataSourceScreen.entityDataSource.name + ".cancelBatchData()",
                  saveButton: false
                });
              }

              var tooltips = helperDirective.getTooltipsDefault();
              var kendoGridInit = helperDirective.generateKendoGridInit(options, scope, ngModelCtrl, attrs, tooltips);
              kendoGridInit.scrollable = attrs.scrollable === "true";

              var grid = $templateDyn.kendoGrid(kendoGridInit).data('kendoGrid');
              app.kendoHelper.receivePushData(grid);
              options.refComponent = grid;

              //Resize da tela para ajustar obter o widthDevices correto
              window.addEventListener("resize", () => { helperDirective.resizeGridUsingWidthForDevice(grid) });

              helperDirective.setTooltips($templateDyn, tooltips);

              scope.safeApply(function() {
                if (app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope)) {

                  $templateDyn.find('.k-filter-row').show();
                  $templateDyn.find('.k-pager-sizes').show();
                  $templateDyn.find('.k-pager-nav').show();
                  $templateDyn.find('.k-pager-numbers').show();
                  $templateDyn.find('.k-pager-refresh.k-link').show();
                  $templateDyn.find('.saveorcancelchanges').hide();

                  app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope).addDataSourceEvents(
                      {
                        "pendingchanges": function(value) {
                          if (value) {
                            $templateDyn.find('.k-filter-row').hide();
                            $templateDyn.find('.k-pager-sizes').hide();
                            $templateDyn.find('.k-pager-nav').hide();
                            $templateDyn.find('.k-pager-numbers').hide();
                            $templateDyn.find('.k-pager-refresh.k-link').hide();
                            $templateDyn.find('.saveorcancelchanges').show();
                          } else {
                            $templateDyn.find('.k-filter-row').show();
                            $templateDyn.find('.k-pager-sizes').show();
                            $templateDyn.find('.k-pager-nav').show();
                            $templateDyn.find('.k-pager-numbers').show();
                            $templateDyn.find('.k-pager-refresh.k-link').show();
                            $templateDyn.find('.saveorcancelchanges').hide();
                          }
                        }
                      }
                  );

                  app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.entityDataSource.name, scope).addDataSourceEvents(
                      {
                        "afterchanges": function(value) {
                          //QAIBT-610
                          //grid.dataSource.filter([]);
                        }
                      }
                  );
                }
              });

            });

            element.html($templateDyn);
            $compile($templateDyn)(element.scope());

          }
        };
      }])

      .directive('src', function($compile) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs, ctrl) {
            if (element[0].tagName === "IMG" ) {
              if (cronapi.internal.isBase64(attrs.src) ) {
                setTimeout(() => $(element[0]).attr("src", "data:image/png;base64," + attrs.src));
              }
            }
          }
        }
      })

      .directive('cronTreeView', ['$compile', '$translate', function($compile, $translate) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          scope: true,
          getDataSource: function(options, scope, ngModelCtrl) {

            let id = options.dataSourceScreen.schema.filter(field => { return field.key === true })[0].name;
            let schema = {
              model: {
                id: id,
                hasChildren: function(item) {
                  return item["hasChildren"];
                }
              }
            }

            let getAllParent = function(cronappDatasource, item, ids, resolve, reject) {

              if (item[schema.model.id])
                ids.push(item[schema.model.id]);

              let odataUrl = `${cronappDatasource.entity}?$filter=${schema.model.id} eq '${item[options.selfRelationshipField]}'&$format=json&$inlinecount=allpages`;
              if (item[options.selfRelationshipField]) {
                $.ajax({
                  url: odataUrl,
                  success: (itemResult) => {
                    getAllParent(cronappDatasource, itemResult.d.results[0], ids, resolve, reject);
                  },
                  beforeSend: (xhr) => {
                    if (window.uToken) {
                      xhr.setRequestHeader ("X-AUTH-TOKEN", window.uToken);
                    }
                  },
                  error: () => reject(),
                  type: 'GET',
                });
              }
              else {
                resolve(ids);
              }
            };

            let reloadAndExpand = function(data) {
              let finish = () => {
                let promise = new Promise((resolve, reject) => {
                  getAllParent(this.options.cronappDatasource, data, [], resolve, reject);
                });
                promise.then(expandIds => {
                  this.options.kendoObj.expandPath(expandIds.reverse());
                });
              };
              this.options.kendoObj.dataSource.bind("requestEnd", finish);
              this.options.kendoObj.dataSource.read();
            };

            let helperDirective = this;
            let waitingPromise = false;
            let datasource = new kendo.data.HierarchicalDataSource({
              transport: {
                push: function(callback) {

                  if (!helperDirective.dataSourceEventsPush && this.options.cronappDatasource) {
                    helperDirective.dataSourceEventsPush = {
                      create: function(data) {

                        reloadAndExpand.bind(this)(data);

                      }.bind(this),
                      update: function(data) {

                        reloadAndExpand.bind(this)(data);

                      }.bind(this),
                      delete: function(data) {

                        reloadAndExpand.bind(this)(data);
                        ngModelCtrl.$setViewValue(null);

                      }.bind(this),
                      overRideRefresh: function(data) {

                        this.options.fromRefresh = true;
                        this.options.kendoObj.dataSource.read();
                        ngModelCtrl.$setViewValue(null);

                      }.bind(this),
                      read: function(data) {

                        if (!waitingPromise) {
                          this.options.kendoObj.dataSource.read();
                          ngModelCtrl.$setViewValue(null);
                        }

                      }.bind(this)
                    };

                    this.options.cronappDatasource.addDataSourceEvents(helperDirective.dataSourceEventsPush);
                  }
                },

                read:  function (e) {

                  let conditionIsEmpty = (condition) => {
                    let result = true;
                    if (condition) {
                      let jsonCondition = JSON.parse(condition);
                      if (jsonCondition.expression && jsonCondition.expression.args) {
                        jsonCondition.expression.args.forEach((a)=> {
                          if (a.right !== '' && a.right !== "''" && a.right !== undefined)
                            result = false;
                        });
                      }
                    }
                    return result;
                  };


                  let cronappDatasource = this.options.cronappDatasource;

                  for (key in e.data)
                    if(e.data[key] == undefined)
                      delete e.data[key];

                  let logicFilter = { filter: { logic: "and", filters:[] } };
                  for (let key in e.data) {
                    let kendoFilter = {
                      field: options.selfRelationshipField,
                      operator: "eq",
                      value: e.data[key]
                    };
                    logicFilter.filter.filters.push(kendoFilter);
                  }

                  let condition = cronappDatasource.condition;
                  let conditionEmpty = conditionIsEmpty(condition);
                  let paramsOData = { $inlinecount: "allpages", $format: "json", $filter: `${options.selfRelationshipField} eq null`};

                  if (logicFilter.filter.filters.length) {
                    cronappDatasource.condition = '';
                    paramsOData = kendo.data.transports.odata.parameterMap(logicFilter, 'read');
                  }
                  else if (this.options.fromRefresh) {
                    this.options.fromRefresh = false;
                    if (!conditionEmpty) {
                      cronappDatasource.cleanup();
                      paramsOData = { $inlinecount: "allpages", $format: "json"};
                    }
                  }

                  cronappDatasource.rowsPerPage = e.data.pageSize;
                  cronappDatasource.offset = (e.data.page - 1);


                  let fetchData = {};
                  fetchData.params = paramsOData;

                  helperKendoDs = this;

                  cronappDatasource.fetch(fetchData, {
                    success:  function(data) {

                      let all = data.map(item => {
                        let odataUrl = `${this.entity}/$count?$filter=${options.selfRelationshipField} eq '${item[schema.model.id]}'`;
                        return new Promise((resolve, reject)=> {
                          $.ajax({
                            url: odataUrl,
                            success: (count) => {
                              item["hasChildren"] = eval(count) > 0;
                              resolve();
                            },
                            beforeSend: (xhr) => {
                              if (window.uToken) {
                                xhr.setRequestHeader ("X-AUTH-TOKEN", window.uToken);
                              }
                            },
                            error: () => reject(),
                            type: 'GET',
                          });
                        });
                      });
                      waitingPromise = true;
                      Promise.all(all).then(() => {
                        e.success(data);
                        waitingPromise = false;
                      });
                    },
                    canceled:  function(data) {
                      e.error("canceled", "canceled", "canceled");
                    }
                  }, true);

                  if (condition)
                    cronappDatasource.condition = condition;

                },
                options: {
                  fromRead: false,
                  cronappDatasource: app.kendoHelper.getCorrectlyDS(options.dataSourceScreen.name, scope)
                }
              },
              schema: schema
            });
            return datasource;
          },
          link: function (scope, element, attrs, ngModelCtrl) {

            let $templateDyn = $('<div></div>');
            let options = JSON.parse(attrs.options);

            let helperDirective = this;

            let changeObjectField = function(dataSource, obj){
              obj = dataSource.getKeyValues(obj);
              var keys = Object.keys(obj);
              if(keys.length === 1){
                obj = obj[keys];
              }
              return obj;
            };

            let kendoObj = $templateDyn.kendoTreeView({
              dataSource: helperDirective.getDataSource(options, scope, ngModelCtrl),
              dataTextField: options.textField,
              dataImageUrlField: options.imageUrlField,
              change: function(e) {
                let item = this.dataItem(this.select());

                let cronappDatasource = this.dataSource.transport.options.cronappDatasource;
                scope.safeApply(cronappDatasource.goTo(item));

                if(options.fieldType && options.fieldType === 'key')
                  cronappDatasource.active = changeObjectField(cronappDatasource, cronappDatasource.active);

                ngModelCtrl.$setViewValue(cronappDatasource.active);
              }
            }).data('kendoTreeView');
            kendoObj.dataSource.transport.options.kendoObj = kendoObj;

            element.html($templateDyn);
            $compile($templateDyn)(element.scope());

          }
        };
      }])

      .directive('cronSelect', function ($compile) {
        return {
          restrict: 'E',
          replace: true,
          require: 'ngModel',
          link: async function (scope, element, attrs, ngModelCtrl) {
            var select = {};
            try {
              select =  JSON.parse(attrs.options);
            } catch(err) {
              console.log('ComboBox invalid configuration! ' + err);
            }

            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var parent = element.parent();
            $(parent).append('<input style="width: 100%;" '+ id + name + ' class="cronSelect"/>');
            var $element = $(parent).find('input.cronSelect');
            var cronDisabled = attrs.cronDisabled;
            var options = await app.kendoHelper.getConfigCombobox(select, scope);
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;
            options.change = function() {
              _scope.$apply(function () {
                _ngModelCtrl.$setViewValue(this.value());
              }.bind(combobox));
            }

            var combobox;
            if (select.dontAllowOutsideList === true) {
              combobox = $element.kendoDropDownList(options).data('kendoDropDownList');
            }
            else {
              combobox = $element.kendoComboBox(options).data('kendoComboBox');
            }
            $(element).remove();

            let internalInput;
            let initializeAttrAndEvents = () => {
              internalInput = $(parent).find('.k-input.cronSelect');
              if (internalInput.length) {
                internalInput.attr("ng-required", attrs.ngRequired);
                if (attrs.ngRequired === 'true')
                  internalInput.attr("required", "required");
                internalInput.attr("ng-model", attrs.ngModel);
                internalInput.attr("id", attrs.id);
                internalInput.attr("validationmessage", attrs.validationmessage);
                let $parent = internalInput.parent();
                internalInput.on('change',() => {
                  if (attrs.ngRequired === "true") {
                    if (internalInput.val().length == 0) {
                      $parent.addClass('ng-invalid-required');
                      internalInput.addClass('ng-invalid-required');
                    }
                    else {
                      $parent.removeClass('ng-invalid-required');
                      internalInput.removeClass('ng-invalid-required');
                    }
                  }
                });
              }
              else {
                setTimeout(() => initializeAttrAndEvents());
              }
            };
            initializeAttrAndEvents();
            if (cronDisabled) {
              combobox.enable(false);
            } else {
              combobox.enable(true);
            }

            var _scope = scope;
            var _ngModelCtrl = ngModelCtrl;

            var initializing = true;
            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = '';

                if ((typeof value === 'boolean') || (value)) {
                  result = value;
                }
                combobox.value(result);

                if (!initializing) {
                  if (attrs.ngChange) scope.$eval(attrs.ngChange);
                }


                initializing = false;
                combobox.value(result);
                return result;
              });
              ngModelCtrl.$parsers.push(function (value) {
                if (internalInput) {
                  internalInput.trigger('change');
                }
                if ((typeof value === 'boolean') || value) {
                  return value;
                }
                return null;
              });
            }
          }
        };
      })

      .directive('cronDynamicSelect', function ($compile, $timeout, $parse, $translate) {
        return {
          restrict: 'E',
          replace: true,
          require: '?ngModel',
          goTo: function(scope, combobox, rowId) {
            dataSourceScreen = $(combobox).data('dataSourceScreen');
            if (dataSourceScreen != null) {
              return dataSourceScreen.goTo(rowId, true);
            }
          },
          compileAngular: function(scope, element) {
            var $template = $(element);
            var templateDyn = angular.element($template);
            $compile(templateDyn)(scope);
          },
          getActive: function(active) {
            if (active && active.indexOf('.active.')) {
              try {
                return eval(active.substr(0, active.indexOf('.active.')));
              } catch(e) {}
            }

            return null;
          },
          getFieldText: function(active, select) {
            if (active && active.indexOf('.active.') && select.dataTextField) {
              try {
                var text = active.substr(active.indexOf('.active.') + 8);
                return text + '_' + select.dataTextField;
              } catch(e) {}
            }

            return null;
          },
          isDefaultEntity: function(dataSource) {
            if (dataSource && dataSource.entity) {
              var parts = dataSource.entity.split('/');
              if (parts && parts.length > 0) {
                return parts.pop().indexOf('query') == -1;
              }
            }

            return false;
          },
          getModelParent: function (parametersExpression) {
            if (typeof parametersExpression === 'string' && parametersExpression.length > 9 && parametersExpression.indexOf('|raw}}') > 0) {
              parametersExpression = parametersExpression.trim();
              var model = parametersExpression.substr(parametersExpression.indexOf('{{') + 2);
              model = model.substr(0, model.indexOf('|raw}}'))
              return model.trim();
            } else {
              return null;
            }
          },
          link: async function (scope, element, attrs, ngModelCtrl) {
            await cronapi.internal.skipIterationLoop();
            var modelGetter = $parse(attrs['ngModel']);
            var modelSetter = modelGetter.assign;
            var select = {};
            var self = this;
            var parentDS = {};
            var textField = null;
            var cronDisabled = attrs.cronDisabled;
            try {
              select = JSON.parse(attrs.options);
              parentDS = this.getActive(attrs.ngModel);
              textField = this.getFieldText(attrs.ngModel, select);
            } catch(err) {
              console.log('DynamicComboBox invalid configuration! ' + err);
            }

            //Rotina pra setar textField no model
            let lastFieldInModel = attrs['ngModel'].split('.');
            lastFieldInModel = lastFieldInModel[lastFieldInModel.length-1];
            let modelForTextField = attrs['ngModel'].replace(lastFieldInModel, textField);
            let modelTextFieldGetter = $parse(modelForTextField);
            let modelTextFieldSetter = modelTextFieldGetter.assign;

            /**
             * Configurações do componente
             */
            var options = await app.kendoHelper.getConfigCombobox(select, scope);
            options.autoBind = true;
            var dataSourceScreen = null;
            try {
              delete options.dataSource.schema.model.id;
              dataSourceScreen = eval(select.dataSourceScreen.name);
              dataSourceScreen.rowsPerPage = dataSourceScreen.rowsPerPage ? dataSourceScreen.rowsPerPage : 100;
              options.dataSource.transport.origin = 'combobox';
            } catch(e){}

            var _scope = scope;
            var _goTo = this.goTo;
            var _compileAngular = this.compileAngular;
            options.virtual = {};
            options.virtual.itemHeight = 26;
            if (options.dataSource.pageSize && options.dataSource.pageSize > 0) {
              options.height = (options.dataSource.pageSize) * options.virtual.itemHeight / 4;
              options.virtual.mapValueTo = 'dataItem';
              var _options = options;
              /**
               * O método ValueMapper é utilizado para buscar um valor que não esteja em cache.
               */
              options.virtual.valueMapper = async function(options) {
                let waitRenderCombo = setInterval(() => {
                  var _combobox = _options.combobox;
                  if (_combobox) {
                    clearInterval(waitRenderCombo);
                    if (options.value || options.value === "") {
                      if(_combobox.options.optionLabel[_combobox.options.dataValueField] !== null && options.value === ""){
                        options.success(null);
                      }
                      else{
                        _combobox.isEvaluating = true;
                        var _dataSource = _options.dataSource.transport.options.cronappDatasource;
                        if (options.value === undefined || options.value === null || options.value === "") {
                          options.success(null);
                          _combobox.isEvaluating = false;
                        } else {
                          _dataSource.findObj([options.value], false, function(data) {
                            if (Array.isArray(data)) {
                              data = data[0];
                            }
                            options.success(data);
                            _combobox.isEvaluating = false;

                            if (select.changeCursor) {
                              scope.safeApply(function() {
                                if (data != null) {
                                  var found = _goTo(_scope, _combobox, data);
                                  if (!found) {
                                    _dataSource.data.push(data);
                                    found = _goTo(_scope, _combobox, data);
                                  }
                                  if (found) {
                                    modelSetter(_scope, found[select.dataValueField]);
                                  }
                                } else {
                                  modelSetter(_scope, null);
                                }
                              });
                            } else {
                              if (data == null) {
                                modelSetter(_scope, null);
                              }
                            }
                          }, function() {
                            options.success(null);
                            _combobox.isEvaluating = false;
                          }, [combobox.options.dataValueField]);
                        }
                      }
                    } else {
                      options.success(null);
                    }
                  }
                });
              };
            }

            options.messages =  {
              noData: attrs.noResultsMessage ? attrs.noResultsMessage : "NO DATA FOUND"
            };

            options.change = attrs.ngChange ? function (){scope.$eval(attrs.ngChange)}: undefined;
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.open = function(e) {
              if (!dataSourceScreen.fetched || (dataSourceScreen.data.length > combobox.dataSource.data().length)) {
                combobox.options.firstLazyRead = true;
                combobox.dataSource.read();
              }
            };

            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;

            /**
             * Renderizando DropdownList
             */
            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var validationmessage = attrs.validationmessage ? ' validationmessage="' + attrs.validationmessage + '"' : '';
            var inputSelect = $('<input style="width: 100%;"' + id + name + validationmessage + ' class="cronDynamicSelect" ng-model="' + attrs.ngModel + '"/>');

            //https://stackoverflow.com/questions/21948067/issues-with-ng-required-directive-angular-js
            attrs.$observe('required', function(value) {
              inputSelect.prop('required', value);
            });
            $(parent).append(inputSelect);
            var $element = $(parent).find('input.cronDynamicSelect');
            if (dataSourceScreen) {
              dataSourceScreen.__ignoreFirstFetch = true;
            }
            var combobox = $element.kendoDropDownList(options).data('kendoDropDownList');
            options.combobox = combobox;
            $(combobox.element[0]).attr('tabindex','-1');
            if (dataSourceScreen != null && dataSourceScreen != undefined) {
              $(combobox).data('dataSourceScreen', dataSourceScreen);
            }
            if (attrs.ngRequired || attrs.required) {
              $(combobox.element[0]).attr('style','');
              $(combobox.element[0]).attr('class','cron-select-offscreen');
            }

            $(combobox.wrapper).children('.k-dropdown-wrap').children('.k-select').before(inputSelect);

            var forceChangeModel = function(value) {
              if (combobox.isEvaluating) {
                setTimeout(function() {
                  forceChangeModel(value);
                }, 100);
                return;
              }

              if (value === undefined) {
                value = null;
              }

              combobox.value(value);

              if (select.changeCursor) {
                if (!combobox.isEvaluating) {
                  if (value == null || value == undefined) {
                    dataSourceScreen.active = {};
                    dataSourceScreen.cursor = -1;
                    modelSetter(_scope, null);
                  } else {
                    var found = _goTo(_scope, combobox, combobox.dataItem());

                    if (!found) {
                      combobox.isEvaluating = true;
                      dataSourceScreen.findObj([value], false, (dataresult) => {
                        if (Array.isArray(dataresult)) {
                          dataresult = dataresult[0];
                        }
                        if (dataresult) {
                          dataSourceScreen.data.push(dataresult);
                          _goTo(_scope, combobox, dataresult);
                          modelSetter(_scope, value);
                        }
                        combobox.isEvaluating = false;
                      });
                    }
                  }
                }

              }
            }

            /**
             * Observa o read do datasource para setar o primeiro valor ou valor inicial.
             */

            var defineInitialValue = function() {
              if (combobox.definingInitialValue) {
                return;
              }
              if (!combobox.isEvaluating) {
                var currentValue = combobox.value();
                var nextValue = null;

                var found = dataSourceScreen.goTo(currentValue);

                if (!found) {
                  if ((combobox.options.lazyFirstInitialValue || !dataSourceScreen.lazy) && select.initValue != undefined && select.initValue != null) {
                    combobox.options.lazyFirstInitialValue = false;
                    found = dataSourceScreen.goTo(select.initValue);
                    if (found) {
                      nextValue = select.initValue;
                    }
                  }


                  if (nextValue == null && select.firstValue) {
                    if (dataSourceScreen) {
                      combobox.definingInitialValue = true;
                      dataSourceScreen.fetch({
                        params: {
                          $top: 1
                        }
                      }, {
                        success: function(data) {
                          if (data.length) {
                            dataSourceScreen.data.push(data[0]);
                            nextValue = data[0][select.dataValueField];
                          }
                          modelSetter(_scope, nextValue);
                          forceChangeModel(nextValue);
                          combobox.definingInitialValue = false;
                        },
                        error: function() {
                          combobox.definingInitialValue = false;
                        },
                        canceled: function() {
                          combobox.definingInitialValue = false;
                        }
                      }, undefined, {lookup : true});
                    }
                  } else {
                    modelSetter(_scope, nextValue);
                    forceChangeModel(nextValue);
                    combobox.definingInitialValue = false;
                  }
                }
              }
              else {
                setTimeout(()=>defineInitialValue(),300);
              }
            }

            var _ngModelCtrl = ngModelCtrl;
            if (dataSourceScreen != null && dataSourceScreen != undefined) {
              dataSourceScreen.addDataSourceEvents({
                overRideRefresh: function() {
                  dataSourceScreen.fetched = false;
                  dataSourceScreen.cleanup();
                  defineInitialValue();
                }
              });
            }

            /**
             * Observando se houve mudança no valor do DropdownList.
             */
            var _isDefaultEntity = this.isDefaultEntity;
            $element.on('change', function (event) {
              let applyChange = function () {
                if (combobox.isEvaluating) {
                  setTimeout(applyChange, 100);
                  return;
                }
                _scope.$apply(function() {
                  modelSetter(_scope, combobox.dataItem()[select.dataValueField]);
                  modelTextFieldSetter(_scope, combobox.dataItem()[select.dataTextField]);
                  if(select.changeValueBasedOnLabel){
                    let comboLabelValue = combobox.dataItem()[select.dataTextField];
                    // Try to eval it first in pure vanilla and then if it was not possible in angular context.
                    try {
                      eval(select.changeValueBasedOnLabel + '=' + '"' + comboLabelValue + '"');
                    }catch (e) {
                      try {
                        _scope.$eval(select.changeValueBasedOnLabel + '=' + '"' + comboLabelValue + '"')
                      }catch (e) {
                        console.error("Não foi possível atribuir o texto do combobox ", comboLabelValue, " no compo informado ", select.changeValueBasedOnLabel);
                      }
                    }
                  }

                  _compileAngular(scope, options.combobox.element[0]);
                });

              }

              applyChange();

            });

            /**
             * Observando model do DropdownList.
             */
            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var x = combobox.value();
                if (value === undefined)
                  value = null;
                return forceChangeModel(value);
              });

              ngModelCtrl.$parsers.push(function (value) {
                if ((typeof value === 'boolean') || value) {
                  if (combobox.options.valuePrimitive === true) {
                    if (typeof value == 'string') {
                      return value;
                    } else if ((typeof value[select.dataValueField] === 'boolean') || value[select.dataValueField]) {
                      return value[select.dataValueField];
                    }
                  } else {
                    try {
                      return objectClone(value, combobox.dataSource.options.schema.model.fields);
                    } catch(e){}
                  }
                }
                return null;
              });
            }

            if (select.initValue) {
              if (select.initValue.startsWith('params.')) {
                var type = combobox.dataSource.options.schema.model.fields[select.dataValueField].type;
                select.initValue = scope.$eval(select.initValue);
                if (type != 'string') {
                  select.initValue = dataSourceScreen.normalizeValue(select.initValue, true);
                }
              } else {
                select.initValue = scope.$eval(select.initValue);
              }

            } else {
              select.initValue = null;
            }

            if (select.initValue == '') {
              select.initValue = null;
            }

            if (combobox.dataSource.transport && combobox.dataSource.transport.options) {
              combobox.dataSource.transport.options.combobox = combobox;
              combobox.dataSource.transport.options.$compile = $compile;
              combobox.dataSource.transport.options.scope = scope;
              combobox.dataSource.transport.options.ngModelCtrl = ngModelCtrl;
              combobox.dataSource.transport.options.initRead = true;

              if (select.initValue != undefined && select.initValue != null) {
                modelSetter(_scope, select.initValue);
                combobox.options.lazyFirstInitialValue = true;
              }
              else if (select.firstValue) {
                defineInitialValue();
              }

            }

            $(combobox.span).on('DOMSubtreeModified', function(e){
              _compileAngular(scope, e.target);
            });

            $(combobox.ul).on('DOMSubtreeModified', function(e){
              $timeout(function() {
                _compileAngular(scope, e.target);
              });
            });

            _compileAngular(scope, combobox.span);
            _compileAngular(scope, combobox.ul);

            $(element).remove();

            if(cronDisabled){
              combobox.enable(false);
            } else {
              combobox.enable(true);
            }

            $("[aria-owns='" + `${attrs.id}_listbox` + "']").attr('aria-label', $translate.instant('template.crud.search'));
          }
        };
      })

      .directive('cronMultiSelect', function ($compile, $parse) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: async function (scope, element, attrs, ngModelCtrl) {
            var modelGetter = $parse(attrs['ngModel']);
            var modelSetter = modelGetter.assign;
            var model = attrs['ngModel'];
            var cronDisabled = attrs.cronDisabled;

            var _self = this;
            var select = {};
            try {
              select = JSON.parse(attrs.options);
            } catch(err) {
              console.log('MultiSelect invalid configuration! ' + err);
            }

            var _scope = scope;
            var _ngModelCtrl = ngModelCtrl;

            var relactionDS = {
              relationDataSource: (select.relationDataSource != null ? eval(select.relationDataSource.name) : null),
              relationField: (select.relationField != null ? select.relationField : '')
            }

            var options = await app.kendoHelper.getConfigCombobox(select, scope);

            try {
              delete options.dataSource.schema.model.id;
            } catch(e){}

            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';

            let required = attrs.ngRequired && eval(attrs.ngRequired) ? `required="required"`: '';
            $(parent).append(`<div style="width: 100%;"> <input style="width: 100%;" ${id} ${name} ${required} class="cronMultiSelect" ng-model="${attrs.ngModel}"/> </div>`);
            $(parent).find('label').attr('for',attrs.id);
            let $inp = $(`${attrs.id}`);
            $compile($inp)(scope);

            var $element = $(parent).find('input.cronMultiSelect');
            $(element).remove();

            var evtSelect;
            var deselect;

            options['deselect'] = function(e) {
              var dataItem = e.dataItem;
              var relation = this.relationDataSource;
              var dataValueField = e.sender.options.dataValueField;

              var selectItem = null;
              if (relation && relation.data && dataItem[dataValueField]) {
                for (key in relation.data) {
                  var item = relation.data[key];
                  if (item[this.relationField] && (item[this.relationField] == dataItem[dataValueField])) {
                    selectItem = item;
                    break;
                  }
                };

                if (selectItem != null) {
                  $(combobox).data('silent', true);
                  this.relationDataSource.removeSilent(selectItem, null, null);
                }
              } else {
                if (model) {
                  _scope.$apply(function () {
                    try {
                      var data = eval('_scope.' + model);
                      data = data.filter(it => {
                        if(typeof(it) === "object"){
                          return  it[dataValueField] !== dataItem[dataValueField];
                        }
                        return it !== dataItem[dataValueField];
                      });
                      $(combobox).data('silent', true);
                      modelSetter(_scope, data);
                    } catch (e) {}
                  });
                }
              }

              if (deselect) {
                deselect();
              }

            }.bind(relactionDS);

            options['select'] = function(e) {
              var dataItem = e.dataItem;
              var dataValueField = e.sender.options.dataValueField;
              var combobox = e.sender;

              if (this.relationDataSource && dataItem[dataValueField]) {
                var obj = {};
                obj[this.relationField] = dataItem[dataValueField];
                $(combobox).data('silent', true);
                this.relationDataSource.startInserting(obj, function(data){
                  this.postSilent();
                }.bind(this.relationDataSource));
              } else {
                if (model) {
                  _scope.$apply(function () {
                    try {
                      var data = eval('_scope.' + model);
                      if (!data) {
                        data = [];
                      }
                      if(select.fieldType && select.fieldType === 'key'){
                        var keyValues = combobox.dataSource.options.transport.options.cronappDatasource.getKeyValues(dataItem);
                        var keys = Object.keys(keyValues);
                        if(keys.length === 1){
                          keyValues = keyValues[keys];
                        }
                        data.push(keyValues)
                      }
                      else{
                        data.push(objectClone(dataItem, combobox.dataSource.options.schema.model.fields));
                      }
                      $(combobox).data('silent', true);
                      modelSetter(_scope, data);
                    } catch(e) {}
                  });
                }
              }

              if (evtSelect) {
                evtSelect();
              }

            }.bind(relactionDS);

            options['change'] = attrs.ngChange ? function (){_scope.$eval(attrs.ngChange)}: undefined;
            options['close'] = attrs.ngClose ? function (){_scope.$eval(attrs.ngClose)}: undefined;
            options['dataBound'] = attrs.ngDatabound ? function (){_scope.$eval(attrs.ngDatabound)}: undefined;
            options['filtering'] = attrs.ngFiltering ? function (){_scope.$eval(attrs.ngFiltering)}: undefined;
            options['open'] = attrs.ngOpen ? function (){_scope.$eval(attrs.ngOpen)}: undefined;
            options['cascade'] = attrs.ngCascade ? function (){_scope.$eval(attrs.ngCascade)}: undefined;
            evtSelect = attrs.ngSelect ? function (){_scope.$eval(attrs.ngSelect)}: undefined;
            deselect = attrs.ngDeselect ? function (){_scope.$eval(attrs.ngDeselect)}: undefined;

            var combobox = $element.kendoMultiSelect(options).data('kendoMultiSelect');
            if(cronDisabled){
              combobox.enable(false);
            }else {
              combobox.enable(true);
            }
            app.kendoHelper.receivePushData(combobox);

            $("[aria-describedby='" + `${attrs.id}_taglist` + "']").attr('id', `${attrs.id}-container`);

            if (attrs.crnReadonly) {
              _scope.$watch(attrs.crnReadonly, (newValue, oldValue) => {
                combobox.readonly(_scope.$eval(attrs.crnReadonly));
              });
            }

            var convertArray = function(value) {
              var result = [];
              if (value) {
                for (var item in value) {
                  result.push(value[item][relactionDS.relationField]);
                }
              }
              return result;
            }

            scope.$watchCollection(function(){return ngModelCtrl.$modelValue}, function(value, old){
              var silent = $(combobox).data('silent');

              if (value.length === 0) {
                $(`#${attrs.id}`).addClass('ng-empty');
                attrs.ngRequired && eval(attrs.ngRequired) && $(`#${attrs.id}`).attr('required', 'required');
              }
              else {
                $(`#${attrs.id}`).removeClass('ng-empty');
                $(`#${attrs.id}`).removeAttr('required');
              }

              $(combobox).data('silent', false);
              if (!silent && (JSON.stringify(value) !== JSON.stringify(old))) {
                if (relactionDS.relationDataSource && relactionDS.relationField) {
                  combobox.value(convertArray(value));
                } else {
                  combobox.value(value);
                }
              }
            });
          }
        };
      })

      .directive('cronAutoComplete', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: async function (scope, element, attrs, ngModelCtrl) {
            var select = {};
            try {
              select = JSON.parse(attrs.options);
            } catch(err) {
              console.log('AutoComplete invalid configuration! ' + err);
            }

            try {
              delete options.dataSource.schema.model.id;
            } catch(e){}

            var options = await app.kendoHelper.getConfigCombobox(select, scope);
            options.change = attrs.ngChange ? function (){scope.$eval(attrs.ngChange)}: undefined;
            options.close = attrs.ngClose ? function (){scope.$eval(attrs.ngClose)}: undefined;
            options.dataBound = attrs.ngDataBound ? function (){scope.$eval(attrs.ngDataBound)}: undefined;
            options.filtering = attrs.ngFiltering ? function (){scope.$eval(attrs.ngFiltering)}: undefined;
            options.select = attrs.ngSelect ? function (){scope.$eval(attrs.ngSelect);}: undefined;
            var parent = element.parent();
            var id = attrs.id ? ' id="' + attrs.id + '"' : '';
            var cronDisabled = attrs.cronDisabled;
            var name = attrs.name ? ' name="' + attrs.name + '"' : '';
            var validationmessage = attrs.validationmessage ? ' validationmessage="' + attrs.validationmessage + '"' : '';
            var required = '';
            if (attrs.ngRequired || attrs.required) {
              required = ' required ';
            }
            $(parent).append('<input style="width: 100%;" ' + id + name + required + validationmessage + ' class="cronAutoComplete" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronAutoComplete');
            $(element).remove();

            options['change'] = function(e) {
              scope.$apply(function () {
                ngModelCtrl.$setViewValue($element.val());
              });
            }

            if(attrs.autoExpand == "true"){
                $element.on('focus', function (e) {
                    autoComplete.search();
                });
              }

            options.messages =  {
                noData: attrs.noResultsMessage ? attrs.noResultsMessage : "NO DATA FOUND"
            };

            if(attrs.firstOptionOnBlur == "false"){
                options.suggest = false;
            }

            var autoComplete = $element.kendoAutoComplete(options).data('kendoAutoComplete');

            if(cronDisabled){
              autoComplete.enable(false);
            } else {
              autoComplete.enable(true);
            }

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                autoComplete.value(value);
                return value;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value) {
                  if (typeof value == 'string') {
                    return value;
                  } else if (value[select.dataTextField]) {
                    return value[select.dataTextField];
                  }
                }

                return null;
              });
            }
          }
        }
      })

      .directive('cronDate', ['$compile', '$translate', '$window', function ($compile, $translate, $window) {
        return {
          restrict: 'AE',
          require: '?ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var options = {};
            var cronDate = {};

            try {
              if (attrs.options)
                cronDate =  JSON.parse(attrs.options);
              else {
                var json = window.buildElementOptions(element);
                cronDate = JSON.parse(json);
              }
              if (!cronDate.format) {
                cronDate.format = parseMaskType(cronDate.type, $translate)
              }
              options = app.kendoHelper.getConfigDate($translate, cronDate);
            } catch(err) {
              console.log('AutoComplete invalid configuration! ' + err);
            }

            var useUTC = options.type == 'date' || options.type == 'datetime' || options.type == 'time';

            if (!window.fixedTimeZone) {
              useUTC = false;
            }

            var $element = $(element);
            if ($element.data('alreadycompiled'))
              return;
            $element.data('alreadycompiled',true);
            $element.data('$compile', $compile);

            if (attrs.fromGrid) {
              $element = $(element);
            }
            else {
              var parent = element.parent();
              var $input = $('<input style="width: 100%;" class="cronDate" ng-model="' + attrs.ngModel + '"/>');
              $(parent).append($input);
              $element = $(parent).find('input.cronDate');
              $element.data("type", options.type);
              $element.attr("type", "date");
            }

            var datePicker = app.kendoHelper.buildKendoMomentPicker($element, options, scope, ngModelCtrl);

            if (!attrs.fromGrid) {
              if (ngModelCtrl) {
                ngModelCtrl.$formatters.push(function (value) {
                  var selDate = null;

                  if (value) {
                    var momentDate = null;

                    if (useUTC) {
                      momentDate = moment(value).utcOffset(window.timeZoneOffset);;
                    } else {
                      momentDate = moment(value);
                    }

                    selDate = momentDate.format(options.momentFormat);
                  }

                  datePicker.value(selDate);

                  return selDate;
                });

                ngModelCtrl.$parsers.push(function (value) {
                  if (value) {
                    var momentDate = null;
                    if (useUTC) {
                      momentDate = moment(datePicker._oldText, options.momentFormat).utcOffset(window.timeZoneOffset);
                    } else {
                      momentDate = moment(datePicker._oldText, options.momentFormat);
                    }
                    return momentDate.toDate();
                  }

                  return null;
                });
              }

              $(element).remove();
            }
          }
        }
      }])

      .directive('cronSlider', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          getActive: function(active, scope) {
            if (active && active.indexOf('.active.')) {
              try {
                return scope.$eval(active.substr(0, active.indexOf('.active.')));
              } catch(e) {}
            }

            return undefined;
          },
          link: function (scope, element, attrs, ngModelCtrl) {
            var slider = {};

            try {
              slider = JSON.parse(attrs.options);
            } catch(err) {
              console.log('Slider invalid configuration! ' + err);
            }

            var config = app.kendoHelper.getConfigSlider(slider);
            var dataSource = this.getActive(attrs.ngModel, scope);
            config.change = function (){
              scope.$apply(function () {
                var value = $(element).val();
                if (dataSource) {
                  value = dataSource.normalizeValue(value, true)
                }
                ngModelCtrl.$setViewValue(value);
                if (attrs.ngChange) {
                  scope.$eval(attrs.ngChange);
                }
              });
            }

            config.slide = attrs.ngSlide ? function (){scope.$eval(attrs.ngSlide)}: undefined;
            var slider = $(element).kendoSlider(config).data("kendoSlider");

            const resizeObserver = new ResizeObserver(entries => {
              slider.resize();
            });
            resizeObserver.observe(slider.wrapper[0])

            if (attrs.ngRequired === 'true' || attrs.required) {
              var id = attrs.id ? ' id="input' + app.common.generateId() + '"' : '';
              var name = attrs.name ? ' name="input' + app.common.generateId() + '"' : '';
              var parent = element.parent();
              $(parent).append('<input aria-label="slider" autocomplete="off" tabindex="-1" style="width: 100%;"' + id + name + ' required class="cronSlider cron-select-offscreen" ng-model="' + attrs.ngModel + '"/>');
              var input = $(parent).find("input.cronSlider");
              $compile(input)(element.scope());
            }

            scope.$watch(function(){return ngModelCtrl.$modelValue}, function(value, old){
              if (value !== old) {
                if (!value) {
                  slider.value(slider.min());
                } else {
                  slider.value(value);
                }
              }
            });

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = null;

                if (!value && slider.min) {
                  result = slider.min;
                } else if (value) {
                  result = value;
                }

                slider.value(result);

                return result;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value) {
                  return value;
                }

                return null;
              });
            }
          }
        }
      })

      .directive('cronSwitch', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            var cronSwitch = {};

            try {
              var json = window.buildElementOptions(element);
              cronSwitch = JSON.parse(json);
            } catch(err) {
              console.log('Switch invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigSwitch(cronSwitch);
            var parent = element.parent();
            $(parent).append('<input style="width: 100%;" class="cronSwitch" ng-model="' + attrs.ngModel + '"/>');
            var $element = $(parent).find('input.cronSwitch');

            var change = function(e) {
              scope.$apply(function () {
                ngModelCtrl.$setViewValue(this.value());
              }.bind(this));
            }
            options['change'] = change;

            var mobSwitch = $element.kendoMobileSwitch(options).data('kendoMobileSwitch');
            $(element).remove();

            if (ngModelCtrl) {
              ngModelCtrl.$formatters.push(function (value) {
                var result = false;

                if (value != undefined) {
                  result = value;
                }

                mobSwitch.value(result);

                return result;
              });

              ngModelCtrl.$parsers.push(function (value) {
                if (value != undefined) {
                  return value;
                }

                return false;
              });
            }
          }
        }
      })

      .directive('cronBarcode', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModel) {
            var cronBarcode = {};

            try {
              var json = window.buildElementOptions(element);
              cronBarcode = JSON.parse(json);
            } catch(err) {
              console.log('Barcode invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigBarcode(cronBarcode);
            var parent = element.parent();
            $(parent).append('<span class="cronBarcode" ng-model="' + attrs.ngModel + '"></span>');
            var $element = $(parent).find('span.cronBarcode');

            var kendoBarcode = $element.kendoBarcode(options).data('kendoBarcode');
            $(element).remove();

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              var result = '';

              if (value !== old) {
                result = value;
              }

              options['value'] = result;
              kendoBarcode.setOptions(options);
            });
          }
        }
      })

      .directive('cronQrcode', function ($compile) {
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModel) {
            var cronQrcode = {};

            try {
              var json = window.buildElementOptions(element);
              cronQrcode = JSON.parse(json);
            } catch(err) {
              console.log('Qrcode invalid configuration! ' + err);
            }

            var options = app.kendoHelper.getConfigQrcode(cronQrcode);
            var parent = element.parent();
            $(parent).append('<span class="cronQrcode" ng-model="' + attrs.ngModel + '"></span>');
            var $element = $(parent).find('span.cronQrcode');

            var kendoQRCode = $element.kendoQRCode().data('kendoQRCode');
            $(element).remove();

            scope.$watch(function(){return ngModel.$modelValue}, function(value, old){
              var result = '';

              if (value !== old) {
                result = value;
              }

              options['value'] = result;
              kendoQRCode.setOptions(options);
            });
          }
        }
      })

      .directive('cronappRating', function() {
        'use strict';
        return {
          restrict: 'E',
          require: 'ngModel',
          link: function(scope, elem, attrs, ngModelCtrl) {

            attrs.theme = $(elem).find('i').attr('xattr-theme');
            attrs.iconOn = $(elem).find('i').attr('class');

            var $elem = $(elem);
            var starArray = [];

            if (attrs.xattrDefaultValue) {
              ngModelCtrl.$viewValue = 0; //set new view value
              ngModelCtrl.$commitViewValue();
            }

            for (var i=1;i<=5;i++) {
              starArray.push($(elem).find('i').get(i - 1));
              $(starArray[i-1]).addClass(attrs.iconOff || "fa fa-star-o");
            }

            $elem.html("");
            var stars = [];

            for (var i=1;i<=5;i++) {
              var clonned = $(starArray[i-1]).clone();
              $elem.append(clonned);

              clonned.attr("idx", i);
              clonned.click(function() {
                scope.$apply(function() {
                  let idx = parseInt($(this).attr("idx"));
                  //set new view value or reset the value
                  ngModelCtrl.$viewValue = ( ngModelCtrl.$viewValue !== idx ) ? idx : 0;
                  ngModelCtrl.$commitViewValue();

                }.bind(this));
              });

              stars.push(clonned);
            }

            function changeStars(value) {
              for (var i=1;i<=5;i++) {
                stars[i-1].removeClass(attrs.iconOff || 'fa fa-star-o');
                stars[i-1].removeClass(attrs.iconOn);
                stars[i-1].removeClass(attrs.theme);
                if (i <= value) {
                  stars[i-1].addClass(attrs.iconOn);
                  stars[i-1].addClass(attrs.theme);
                } else {
                  stars[i-1].addClass(attrs.iconOff || 'fa fa-star-o');
                  stars[i-1].addClass(attrs.theme);
                }
              }
              return value;
            }
            ngModelCtrl.$parsers.push(changeStars);
            ngModelCtrl.$formatters.push(changeStars);

          }
        }
      })

      .directive('cronDynamicMenu', ['$compile', '$translate', function ($compile, $translate) {
        'use strict';
        const populateItems = (items) => {
          var templateItens = '';

          if (items && items.length > 0 && Array.isArray(items)) {
            items.forEach(function (item) {

              var security = (item.security && item.security != null) ? ` cronapp-security="${item.security }" ` : '';
              var action = (item.action && item.action != null) ? ` ng-click="${item.action}" ` : '';
              var hide = (item.hide && item.hide != null) ? ` ng-hide="${item.hide}"  ` : '';
              var iconClass = (item.iconClass && item.iconClass != null) ? `<i class="${item.iconClass}" id="menu-tag-i-${item.id}"></i>&nbsp;` : '';
              var title = `<span id="menu-tag-span-${item.id}"></span>`;
              var caret = (item.menuItems && Array.isArray(item.menuItems) && (item.menuItems.length > 0)) ? `<span class="caret submenu" id="menu-tag-span-sub-${item.id}"></span>` : '';

              if (item.title) {
                title =  `<span id="menu-tag-span-${item.id}">${$translate.instant(item.title)}</span>`;
              }

              if (item.menuItems.length > 0) {
                templateItens = templateItens + `
                <li class="dropdown-submenu" ${security}${hide} id="menu-tag-li-sub-${item.id}"> \
                  <a  href="" ${action} id="menu-tag-a-sub-${item.id}" class="dropdown-item dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> ${iconClass} ${title} ${caret} </a> \
                    ${populateItems(item.menuItems)}\
                </li>`;
              } else {
                templateItens = templateItens + `
                <li class="dropdown-submenu" ${security} ${hide} id="menu-tag-li-${item.id}"> \
                  <a  href="" ${action} id="menu-tag-a-${item.id}" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">${iconClass} ${title} ${caret} </a> 
                </li>`;
              }

            });

            if (templateItens != '') {
              templateItens = `<ul class="dropdown-menu" id="menu-tag-ul-${items[0].id}">${templateItens}</ul>`;
            }
          }
          return templateItens;
        }
        return {
          restrict: 'EA',
          populateMenu: function (menuOptions, isVertical) {
            var template = '';

            if (menuOptions && menuOptions != null && menuOptions.subMenuOptions && menuOptions.subMenuOptions != null && Array.isArray(menuOptions.subMenuOptions)) {

              menuOptions.subMenuOptions.forEach(function (menu) {

                var security = (menu.security && menu.security != null) ? ` cronapp-security="${menu.security}" ` : '';
                var action = (menu.action && menu.action != null) ? ` ng-click="${menu.action }" ` : '';
                var caret = (menu.menuItems && Array.isArray(menu.menuItems) && (menu.menuItems.length > 0)) ? `<span class="caret" id="menu-tag-span-sub-${menu.id}"></span>` : '';
                var hide = (menu.hide && menu.hide != null) ? ` ng-hide="${menu.hide}" ` : '';
                var iconClass = (menu.iconClass && menu.iconClass != null) ? `<i class="${menu.iconClass}"></i>&nbsp;` : '';
                var title = `<span id="menu-tag-span-${menu.id}"></span>`;

                if (menu.title) {
                  title = `<span id="menu-tag-span-${menu.id}">${$translate.instant(menu.title)}</span>`;
                }

                template = template + `
                <li class="dropdown nav-item ${(isVertical ? 'col-md-12 padding-0' : '')}" ${security} ${hide} id="menu-tag-li-sub-${menu.id}">
                  <a href="" ${action} id="menu-tag-a-sub-${menu.id}" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\
                  ${iconClass} ${title} ${caret}
                  </a>
                  ${populateItems(menu.menuItems)}
                </li>`;

              })
            }

            return template;
          },
          link: function (scope, element, attrs) {
            $translate.onReady(() => {
              //Somente fica na vertical se for o menu principal da IDE (E estiver configurado para isso)
              let isVertical = element.closest('.crn-navigator-vertical').length;

              var options = {};
              try {
                options = JSON.parse(attrs.options);
              } catch (e) {
                console.log('CronDynamicMenu: Invalid configuration!')
              }
              let baseId = options && options.subMenuOptions ? options.subMenuOptions[0].id : "first";
              var TEMPLATE_MAIN = `<ul id="menu-tag-ul-base-${baseId}" class="nav navbar-nav ${(isVertical ? 'col-md-12 padding-0' : '')}" ></ul>`;
              var main = $(TEMPLATE_MAIN);
              main.attr('id', attrs.id);

              var menus = this.populateMenu(options, isVertical);
              main.append(menus);
              if (isVertical) {
                main.append($('#navbar2 li:first').addClass('col-md-12 padding-0'));
              }

              var newElement = angular.element(main);
              element.html('');
              element.append(main);
              element.attr('id', null);
              $compile(newElement)(scope);

              var multilevelAction = attrs.multilevelAction;

              if (multilevelAction === 'hover') {
                $('.dropdown-menu .dropdown-submenu').on('mouseover', function () {
                  var subMenu = $(this).children('ul.dropdown-menu');
                  subMenu.addClass('displayBlock');
                });

                $('.dropdown-menu .dropdown-submenu').on('mouseout', function () {
                  var subMenu = $(this).children('ul.dropdown-menu');
                  subMenu.removeClass('displayBlock');
                });
              }
              if (multilevelAction === 'click') {
                $('.dropdown-menu a.dropdown-toggle').on('click', function (e) {
                  if (!$(this).next().hasClass('show')) {
                    $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
                  }
                  var $subMenu = $(this).next(".dropdown-menu");
                  $subMenu.toggleClass('show');
                  $(this).parents('li.nav-item.dropdown').on('hidden.bs.dropdown', function (e) {
                    $('.dropdown-submenu .show').removeClass("show");
                  });
                  return false;
                });
              }
            });
          }
        }
      }])

      .directive('cronBreadcrumbs', function () {
      'use strict';
      return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {
          let crnDelimiterIcon = attrs.crnDelimiterIcon;
          let crnTypeMenu = attrs.typeMenu;
          let idMenu = attrs.idMenu ? attrs.idMenu : null;
          let breadcrumb = [];
          let actionBlockly = attrs.ngInit ? attrs.ngInit : null;
          let idBreadcrumb = attrs.id;
          let arrayPaiBreadcrumb = [];

          let iconRoot = attrs.breadcrumbIcon ? attrs.breadcrumbIcon : null;

          async function functionActionBlockly() {
            let shortVersion = actionBlockly.replace("cronapi.client('js.", 'blockly.js.');
            actionBlockly = shortVersion.replace("').run()", '');
            actionBlockly = scope.$eval(actionBlockly);
            breadcrumb = await actionBlockly();

            $(`#${idBreadcrumb}`).kendoBreadcrumb({
              items: breadcrumb,
              delimiterIcon: crnDelimiterIcon,
              navigational: true
            });
          }

          if (actionBlockly && crnTypeMenu === "idBloco") {
            functionActionBlockly()

          } else {
            setTimeout(() => {
              // Capturar o  json do menu
              let menuOptions = $(`#${idMenu}`)[0].children[0].attributes['options'];
              menuOptions = JSON.parse(menuOptions.value);
              let subMenuOptions = menuOptions.subMenuOptions;

              // Capturar a url da pagina
              let page = document.location.hash;
              page = page.split("/");

              inicio(subMenuOptions);

              function inicio(items) {
                let x = false;

                for (let i in items) {

                  let action = items[i].action;
                  if (action && action != "") {
                    action = action.replace("cronapi.screen.changeView('", '');
                    action = action.replace("', [])", '')
                    action = action.split("/");
                  } else {
                    action = null
                  }

                  if (items[i].level === 1) {
                    arrayPaiBreadcrumb = [];
                  }

                  if (arrayPaiBreadcrumb.length != 0 && items[i].level === arrayPaiBreadcrumb[arrayPaiBreadcrumb.length - 1].level) {
                    if (!action) {
                      arrayPaiBreadcrumb[arrayPaiBreadcrumb.length - 1] = {
                        level: items[i].level,
                        title: items[i].title,
                        href: '#'
                      };

                    } else if (action) {
                      arrayPaiBreadcrumb[arrayPaiBreadcrumb.length - 1] = {
                        level: items[i].level,
                        title: items[i].title,
                        href: document.location.origin + '/' + action.join("/")
                      };

                    }

                  } else {
                    if (!action) {
                      arrayPaiBreadcrumb.push({
                        level: items[i].level,
                        title: items[i].title,
                        href: '#'
                      });
                    } else if (action) {
                      arrayPaiBreadcrumb.push({
                        level: items[i].level,
                        title: items[i].title,
                        href: document.location.origin + '/' + action.join("/")
                      });
                    }
                  }

                  if (items[i].menuItems.length > 0) {
                    inicio(items[i].menuItems);

                  } else {
                    if (action) {
                      if (action[action.length - 1] === page[page.length - 1]) {
                        x = true;
                      }
                    }
                  }

                  if (x) {
                    for (let y in arrayPaiBreadcrumb) {

                      if (y == 0 && arrayPaiBreadcrumb[y].level == 1) {
                        breadcrumb.push({
                          type: "rootitem",
                          href: arrayPaiBreadcrumb[y].href,
                          text: arrayPaiBreadcrumb[y].title,
                          showText: true,
                          showIcon: false
                        })
                      } else if (y == 0 && arrayPaiBreadcrumb[y].level != 1) {
                        breadcrumb.push({
                          type: "rootitem",
                          href: arrayPaiBreadcrumb[y].href,
                          text: arrayPaiBreadcrumb[y].title,
                          showText: true,
                          showIcon: false
                        })
                      } else {
                        breadcrumb.push({
                          type: "item",
                          href: arrayPaiBreadcrumb[y].href,
                          text: arrayPaiBreadcrumb[y].title,
                          showText: true,
                          showIcon: false
                        })
                      }
                    }

                    return breadcrumb
                  }
                }
              }

              $(`#${idBreadcrumb}`).kendoBreadcrumb({
                items: breadcrumb,
                delimiterIcon: crnDelimiterIcon,
                navigational: true
              });

            }, 800);
          }
        }
      }
    })

      .directive('ngInitialValue', function($parse) {
        return {
          restrict: 'A',
          require: 'ngModel',
          link: async function(scope, element, attrs, ngModelCtrl) {
            if (attrs.ngInitialValue) {
              var modelGetter = $parse(attrs['ngModel']);
              var modelSetter = modelGetter.assign;
              var evaluated;

              try {
                if(attrs.ngInitialValue.indexOf("cronapi.client('js.") != -1){//cronapi caller?
                    let shortVersion = attrs.ngInitialValue.replace("cronapi.client('js.", 'blockly.js.');
                    let blocklyPackage = shortVersion.split("').names")[0];
                    blocklyPackage = blocklyPackage.split("').attr()")[0];
                    let blocklyParams = shortVersion.split('.run')[1];
                    evaluated = await scope.$eval(blocklyPackage + blocklyParams);
                } else {
                    evaluated = scope.$eval(attrs.ngInitialValue);
                }
              } catch (e) {
                evaluated = attrs.ngInitialValue;
              }

              // verifica se é um checkbox para transformar para um valor booleano
              if (element[0].type == 'checkbox' && evaluated) {
                evaluated = ('' + evaluated).toLowerCase() == 'true';
              }

              modelSetter(scope, evaluated);
            }
          }
        }
      })

      .directive('crnSetIndeterminate', function($parse) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            let value = eval(attrs.crnSetIndeterminate);
            if(value === null){
              $(element).prop("indeterminate", true);
            }
          }
        }
      })

      .directive('crnAllowNullValues', [function () {
        return {
          restrict: 'A',
          require: '?ngModel',
          link: function (scope, el, attrs, ctrl) {
            ctrl.$formatters = [];
            ctrl.$parsers = [];

            let falseValue = attrs.ngFalseValue ? attrs.ngFalseValue.split("'").join("") : false;
            let trueValue = attrs.ngTrueValue ? attrs.ngTrueValue.split("'").join("") : true;

            let isAllowNullValues = (value) => {
                return value === 'true' || value === undefined
                    || value === null || value.length == 0;
            };

            if (isAllowNullValues(attrs.crnAllowNullValues)) {
              ctrl.$render = function () {
                let viewValue = ctrl.$viewValue;
                el.data('checked', viewValue);
                switch (viewValue) {
                  case true:
                  case trueValue:
                    el.prop('indeterminate', false);
                    el.prop('checked', true);
                    viewValue = trueValue;
                    break;
                  case false:
                  case falseValue:
                    el.prop('indeterminate', false);
                    el.prop('checked', false);
                    viewValue = falseValue;
                    break;
                  default:
                    viewValue = null;
                    el.prop('indeterminate', true);
                }
                setTimeout(() => ctrl.$setViewValue(viewValue));
              };
            } else {
              ctrl.$render = function () {
                let viewValue = ctrl.$viewValue;
                if (ctrl.$viewValue === undefined || ctrl.$viewValue === null) {
                  ctrl.$setViewValue(false);
                  viewValue = false;
                }
                if (viewValue === falseValue) {
                  let modelForEval = attrs.ngFalseValue ? `${el.attr('ng-model')}=${attrs.ngFalseValue}` : `${el.attr('ng-model')}=${falseValue}`;
                  scope.$eval(modelForEval);
                }
                el.data('checked', viewValue);
                switch (viewValue) {
                  case true:
                  case trueValue:
                    el.prop('indeterminate', false);
                    el.prop('checked', true);
                    viewValue = trueValue;
                    break;
                  default:
                    el.prop('indeterminate', false);
                    el.prop('checked', false);
                    viewValue = falseValue;
                    break;
                }
                setTimeout(() => ctrl.$setViewValue(viewValue));
              };
            }
            el.bind('click', function () {
              let checked;
              switch (el.data('checked')) {
                case false:
                case falseValue:
                  checked = attrs.ngTrueValue ? trueValue : true;
                  break;
                default:
                  checked = attrs.ngFalseValue ? falseValue : false;
              }
              ctrl.$setViewValue(checked);
              scope.$apply(ctrl.$render);
            });
          }
        };
      }])

      .directive('signaturePad', function($compile, $window) {
        'use strict';

        var signaturePad, canvas, element, EMPTY_IMAGE = null;
        return {
            restrict: 'E',
            require: "ngModel",
            scope: true,
            replace: true,
            template: '<div>' +
                '<canvas style="width:100%" ng-click="mouseup()" ng-mouseup="mouseup()"></canvas>' +
                '<div>' +
                '<button type="button" class="btn btn-warning" style="margin-right:5px;margin-bottom:5px;" ng-click="clear()">{{"clear"|translate}}</button>' +
                '</div>' +
                '</div>',
            scope: {
                clear: '=',
                dataurl: '=',
                height: '@',
                width: '@',
                ngClick: '@',
                ngModel: '='
            },
            controller: [
                '$scope',
                function($scope) {

                    $scope.mouseup = function() {

                        var signature = {};

                        if (!$scope.signaturePad.isEmpty()) {
                            signature.dataUrl = $scope.signaturePad.toDataURL();
                            signature.isEmpty = false;

                        } else {
                            signature.dataUrl = EMPTY_IMAGE;
                            signature.isEmpty = true;
                        }

                        if (signature.dataUrl == null) {
                            return;
                        }
                        var binary = signature.dataUrl.split(',')[1];
                        $scope.ngModel = binary;
                    };

                    $scope.$watch('ngModel', function(value, old) {

                        var signature = $scope.signaturePad;
                        var data = $scope.ngModel;

                        if (value !== old) {
                            signaturePad.clear();
                            signature.fromDataURL("data:image/png;base64," + value, {
                                ratio: 1
                            });
                            $scope.ngModel = value;
                        }
                    }, true);

                    $scope.clear = function() {
                        $scope.signaturePad.clear();
                        $scope.ngModel = null;
                    };

                }
            ],
            link: function(scope, element, attrs, ngModelCtrl) {

                canvas = element.find('canvas')[0];

                scope.onResize = function() {

                    var canvas = element.find('canvas')[0];
                    var ratio = Math.max($window.devicePixelRatio || 1, 1);
                    canvas.width = canvas.offsetWidth * ratio;
                    canvas.height = canvas.offsetHeight * ratio;
                    canvas.getContext("2d").scale(ratio, ratio);
                }

                scope.onResize();

                scope.signaturePad = new SignaturePad(canvas);

                angular.element($window).bind('resize', function() {
                    scope.onResize();
                });

                $compile(element)(element.scope());
            }
        };
    })

      .directive('cronChat',  ['$compile', '$translate', function($compile, $translate) {
        return {
          restrict: 'E',
          replace: true,
          link: function (scope, element, attrs, ngModelCtrl) {

            var options = JSON.parse(attrs.options || "{}");
            if (options.token && options.urlCronchat) {

              var urlChat = options.urlCronchat.endsWith("/") ? options.urlCronchat : options.urlCronchat + '/';
              var token = options.token;

              var $templateDyn = $(`<script src="${urlChat}get-chat?token=${token}" type="text/javascript"></script>`);
              element.html($templateDyn);
            }

          }
        };
      }])

      .directive('updateLanguage', function($rootScope) {
        return {
          link: function( scope, element ) {
            var listener = function( event, translationResp ) {
              var defaultLang = "en",
                  currentlang = translationResp.language;

              if (currentlang  === 'pt_br')
                currentlang = "pt-br";
              else if (currentlang.startsWith('en'))
                currentlang = "en";

              element.attr("lang", currentlang || defaultLang );
            };

            $rootScope.$on('$translateChangeSuccess', listener);
          }
        };
      })

      .directive('cronFrame', function($compile, $sce, $parse) {
        'use strict';
        return {
          restrict: 'AE',
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            if (ngModelCtrl) {
              scope.$watch(attrs.ngModel, function(newVal) {
                if (newVal !== attrs.origin) {
                  attrs.$set("origin", newVal == undefined ? attrs.origin : newVal);
                  const modelGetter = $parse(attrs['ngModel']);
                  let modelSetter = modelGetter.assign;
                  let template = "";
                  if (attrs.type == 'include') {
                    template = $(`<div class="cronframeOption" ng-include="'${attrs.origin}'"></div>`);
                  } else if (attrs.type == 'frame') {
                    var url = $sce.trustAsResourceUrl(attrs.origin);
                    template = $(`<iframe class="cronframeOption" ng-src="${url}" width="100%" height="100%" loading="lazy"></iframe>`);
                  }
                  modelSetter(scope, attrs.origin);
                  element.html(template);
                  $compile(template)(scope);
                }
              })
            }
          }
        }
      })

      .directive("fromGrid", ($compile) => {
        return {
          restrict: 'A',
          priority: -999999,
          exist: (element) => {
            let id = element.attr('id');
            return $(`#${id}`).length;
          },
          isFromGrid: (attr) => {
            return attr.fromGrid === "true";
          },
          isCompiled: (element) => {
            return element.data('alreadycompiled');
          },
          getDateAs: function (element, value, as) {
            let mask = element.data('mask');
            let useUTC = element.data('useUTC');
            return formatWithMomentAs(mask, useUTC, value, as);
          },
          prepareValue: function (element, value) {
            let columnType = element.data('column-type') || '';
            if (columnType.startsWith('date')) {
              value = this.getDateAs(element, value, "date");
            }
            return value;
          },
          formatComponent: function (element, value) {
            let kendoObj = element.data('kendoDropDownList') || element.data('kendoSlider');
            let columnType = element.data('column-type') || '';
            if (columnType.startsWith('date')) {
              element.val(this.getDateAs(element, value, "string"));
            }
            else if (kendoObj) {
              kendoObj.value(value);
            }
          },
          compileGridListing: function(element, scope) {
            let sender = element.data('ref-component');
            if (sender && sender.tbody && sender.tbody.length && !$(sender.tbody).find('.k-grid-edit-row').length) {
              var toCompile = sender.tbody;
              setTimeout(() => {
                scope.safeApply(() => {
                  var trs = $(toCompile);
                  var x = angular.element(trs);
                  $compile(x)(scope);
                });
              });
            }
          },
          link: function (scope, element, attr) {
            scope.$watch(attr.ngModel, (value) => {
              if (this.isFromGrid(attr) && this.exist(element) && this.isCompiled(element)) {
                value = this.prepareValue(element, value);
                this.formatComponent(element, value);
                this.compileGridListing(element, scope);
                call = element.data('change-grid-model');
                call && call(value);
              }
            });
          }
        }
      })

      .directive('cronOrderedList', function ($compile, $sce, $parse) {
        'use strict';
        return {
          restrict: 'EA',
          replace: true,
          link: function (scope, element, attrs, ngModelCtrl) {

            let attributeValue = attrs.attributeValue;
            let orderedAttributeValue = attrs.orderedAttributeValue
            let listType = attrs.listType;
            let content = element[0].children[0].children;
            content = $(content);
            let templateDyn = '';
            let contentUL = '';

            $.each(content, function (i, item) {
              contentUL = contentUL + item.outerHTML;
            });

            switch (listType) {
              case 'numbered-list':
                templateDyn = `<ol style="list-style-type: ${attributeValue}">${contentUL}</ol>`
                break

              case 'ordered-list':
                templateDyn = `<ul style="list-style-type: ${orderedAttributeValue}">${contentUL}</ul>`
                break
            }

            templateDyn = $(templateDyn);
            $(element).replaceWith(templateDyn);
            $compile(templateDyn)(scope);
          }
        }
      })

}(app));

function maskDirectiveAsDate($compile, $translate, $parse) {
  return maskDirective($compile, $translate, $parse, 'as-date');
}

function maskDirectiveMask($compile, $translate, $parse) {
  return maskDirective($compile, $translate, $parse, 'mask');
}

function maskDirective($compile, $translate, $parse, attrName) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, element, attrs, ngModelCtrl) {
      if(attrName == 'as-date' && attrs.mask !== undefined)
        return;

      var modelGetter = $parse(attrs['ngModel']);

      var modelSetter = modelGetter.assign;


      var $element = $(element);
      if ($element.data('alreadycompiled'))
        return;
      $element.data('alreadycompiled', true);
      $element.data('$compile', $compile);

      var type = $element.attr("type");

      if (type == "checkbox" || type == "password" || type == "url"){
        return;
      }

      if(type == "color" || type == "range"){
        $element[0].classList.remove("form-control");
        $element[0].classList.remove("k-textbox");
        return;
      }

      $element.data("type", type);

      $element.attr("type", "text");

      if (ngModelCtrl) {
        ngModelCtrl.$formatters = [];
        ngModelCtrl.$parsers = [];
      }

      if (attrs.asDate !== undefined && type == 'text')
        type = "date";

      var textMask = true;

      var removeMask = false;

      var attrMask = attrs.mask || attrs.format;

      if (!attrMask) {
        attrMask = parseMaskType(type, $translate);
      } else {
        attrMask = parseMaskType(attrMask, $translate);
      }

      if (attrMask.endsWith(";0")) {
        removeMask = true;
      }

      var mask = attrMask.replace(';1', '').replace(';0', '').trim();
      if (mask == undefined || mask.length == 0) {
        return;
      }

      if (type == 'date' || type == 'datetime' || type == 'datetime-local' || type == 'month' || type == 'time' || type == 'time-local' || type == 'week') {

        var options = {
          format: mask,
          locale: $translate.use(),
          showTodayButton: true,
          useStrict: true,
          tooltips: {
            today: $translate.instant('DatePicker.today'),
            clear: $translate.instant('DatePicker.clear'),
            close: $translate.instant('DatePicker.close'),
            selectMonth: $translate.instant('DatePicker.selectMonth'),
            prevMonth: $translate.instant('DatePicker.prevMonth'),
            nextMonth: $translate.instant('DatePicker.nextMonth'),
            selectYear: $translate.instant('DatePicker.selectYear'),
            prevYear: $translate.instant('DatePicker.prevYear'),
            nextYear: $translate.instant('DatePicker.nextYear'),
            selectDecade: $translate.instant('DatePicker.selectDecade'),
            prevDecade: $translate.instant('DatePicker.prevDecade'),
            nextDecade: $translate.instant('DatePicker.nextDecade'),
            prevCentury: $translate.instant('DatePicker.prevCentury'),
            nextCentury: $translate.instant('DatePicker.nextCentury')
          }
        };

        if (mask != 'DD/MM/YYYY' && mask != 'MM/DD/YYYY') {
          options.sideBySide = true;
        }

        var useUTC = type == 'date' || type == 'datetime' || type == 'time';

        if (!window.fixedTimeZone) {
          useUTC = false;
        }

        $element.data('mask', mask);
        $element.data('useUTC', useUTC);

        if ($element.attr('from-grid')) {
          var openPopup = function() {
            var popup = $(this).offset();
            var isBellowInput = true;
            var datetimepickerShowing = $(this).parent().find('.bootstrap-datetimepicker-widget.dropdown-menu.usetwentyfour.bottom');
            if (!datetimepickerShowing.length) {
              isBellowInput = false;
              datetimepickerShowing = $(this).parent().find('.bootstrap-datetimepicker-widget.dropdown-menu.usetwentyfour.top');
            }
            if ($(datetimepickerShowing).offset()) {
              var popupLeft = $(datetimepickerShowing).offset().left;

              var grid = $('body');
              datetimepickerShowing.appendTo(grid);

              var popupTop = 0
              if (!isBellowInput)
                popupTop = popup.top - ($(datetimepickerShowing).height() + 15);
              else
                popupTop = popup.top + 35;

              datetimepickerShowing.css("top", popupTop);
              datetimepickerShowing.css("bottom", "auto");
              datetimepickerShowing.css("left", popupLeft);
              datetimepickerShowing.css("z-index", 999999);
            }
          };
          $element.on('click', openPopup);
          $element.on('focus', function() {
            setTimeout(openPopup.bind(this), 100);
          });
          $element.on('dp.change', function () {
            scope.safeApply(function () {
              var momentDate = null;
              if (useUTC) {
                momentDate = moment($element.val(), mask).utcOffset(window.timeZoneOffset, true);
              } else {
                momentDate = moment($element.val(), mask);
              }
              if (type == 'time' || type == 'time-local') {
                momentDate = momentDate.year(1970).dayOfYear(1).month(0);
              }
              if (momentDate.isValid() && ngModelCtrl) {
                modelSetter(scope, momentDate.toDate());
              }
            });
          });
          if ($element.data('initial-value')) {
            var initialValue = $element.data('initial-value');
            var momentDate = null;
            if (useUTC) {
              momentDate = moment(initialValue).utcOffset(window.timeZoneOffset);
            } else {
              momentDate = moment(initialValue);
            }
            $element.val(momentDate.format(mask));
            $element.data('initial-value', null);
          }

        }
        else {
          $element.wrap("<div style=\"position:relative\"></div>");
        }
        $element.datetimepicker(options);
        if (attrs.fromGrid !== "true") {
          $element.on('dp.change', function () {
            if ($(this).is(":visible")) {
              $(this).trigger('change');
              scope.safeApply(function () {
                var value = $element.val();
                var momentDate = null;
                if (useUTC) {
                  momentDate = moment(value, mask).utcOffset(window.timeZoneOffset, true);
                } else {
                  momentDate = moment(value, mask);
                }
                if (type == 'time' || type == 'time-local') {
                  momentDate = momentDate.year(1970).dayOfYear(1).month(0);
                }
                if (momentDate.isValid() && ngModelCtrl) {
                  modelSetter(scope, momentDate.toDate());
                }
              });
            }
          });
        }

        if (ngModelCtrl ) {
          ngModelCtrl.$formatters.push(function (value) {
            if (value) {
              return formatWithMomentAs(mask, useUTC, value, "string");
            }

            if(value === null){
              var dp = $element.datetimepicker(options).data('DateTimePicker');
              dp.date(null);
            }

            return null;
          });

          ngModelCtrl.$parsers.push(function (value) {
            if (value) {
              if (value instanceof Date) {
                return value;
              }
              var momentDate = null;
              if (useUTC) {
                momentDate = moment(value, mask).utcOffset(window.timeZoneOffset, true);
              } else {
                momentDate = moment(value, mask);
              }
              if (type == 'time' || type == 'time-local') {
                momentDate = momentDate.year(1970).dayOfYear(1).month(0);
              }
              return momentDate.toDate();
            }

            return null;
          });
        }

      } else if (type == 'number' || type == 'money' || type == 'integer' || type == 'money-decimal') {
        removeMask = true;

        var currency = mask.trim().replace(/\./g, '').replace(/\,/g, '').replace(/#/g, '').replace(/0/g, '').replace(/9/g, '');

        var prefix = '';
        var suffix = '';
        var thousands = '';
        var decimal = ',';
        var precision = 0;

        if (mask.startsWith(currency)) {
          prefix = currency;
        }
        else if (mask.endsWith(currency)) {
          suffix = currency;
        }

        var pureMask = mask.trim().replace(prefix, '').replace(suffix, '').trim();

        if (pureMask.startsWith("#.")) {
          thousands = '.';
        }
        else if (pureMask.startsWith("#,")) {
          thousands = ',';
        }

        var dMask = null;

        if (pureMask.indexOf(",0") != -1) {
          decimal = ',';
          dMask = ",0";
        }
        else if (pureMask.indexOf(".0") != -1) {
          decimal = '.';
          dMask = ".0";
        }

        if (dMask != null) {
          var strD = pureMask.substring(pureMask.indexOf(dMask) + 1);
          precision = strD.length;
        }

        var inputmaskType = 'numeric';

        if (precision == 0)
          inputmaskType = 'integer';

        if(type == 'money-decimal'){
          inputmaskType = 'currency';
        }

        var ipOptions = {
          'rightAlign':  (type == 'money' || type == 'money-decimal'),
          'unmaskAsNumber': true,
          'allowMinus': true,
          'prefix': prefix,
          'suffix': suffix,
          'radixPoint': decimal,
          'digits': precision,
          'numericInput' :  (type == 'money-decimal')
        };

        if (thousands) {
          ipOptions['autoGroup'] = true;
          ipOptions['groupSeparator'] = thousands;
        }

        $(element).inputmask(inputmaskType, ipOptions);
        useInputMaskPlugin(element, ngModelCtrl, scope, modelSetter, mask);
      }
      else if (type == 'text' || type == 'tel' || type == 'string') {
        if(!attrs.maskPlaceholder){
          $element.mask(mask);
          useMaskPlugin(element, ngModelCtrl, scope, modelSetter, removeMask);
        }
        else{
          options = {};
          options['placeholder'] = attrs.maskPlaceholder;
          $(element).inputmask(mask, options);
          if(removeMask){
            useInputMaskPlugin(element, ngModelCtrl, scope, modelSetter, mask);
          }
        }
      }
    }
  }
}

function useInputMaskPlugin(element, ngModelCtrl, scope, modelSetter, mask){
  var $element = $(element);
  var unmaskedvalue = function() {
    $(this).data('rawvalue',$(this).inputmask('unmaskedvalue'));
  }
  $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue);
  if (ngModelCtrl) {
    ngModelCtrl.$formatters.push(function (value) {
      if (value != undefined && value != null && value !== '') {
        return format(mask, value);
      }
      return null;
    });

    ngModelCtrl.$parsers.push(function (value) {
      if (value != undefined && value != null && value !== '') {
        var unmaskedvalue = $element.inputmask('unmaskedvalue');
        if (unmaskedvalue !== '')
          return unmaskedvalue;
      }
      return null;
    });
  }
}

function useMaskPlugin(element, ngModelCtrl, scope, modelSetter, removeMask){
  var $element = $(element);
  var unmaskedvalue = function() {
    if (removeMask)
      $(this).data('rawvalue',$(this).cleanVal());
  }
  $(element).on('keydown', unmaskedvalue).on('keyup', unmaskedvalue);

  if (removeMask && ngModelCtrl) {
    ngModelCtrl.$formatters.push(function (value) {
      if (value) {
        return $element.masked(value);
      }

      return null;
    });

    ngModelCtrl.$parsers.push(function (value) {
      if (value) {
        return $element.cleanVal();
      }

      return null;
    });
  }
}

function parseMaskType(type, $translate) {
  if (type == "datetime" || type == "datetime-local") {
    type = $translate.instant('Format.DateTime');
    if (type == 'Format.DateTime')
      type = 'DD/MM/YYYY HH:mm:ss'
  }

  else if (type == "date") {
    type = $translate.instant('Format.Date');
    if (type == 'Format.Date')
      type = 'DD/MM/YYYY'
  }

  else if (type == "time" || type == "time-local") {
    type = $translate.instant('Format.Hour');
    if (type == 'Format.Hour')
      type = 'HH:mm:ss'
  }

  else if (type == "month") {
    type = 'MMMM';
  }

  else if (type == "number") {
    type = $translate.instant('Format.Decimal');
    if (type == 'Format.Decimal')
      type = '#.#00,00'
  }

  else if (type == "money" || type == "money-decimal") {
    type = $translate.instant('Format.Money');
    if (type == 'Format.Money')
      type = '#.#00,00'
  }

  else if (type == "integer") {
    type = $translate.instant('Format.Integer');
    if (type == 'Format.Integer')
      type = '#,##0.####';
  }

  else if (type == "week") {
    type = 'dddd';
  }

  else if (type == "tel") {
    type = '(00) 00000-0000;0';
  }

  else if (type == "text") {
    type = '';
  }

  else if (type == "string") {
    type = '';
  }

  return type;
}

function transformText() {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function(scope, elem, attrs, ngModelCtrl) {

      var textTransform = function(element, value) {
        if (element) {
          if (value !== undefined && value !== null) {
            if(element.css('text-transform') === 'uppercase'){
              return value.toUpperCase();
            } else if(element.css('text-transform') === 'lowercase'){
              return value.toLowerCase();
            }
          }
          return value;
        }
      }

      if (ngModelCtrl) {
        ngModelCtrl.$formatters.push(function (result) {
          return textTransform(elem,result)
        });

        ngModelCtrl.$parsers.push(function (result) {
          return textTransform(elem,result)
        });
      }
    }
  }
}



app.kendoHelper = {
  getCorrectlyDS: (name, scope) => {
    if (scope[name].apiVersion) {
      return scope[name];
    }
    else {
      let ds = scope.$parent[name];
      scope[name] = ds;
      return ds;
    }
  },
  receivePushData: comp => !comp || !comp.dataSource || (comp.dataSource.transport.options.refComponent = comp),
  getSchema: function(dataSource) {
    var parseAttribute = [
      { kendoType: "string", entityType: ["string", "character", "uuid", "guid"] },
      { kendoType: "number", entityType: ["integer", "long", "double", "int", "float", "bigdecimal", "single", "int32", "int64", "decimal", "byte"] },
      { kendoType: "date", entityType: ["date", "time", "datetime"] },
      { kendoType: "boolean", entityType: ["boolean"] }
    ];

    var parseType = function(type) {
      for (var i = 0; i < parseAttribute.length; i++) {
        if (parseAttribute[i].entityType.includes(type.toLocaleLowerCase()))
          return parseAttribute[i].kendoType;
      }
      return "string";
    };

    var schema = {
      model : {
        id : "__$id",
        fields: {}
      }
    };
    if (dataSource && dataSource.schemaFields) {
      dataSource.schemaFields.forEach(function(field) {
        schema.model.fields[field.name] = {
          type: parseType(field.type),
          editable: true,
          nullable: field.nullable,
          validation: { required: !field.nullable },
        }
      });
      schema.model.fields["__$id"] = {
        type: "string",
        editable: true,
        nullable: true,
        validation: { required: false }
      }
    }
    return schema;
  },
  getDataSource: function(dataSource, scope, allowPaging, pageCount, columns, groupings) {
    var schema = this.getSchema(dataSource);
    if (columns) {
      columns.forEach(function(c) {
        for (var key in schema.model.fields) {
          if (c.dataType == "Database" && c.field == key ) {
            schema.model.fields[key].nullable = !c.required;
            schema.model.fields[key].validation.required = c.required;
            if (c.format === "999.999.999-99;0" || c.format === "99.999.999/9999-99;0") {
              let toValid = c.format === "999.999.999-99;0" ? "cpf" : "cnpj";
              let validator = {"cpf": CPF, "cnpj": CNPJ };
              let validatorName = key.toLocaleLowerCase() + 'validation';

              schema.model.fields[key].validation[validatorName] = function (input) {
                if (input.is("[name='"+key+"']") && input.val() != "") {
                  return validator[toValid].isValid(input.val());
                }
                return true;
              }
            }
            break;
          }
        }
      });
    }

    var parseParameter = function(data) {
      for (var attr in data) {
        if (schema.model.fields.hasOwnProperty(attr)) {

          var schemaField = schema.model.fields[attr];
          if (schemaField.type == 'string' && data[attr] != undefined)
            data[attr] = data[attr] + "";
          else if (schemaField.type == 'number' && data[attr] != undefined)
            data[attr] = parseFloat(data[attr]);
          else if (schemaField.type == 'date' && data[attr] != undefined)
            data[attr] = '/Date('+data[attr].getTime()+')/';
          else if (schemaField.type == 'boolean') {
            if (data[attr] == undefined)
              data[attr] = false;
            else
              data[attr] = data[attr].toString().toLowerCase() == "true"?true:false;
          }

          //Significa que é o ID
          if (schema.model.id == attr) {
            //Se o mesmo for vazio, remover do data
            if (data[attr] != undefined && data[attr].toString().length == 0)
              delete data[attr];
          }
        }
      }
      return data;
    };

    var pageSize = 10;
    if (app.kendoHelper.getCorrectlyDS(dataSource.name, scope))
      pageSize = app.kendoHelper.getCorrectlyDS(dataSource.name, scope).rowsPerPage;

    //Quando não for data UTC
    var offsetMiliseconds = new Date().getTimezoneOffset() * 60000;
    function onRequestEnd(e) {
      if (e.response  && e.response.d ) {
        var items = null;
        if (e.response.d.results)
          items = e.response.d.results;
        else
          items = [e.response.d];

        if (this.group().length) {

          columns.forEach( function(c) {
            if (c.dataType == 'Database') {
              var notUseUTC = c.type == 'datetime-local' || c.type == 'month' || c.type == 'time-local' || c.type == 'week';
              if (notUseUTC) {
                for (var i = 0; i < items.length; i++) {
                  var gr = items[i];
                  if (c.field == gr.Member) {
                    gr.Key = gr.Key.replace(/\d+/,
                        function (n) { return parseInt(n) + offsetMiliseconds }
                    );
                  }
                  addOffset.bind(this)(gr.Items);
                }
              }
            }
          });
        } else {
          addOffset.bind(this)(items);
        }
      }
    }

    function addOffset(items) {
      for (var i = 0; i < items.length; i++) {
        if (columns) {
          columns.forEach( function(c) {
            if (c.dataType == 'Database') {
              var notUseUTC = c.type == 'datetime-local' || c.type == 'month' || c.type == 'time-local' || c.type == 'week';
              if (notUseUTC) {
                if (items[i][c.field]) {
                  items[i][c.field] = items[i][c.field].replace(/\d+/,
                      function (n) { return parseInt(n) + offsetMiliseconds }
                  );
                }
              }
            }
          });
        }

      }
    }

    function getAggregate(columns) {
      var aggregates = [];
      if (columns) {
        columns.forEach(function(c) {
          if (c.aggregates) {
            c.aggregates.forEach(function(ag) {
              aggregates.push({field: c.field, aggregate: ag.type});
            });
          }
        });
      }
      return aggregates;
    }

    var datasourceId = app.common.generateId();
    var datasource = {
      transport: {
        setActiveAndPost: function(e) {
          var cronappDatasource = this.options.cronappDatasource;
          scope.safeApply(cronappDatasource.updateActive(parseParameter(e.data)));
          cronappDatasource.active.__sender = datasourceId;
          cronappDatasource.postSilent(
              function(data) {
                this.options.enableAndSelect(e);
                e.success(data);
                this.options.refComponent.dataSource._pristineTotal = this.options.refComponent.dataSource._pristineData.push(data);
              }.bind(this),
              function(data) {
                this.options.enableAndSelect(e);
                e.error(data, data, data);
              }.bind(this)
          );
        },
        pushAction: function(type, callback) {
          return (data) => {
            let cantRemoveDsEvents = ["read", "memorydelete", "overRideRefresh"];
            if (this.options.isComponentInDocument(this.options.refComponent)) {
              let current = this.options.getCurrentCallbackForPush(callback, this.options.refComponent);
              let acceptedMethod = current[type];

              if (acceptedMethod) {
                acceptedMethod(data);
              }
              else {
                this.options.fromRead = type === "read";
                this.options.refComponent.dataSource.read();
              }
            }
            else if (!cantRemoveDsEvents.includes(type)) {
              this.options.cronappDatasource.removeDataSourceEvents(this.options.dataSourceEventsPush);
            }
          }
        },
        push: function(callback) {
          if (!this.options.dataSourceEventsPush && this.options.cronappDatasource) {
            this.options.dataSourceEventsPush = {
              create: this.pushAction.bind(this)('pushUpdate', callback),
              update: this.pushAction.bind(this)('pushUpdate', callback),
              delete: this.pushAction.bind(this)('pushDestroy', callback),
              overRideRefresh: this.pushAction.bind(this)('overRideRefresh', callback),
              read: this.pushAction.bind(this)('read', callback),
              memorycreate: this.pushAction.bind(this)('pushUpdate', callback),
              memoryupdate: this.pushAction.bind(this)('pushUpdate', callback),
              memorydelete: this.pushAction.bind(this)('pushDestroy', callback)
            };

            if (this.origin == 'combobox') {
              delete this.options.dataSourceEventsPush['overRideRefresh'];
            }
            this.options.cronappDatasource.addDataSourceEvents(this.options.dataSourceEventsPush);
          }
        },
        read:  function (e) {

          var doFetch = false;
          try {
            var cronappDatasource = this.options.cronappDatasource;

            if (!this.options.kendoCallback) {
              this.options.kendoCallback = e;
              doFetch = true;
            }
            else {
              if (this.options.fromRead) {
                this.options.kendoCallback.success(cronappDatasource.data);
              }
              else {
                doFetch = true;
              }
            }
          } finally {
            this.options.fromRead = false;
          }

          if (doFetch) {
            for (key in e.data)
              if(e.data[key] == undefined)
                delete e.data[key];
            var paramsOData = kendo.data.transports.odata.parameterMap(e.data, 'read');
            var orderBy = '';

            if (this.options.refComponent) {
              this.options.refComponent.dataSource.group().forEach(function(group) {
                orderBy += group.field +" " + group.dir + ",";
              });
            }
            if (orderBy.length > 0) {
              orderBy = orderBy.substr(0, orderBy.length-1);
              if (paramsOData.$orderby)
                paramsOData.$orderby =  orderBy + "," + paramsOData.$orderby;
              else
                paramsOData.$orderby = orderBy;
            }

            var cronappDatasource = this.options.cronappDatasource;
            cronappDatasource.rowsPerPage = e.data.pageSize;
            cronappDatasource.offset = (e.data.page - 1);

            //Significa que quer exibir todos
            if (!e.data.pageSize) {
              cronappDatasource.rowsPerPage = Number.MAX_SAFE_INTEGER_32;
              cronappDatasource.offset = undefined;
              paramsOData.$skip = 0;
              if (this.options.refComponent) {
                //Se houver grade associado, e a pagina não for a primeira, cancela a chamada atual, e faz novamente selecionando a pagina 1
                if (this.options.refComponent.dataSource.page() != 1) {
                  this.options.refComponent.dataSource.page(1);
                  e.error("canceled", "canceled", "canceled");
                  return;
                }
              }
            }

            var fetchData = {};
            fetchData.params = paramsOData;
            var append = false;
            if (dataSource.append) {
              append = dataSource.append;
            }

            var fetchOptions = {};
            //indicates that the search has already been clicked, set the fetchOptions orign to loadDataStrategy
            if (cronappDatasource.loadDataStrategy === "button" && cronappDatasource.data.length > 0) {
              fetchOptions.origin = cronappDatasource.loadDataStrategy;
            }

            cronappDatasource.append = append;
            cronappDatasource.fetch(fetchData, {
              success:  function(data) {
                e.success(data);
              },
              canceled:  function(data) {
                e.error("canceled", "canceled", "canceled");
              },
              error:  function(data) {
                e.error("canceled", "canceled", "canceled");
              }
            }, append, fetchOptions);
          }

        },
        update: function(e) {
          this.setActiveAndPost(e);
        },
        create: function (e) {
          this.setActiveAndPost(e);
        },
        destroy: function(e) {
          cronappDatasource = this.options.cronappDatasource;
          cronappDatasource.removeSilent(e.data,
              function(data) {
                e.success(data);
              },
              function(data) {
                e.error("canceled", "canceled", "canceled");
              }
          );
        },
        batch: function (e) {
        },
        options: {
          fromRead: false,
          disableAndSelect: function(e) {
            if (this.isComponentInDocument(this.refComponent)) {
              this.refComponent.select(e.container);
              this.refComponent.options.selectable = false;
              if (this.refComponent.selectable && this.refComponent.selectable.element) {
                this.refComponent.selectable.destroy();
                this.refComponent.selectable = null;
              }
            }
          },
          enableAndSelect: function(e) {
            if (this.isComponentInDocument(this.refComponent)) {
              this.refComponent.options.selectable = this.refComponent.options.originalSelectable;
              this.refComponent._selectable();
              this.refComponent.select(e.container);
            }
          },
          selectActiveInGrid: function(data) {
            //Verifica se já existe a grid
            if (this.isComponentInDocument(this.refComponent)) {
              //Verifica se tem a opção selecionavel setada e se tem registros
              if (this.refComponent.selectable && this.refComponent.dataItems().length > 0) {
                //Se já existir o active setado, verifica se tem na grade
                if (this.cronappDatasource.active && this.cronappDatasource.active.__$id) {
                  var items = this.refComponent.dataItems();
                  var idxSelected = -1;
                  for (var idx = 0; idx < items.length; idx++) {
                    if (this.cronappDatasource.active.__$id == items[idx].__$id) {
                      idxSelected = idx;
                      break;
                    }
                  }
                  if (idxSelected >-1 && !this.refComponent.selectable.options.multiple)
                    this.refComponent.select(this.refComponent.table.find('tr')[idxSelected]);
                }
              }
            }
          },
          isComponentInDocument: function(component) {
            if (!component) return false;
            return ($(document).has(component.element[0]).length);
          },
          getCurrentCallbackForPush: function(callback, component) {
            if (callback)
              return callback;
            return component;
          },
          cronappDatasource: app.kendoHelper.getCorrectlyDS(dataSource.name, scope)
        }
      },
      pageSize: pageSize,
      serverPaging: true,
      serverFiltering: true,
      serverSorting: true,
      batch: false,
      schema: schema,
      requestEnd: onRequestEnd
    };
    datasource.aggregate = getAggregate(columns);

    datasource.schema.total = function(){
      return datasource.transport.options.cronappDatasource.getRowsCount();
    };

    if (groupings) {
      datasource.group = [];

      groupings.forEach(function(g) {
        var group = { field: g.field, aggregates: datasource.aggregate };

        datasource.group.push(group);
      });
    }

    return datasource;
  },
  getEventReadCombo: function (e) {

    var cronappDatasource = this.options.cronappDatasource;

    if (!cronappDatasource) {
      e.error("canceled", "canceled", "canceled");
      return;
    }

    if (!this.options.kendoCallback)
      this.options.kendoCallback = e;

    var isFirst;
    if (this.options.combobox && this.options.combobox.options.readData) {
      e.success(this.options.combobox.options.readData);
      this.options.combobox.options.readData = null;
      this.options.alreadyLoaded = true;
      return;
    } else if (this.options.combobox) {
      isFirst = !this.options.alreadyLoaded;
    } else if (cronappDatasource.__ignoreFirstFetch) {
      isFirst = true;
      delete cronappDatasource.__ignoreFirstFetch;
    } else {
      isFirst = false;
    }

    this.options.alreadyLoaded = true;

    var doFetch = true;

    if (isFirst) {
      doFetch = false;
      if (cronappDatasource.lazy) {
        e.success([{}]);
      } else {
        e.success([]);
      }
    }

    if (this.options.fromRead) {
      this.options.fromRead = false;
      this.options.kendoCallback.success(cronappDatasource.data);
      doFetch = false;
    }

    if (doFetch) {
      for (key in e.data) {
        if(e.data[key] == undefined) {
          delete e.data[key];
        }
      }
      var paramsOData = kendo.data.transports.odata.parameterMap(e.data, 'read');

      cronappDatasource.rowsPerPage = e.data.pageSize;
      cronappDatasource.offset = (e.data.page - 1);

      var self = this;
      var silentActive = true;
      var fetchData = {};
      fetchData.params = paramsOData;
      if (self.options.combobox) {
        self.options.combobox.options.fromCombo = true;
      }
      cronappDatasource.fetch(fetchData, {
            success:  function(data) {
              if (e.success) {
                if (self.options.combobox) {
                  self.options.combobox.options.expanded = true;
                }
                e.success(data);
                self.options.kendoCallback = e;
                if (self.options && self.options.combobox && self.options.combobox.element[0].id) {
                  var expToFind = " .k-animation-container";
                  var x = angular.element($(expToFind));
                  self.options.$compile(x)(self.options.scope);
                }
              }
            },
            canceled:  function(data) {
              if (self.options.combobox) {
                self.options.combobox.options.fromCombo = false;
              }
              if (e.success) {
                e.error("canceled", "canceled", "canceled");
              }
            },
            error:  function(data) {
              if (self.options.combobox) {
                self.options.combobox.options.fromCombo = false;
              }
              if (e.success) {
                e.error("error", "error", "error");
              }
            }
          },
          false,
          {ignoreAtive: true}
      );
    }
  },
  parseOptionsCronToConfigKendo: function(options, dataSource, scope) {

    let valuePrimitive = false;

    if (!options.dynamic || options.dynamic=='false') {
      valuePrimitive = true;
      options.dataValueField = options.dataValueField || 'value';
      options.dataTextField = options.dataTextField || 'key';
    }
    else if (options.dataSourceScreen && options.dataSourceScreen.entityDataSource) {
      options.dataSourceScreen.entityDataSource.append = true;
      dataSource = app.kendoHelper.getDataSource(options.dataSourceScreen.entityDataSource, scope, true, options.dataSourceScreen.rowsPerPage);
      dataSource.transport.read = app.kendoHelper.getEventReadCombo;
      valuePrimitive = true;
    }

    if (!options.dataValueField || options.dataValueField.trim() == '') {
      options.dataValueField = (options.dataTextField == null ? undefined : options.dataTextField);
    }

    var getFieldType = function(field) {
      var fields = options.dataSourceScreen.entityDataSource.schemaFields;
      for (count = 0; count < fields.length; count++) {
        if (field == fields[count].name) {
          return fields[count].type.toLowerCase();
          break;
        }
      }

      return null;
    }

    var isValidDateType = function(field) {
      var dateTypes = ["date", "time", "datetime"];
      if(dateTypes.indexOf(field) > -1){
        return field;
      }
      return null;
    }

    if (!options.customTemplate) {
      if(options.dataSourceScreen && options.dataSourceScreen.entityDataSource && options.dataSourceScreen.entityDataSource.schemaFields) {
        if (options.format || (isValidDateType(getFieldType(options.dataTextField)))) {
          options.template = "#= useMask(" + options.dataTextField + ",'" + options.format + "','" + getFieldType(options.dataTextField) + "') #";
          options.valueTemplate = "#= useMask(" + options.dataTextField + ",'" + options.format + "','" + getFieldType(options.dataTextField) + "') #";
        }
      }
    }

    var config = {
      dataTextField: (options.dataTextField == null ? undefined : options.dataTextField),
      dataValueField: (options.dataValueField == null ? undefined : options.dataValueField),
      dataSource: dataSource,
      headerTemplate: (options.headerTemplate == null ? undefined : options.headerTemplate),
      template: (options.template == null ? undefined : options.template),
      placeholder: (options.placeholder == null ? undefined : options.placeholder),
      footerTemplate: (options.footerTemplate == null ? undefined : options.footerTemplate),
      filter: (options.filter == null ? undefined : options.filter),
      valuePrimitive : valuePrimitive,
      valueTemplate : (options.valueTemplate == null ? undefined : options.valueTemplate),
      suggest: true
    };

    if (options.optionLabel) {
      options.optionLabelText = options.optionLabel;
      options.optionLabelValue = '';
    }

    config.optionLabel = {};
    config.optionLabel[config.dataTextField] = options.optionLabelText === undefined ? "" : options.optionLabelText;
    config.optionLabel[config.dataValueField] = options.optionLabelValue === undefined ? null : options.optionLabelValue;
    return config;
  },
  getConfigComboboxSync: function(options, scope) {
    var dataSource = {};

    if (options) {
      if (!options.dynamic || options.dynamic=='false') {
        dataSource.data = (options.staticDataSource == null ? undefined : options.staticDataSource);
        for (let i = 0; i < dataSource.data.length; i++) {
          try {
            if (dataSource.data[i].key && dataSource.data[i].key.startsWith('cronapi.server(')) {
              dataSource.data[i].key = dataSource.data[i].key.replace('.run(','.notAsync().run(');
            }

            let keyEvaluated = scope.$eval(dataSource.data[i].key);
            dataSource.data[i].key = keyEvaluated !== undefined && keyEvaluated !== null ? keyEvaluated : dataSource.data[i].key;
          }
          catch (e) {
            dataSource.data[i].key = dataSource.data[i].key;
          }
        }
      }

      config = this.parseOptionsCronToConfigKendo(options, dataSource, scope);

      return config;
    }

    return {};
  },
  getConfigCombobox: async function(options, scope) {
    var dataSource = {};

    if (options) {
      if (!options.dynamic || options.dynamic=='false') {
        dataSource.data = (options.staticDataSource == null ? undefined : options.staticDataSource);
        for (let i = 0; i < dataSource.data.length; i++) {
          try {
            if (dataSource.data[i].key && dataSource.data[i].key.startsWith('cronapi.server(')) {
              dataSource.data[i].key = dataSource.data[i].key.replace('.run(','.toPromise().run(');
            }

            let keyEvaluated = await scope.$eval(dataSource.data[i].key);
            dataSource.data[i].key = keyEvaluated !== undefined && keyEvaluated !== null ? keyEvaluated : dataSource.data[i].key;
          }
          catch (e) {
            dataSource.data[i].key = dataSource.data[i].key;
          }
        }
      }

      config = this.parseOptionsCronToConfigKendo(options, dataSource, scope);

      return config;
    }

    return {};
  },
  getConfigDate: function(translate, options) {
    var config = {};

    if (config) {
      var formatCulture = function(culture) {
        culture = culture.replace(/_/gm,'-');
        var parts = culture.split('-');
        parts[parts.length - 1] = parts[parts.length - 1].toUpperCase();
        return parts.join('-');
      }

      var formatKendoMask = function(mask) {
        if (mask) {
          mask = mask.replace(/:MM/gm,':mm');
          mask = mask.replace(/:M/gm,':m');
          mask = mask.replace(/S/gm,'s');
          mask = mask.replace(/D/gm,'d');
          mask = mask.replace(/Y/gm,'y');
        }

        return mask;
      }

      var formatMomentMask = function(type, mask) {
        if (mask == null) {
          mask = parseMaskType(type, translate)
        }

        return mask;
      }

      var animation = {};
      if (options.animation) {
        try {
          animation = JSON.parse(options.animation);
        } catch(err) {
          console.log('DateAnimation invalid configuration! ' + err);
        }
      }

      var momentFormat = formatMomentMask(options.type, options.format);
      var format = formatKendoMask(momentFormat);

      var timeFormat = formatKendoMask(options.timeFormat);
      var culture = formatCulture(translate.use());

      config = {
        value: null,
        format: format,
        timeFormat: timeFormat,
        momentFormat: momentFormat,
        culture: culture,
        type: (options.type == null ? undefined : options.type),
        weekNumber: (options.weekNumber  == null ? undefined : options.weekNumber),
        dateInput: (options.dateInput == null ? undefined : options.dateInput),
        animation: animation,
        footer: (options.footer == null ? undefined : options.footer),
        start: (options.start == null ? undefined : options.start),
        depth: (options.start == null ? undefined : options.start)
      }
    }

    return config;
  },
  buildKendoMomentPicker : function($element, options, scope, ngModelCtrl) {
    var useUTC = options.type == 'date' || options.type == 'datetime' || options.type == 'time';

    if (!window.fixedTimeZone) {
      useUTC = false;
    }

    $element.data('mask', options.momentFormat);
    $element.data('useUTC', useUTC);

    var onChange = function() {
      var value = $element.val();
      if (!value || value.trim() == '') {
        if (ngModelCtrl)
          ngModelCtrl.$setViewValue('');
      } else {
        var valueDate = formatWithMomentAs(options.momentFormat, useUTC, value, "date");
        if (ngModelCtrl) {
          ngModelCtrl.$setViewValue(valueDate);
          $element.data('changed', true);
        }
      }
    }

    if (scope) {
      options['change'] = function() {
        scope.$apply(function () {
          onChange();
        });
      };
    } else {
      options['change'] = onChange;
    }

    if (options.type == 'date') {
      return $element.kendoDatePicker(options).data('kendoDatePicker');
    } else if (options.type == 'datetime' || options.type == 'datetime-local') {
      return $element.kendoDateTimePicker(options).data('kendoDateTimePicker');
    } else if (options.type == 'time' || options.type == 'time-local') {
      return $element.kendoTimePicker(options).data('kendoTimePicker');
    }
  },
  getConfigSlider: function(options) {
    options = options || {};
    var config = {
      increaseButtonTitle: options.increaseButtonTitle,
      decreaseButtonTitle: options.decreaseButtonTitle,
      dragHandleTitle: options.dragHandleTitle
    }

    try {
      config['min'] = options.min ? parseInt(options.min) : 1;
      config['max'] = options.max ? parseInt(options.max) : 1;
      config['smallStep'] = options.smallStep ? parseInt(options.smallStep) : 1;
      config['largeStep'] = options.largeStep ? parseInt(options.largeStep) : 1;
    } catch(err) {
      console.log('Slider invalid configuration! ' + err);
    }

    return config;
  },
  getConfigSwitch: function(options) {
    options = options || {};
    var config = {
      onLabel: (options.onLabel == null ? undefined : options.onLabel),
      offLabel: (options.offLabel == null ? undefined : options.offLabel)
    }

    return config;
  },
  getConfigBarcode: function(options) {
    var config = {
      type: (options.type == null ? undefined : options.type),
      width: (options.width == null ? undefined : parseInt(options.width)),
      height: (options.height == null ? undefined : parseInt(options.height))
    }

    if (!config.type) {
      config.type = 'EAN8';
    }

    return config;
  },
  getConfigQrcode: function(options) {
    var config = {
      errorCorrection: (options.errorCorrection == null ? undefined : options.errorCorrection),
      size: (options.size == null ? undefined : parseInt(options.size)),
      color: (options.color == null ? undefined : options.color)
    }

    if (options.borderColor || options.borderSize) {
      config['border'] = {
        size: (options.size == null ? undefined : parseInt(options.size)),
        color: (options.color == null ? undefined : options.color)
      }
    }

    return config;
  }
};

window.showTreatedValue = function(value) {
  if (value || value === false){
    return value;
  }
  return '';
};

window.useMask = function(value, format, type) {
  var mask = '';
  format = format == 'null' || format == 'undefined' ? undefined : format;

  var resolvedValue = value;
  var resolvedType = format || type;

  if (value != null && value != undefined) {
    if (value instanceof Date) {

      var momentDate = moment(value).utcOffset(window.timeZoneOffset);

      resolvedValue = '"'+momentDate.format()+'"';
    }
    else if (typeof value == 'number') {
      resolvedValue = value;
    }
    else {
      resolvedValue = '"'+value+'"';
    }
    mask = '{{ ' + resolvedValue + '  | mask:"' + resolvedType + '":"'+type+'"}}';
  }

  return mask;
};

window.formatWithMomentAs = function (mask, useUTC, value, as) {

  if (!value) return;

  let momentDate = null;

  if (value instanceof Date || value.startsWith('/Date')) {
    if (useUTC) {
      momentDate = moment(value).utcOffset(window.timeZoneOffset);
    } else {
      momentDate = moment(value);
    }
  }
  else  {
    if (useUTC) {
      momentDate = moment(value, mask).utcOffset(window.timeZoneOffset, true);
    } else {
      momentDate = moment(value, mask);
    }
  }
  if (as === 'string') {
    return momentDate.format(mask);
  }
  return momentDate.toDate();
};