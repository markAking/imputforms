['$scope', '$rootScope', 'TONE', '$fileUploader', '$window', 'Restangular', '$http', '$timeout', '$state', '$cookies', '$modal',
    function($scope, $rootScope, TONE, $fileUploader, $window, Restangular, $http, $timeout, $state, $cookies, $modal) {
      //bind new actions and models used to manage title, and name (url)
      $scope.bind($scope);
      $scope.canPublish = false;
      $scope.canView = false;
      $scope.state = {
        unpublishedChanges: '',
      };
      $scope.sortableOptions = { 
        update: function(){ 
          pushDraftUpdate(function(err, success, validationErrors) {
            if (err) {
              console.log('failed to push draft update - ' + err);
            } else if (!success) {
              console.log('error', validationErrors);
              setDraftRevision();
            }
          });
        }
      };

      /* CONTROLLER SCOPE VARIABLES */
      var moduleId = $scope.$tone.moduleid;
      var moduleSelector = '#' + moduleId.replace('.', '-') + "-edit";

      $scope.btnAddField_clickHandler = function() {
        openEditFieldModal(null);
      };

      $scope.btnLogData_clickHandler = function() {
        openLogDataModal(null);
      };

      $scope.btnSettings_clickHandler = function() {
        openSettingsModal($scope.inputform);
      };

      $scope.btnPublish_clickHandler = function() {
        if($scope.canPublish){
          if (confirm($scope.i18n.module_form_field_are_you_sure_publish)) {
            publishDraft(function(err){
              if (err) {
                console.log('failed to call publishDraft');
                alert('Publish Failed');
              } else {
                init();
              }
            });
          }
        }
      };

      $scope.revert = function() {
        // No requirements 
      };

      $scope.btnPreview_clickHandler = function() {
        if($scope.canView){
          openDraftPreviewModal();
        }
      };

      $scope.btnFieldRemove_clickHandler = function(field) {
        if (confirm($scope.i18n.module_form_field_are_you_sure)) {
          var index = -1;
          $scope.draftRevision.fields.forEach(function(e, i) {
            if (e == field) {
              index = i;
            }
          });
          if (index > -1) {
            $scope.draftRevision.fields.splice(index,1);
            pushDraftUpdate(function(err, success, validationErrors) {
              if (err) {
                console.log('failed to push draft update - ' + err);
              } else if (!success) {
                console.log('error', validationErrors);
                //revert draft
                setDraftRevision();
              }
            });
          }
        }
      };

      $scope.btnFieldEdit_clickHandler = function(field) {
        openEditFieldModal(field);
      };

      //-------- MODALS -----------------------------------
      var openLogDataModal = function() {
        logdataModal = $modal.open({
          template: @FILE["modals/logdata.jade"],
          windowClass: "medium",
          controller: function($scope, $modalInstance) {
            var skip = 0;
            var limit = 10;
            $scope.state.hasmore = false;
            $scope.logs = [];
            //moduleid | createdat           | url                                                                               | countI
            $scope.close = function() {
              $modalInstance.close();
            };
            $scope.downloadlog = function(e, url) {
              tn_s3singlefiledownload($scope.$tone.toneid, url, Restangular, $http, function(err, url) {
                if (err) {
                  console.error('failed to download load - ' + err);
                } else {
                  window.open(url, '_self');
                }
              });
            };
            $scope.viewmore = function () {
              TONE.httpRequest({
                method: 'GET',
                url: '/api/v1/inputforms/' + moduleId + '/logsummaries?skip=' + skip + '&limit=' + limit
              }, function(err, data, status) {
                if (err) {
                  console.error('failed to retrieve logs - ' + err);
                  alert('failed to retrieve logs');
                } else {
                  data.forEach(function(datum) {
                    $scope.logs.push(datum);
                  });
                  if (data.length > 0) {
                    skip += limit;
                    $scope.state.hasmore = true;
                  } else {
                    $scope.state.hasmore = false;
                  }
                }
              });
            };
            $scope.viewmore();
          },
          scope: $scope
        });
      }
      var openSettingsModal = function(inputform, isnew) {
        var settingsModal = $modal.open({
          template: @FILE["modals/settings.jade"],
          windowClass: "medium",
          controller: function($scope, $modalInstance) {
            $scope.isnew = isnew;
            $scope.state = inputform;
            //handle toggle switch events
            $scope.toggleMulti_clickHandler = function() {};
            $scope.togglePublished_clickHandler = function() {};
            $scope.btnCancel_clickHandler = function() { $modalInstance.dismiss('cancel'); }
            $scope.btnSave_clickHandler = function() {
              $modalInstance.close($scope.state);
            };
            $scope.btnEditBgImg_clickHandler = function() { $('#formBackgroundImage').click(); };

            $scope.fileChanged = function(element) {
              if (element.files.length > 1) {
                alert($scope.i18n.error_multiplepics);
              } else if (element.files.length == 1) {
                var file = element.files[0];
                var width = DEFAULTS.images.webmoduleBackground.width;
                var height = DEFAULTS.images.webmoduleBackground.height;

                $rootScope.showCropDialog(width, height, file, function(err, croppedimage) {
                  if (err) {
                    alert(err);
                  } else {
                    tn_s3singlefileupload($scope.$tone.toneid, croppedimage, '', Restangular, $http, function(err, url) {
                      if (err) {
                        alert(err);
                      } else {
                        $scope.state.backgroundImageUrl = url;
                      }
                    });
                  }
                });
              }
            };
          },
          scope: $scope
        });

        settingsModal.result.then(function(data) {
          if (!data) {
            console.error("data not defined, cannot save");
          } else {
            if (isnew) {
              createInputForm(inputform, function(err) {
                if (err) {
                  console.log('failed to create input form - ' + err);
                }
              });
            } else {
              updateInputForm(inputform, function(err) {
                if (err) {
                  console.log('failed to update input form - ' + err);
                }
              });
            }
          }
        }, function(err) {
          console.log(err);
        });
      }; // end of openSettingsModal

      var openEditFieldModal = function(field) {
        var fieldModal = $modal.open({
          template: @FILE["modals/editfield.jade"],
          windowClass: "medium",
          controller: function($scope, $modalInstance) {
            $scope.isnew = field == undefined;
            var pageBreaks = $scope.draftRevision.fields
                              .filter(function(e) { return e.type === 'BREAK'; })
                              .map(function(e) { return e.config.title.value; });

            $scope.fields = Object.keys($scope.defs)
                              .map(function(k) { return JSON.parse(JSON.stringify($scope.defs[k])); });
            $scope.state = {
              errors: [],
              field: field,
              params: [],
              pageBreaks: pageBreaks,
            };
            if (!$scope.isnew) {
              if ($scope.state.field.type === 'BREAK') { $scope.state.field.config.jumpToPage.options = pageBreaks; }
              $scope.state.params = Object.keys($scope.state.field.config).map(function(k) {
                var e = JSON.parse(JSON.stringify($scope.state.field.config[k]));
                e.type = k;
                return e;
              });
            }
            $scope.checkForMax = function(e){
              if(parseInt(e.value) > 25000000){
                e.value = 25000000;
              }else if(parseInt(e.value) <= 0 ){
                e.value = 1;
              }
            };
            $scope.selectPagenav_changeHandler = function(e) {
              $scope.state.params.forEach(function(e) { 
                if (e.input === 'pagenav') {
                  e.value.push({value: $scope.state.pagenav});
                }
              });
            };
            //handle toggle switch events
            $scope.ddType_changeHandler = function() {
              $scope.state.errors = [];
              if ($scope.state.field.type === 'BREAK') { $scope.state.field.config.jumpToPage.options = pageBreaks; }
              $scope.state.params = Object.keys($scope.state.field.config).map(function(k) {
                var e = JSON.parse(JSON.stringify($scope.state.field.config[k]));
                e.type = k;
                return e;
              });
            };
            var updateDraftRevision = function() {
              var field = $scope.state.field;
              var p = $scope.state.params;
              var f = $scope.state.field;
              p.forEach(function(e){
                f.config[e.type].value = e.value;
              });
              if ($scope.isnew) {
                $scope.draftRevision.fields.push(field);
              }
            };
            $scope.btnCancel_clickHandler = function() {
              $modalInstance.dismiss('cancel');
            }
            $scope.btnSave_clickHandler = function() {
              $scope.state.errors = [];
              if (!$scope.state.field) {
                $scope.state.errors = [$scope.i18n.module_form_field_submit_no_seletion];
              } else {
                updateDraftRevision();
                pushDraftUpdate(function(err, success, validationErrors) {
                  if (err) {
                    console.log('failed to push draft update - ' + err);
                  } else if (!success) {
                    //parse errors for display
                    $scope.state.errors = validationErrors.map(function(e) {
                      var f = $scope.draftRevision.fields[e.index];
                      var title = f.config.title.value || f.type;
                      return title + ': ' + e.message; 
                    });
                    //revert draft
                    setDraftRevision();
                  } else {
                    $modalInstance.close();
                  }
                });
              }
            };
          },
          scope: $scope
        });
      }; // end of openEditFieldModal

      var openDraftPreviewModal = function(field) {
        var fieldModal = $modal.open({
          template: @FILE["modals/draftpreview.jade"],
          windowClass: "medium",
          controller: function($scope, $modalInstance) {
            $scope.source = "/webmodule_page#/preview/webmodule/" + moduleId + "?draft=1";
            $scope.name = moduleId.split('_')[0].substring(0, 15);
            $scope.btnCancel_clickHandler = function() { $modalInstance.dismiss('cancel'); }
          },
          scope: $scope
        });
      }; // end of openDraftPreviewModal
      //--------------- /MODALS---------------------------

      var blankform = function() {
        return {
          title: $scope.$tone.title,
          description: '',
          submitSuccessTitle: '',
          submitSuccessDescription: '',
          submitErrorMessage: '',
          backgroundImageUrl: '',
          startDate: new Date().toString(),
          endDate: (function() {
            var DAYS = 365; //defaults to 1 year to the future
            var d = new Date();
            d.setDate(d.getDate() + DAYS);
            return d.toString();
          }()),
          multi: true,
          published: false,
          anon: false,
          revisions: [],
        };
      };

      var deleteRevision = function(revisionId, next) {
        TONE.httpRequest({
          method: 'PUT',
          url: '/api/v1/inputforms/' + moduleId + '/revert',
          data: {
              moduleId: moduleId,
              revisionid: revisionId
            },
        }, function(err, data, status) {
          if (err) {
            console.log('failed to delete revision - ' + err);
            next('failed to delete revision');
          } else {
            next();
          }
        });
      };
      
      var getInputForm = function(next) {
        TONE.httpRequest({
          url: '/api/v1/inputforms/' + moduleId,
        }, function(err, data, status) {
          if (err) {
            console.log('failed to get input form - ' + err);
            next('failed to get input form');
          } else {
            next(null, data);
          }
        });
      };

      var getFieldDefinitions = function(next) {
        TONE.httpRequest({
          url: '/api/v1/inputforms_fields',
        }, function(err, data, status) {
          if (err) {
            console.log('failed to get input form - ' + err);
            next('failed to get input form');
          } else {
            next(null, data);
          }
        });
      };

      var createInputForm = function(inputform, next) {
        TONE.httpRequest({
          method: 'POST',
          url: '/api/v1/inputforms/' + moduleId,
          data: inputform,
        }, function(err, data, status) {
          if (err) {
            console.log('failed to post input form - ' + err);
            next('failed to post input form');
          } else {
            init();
          }
        });
      };

      var updateInputForm = function(inputform, next) {
        TONE.httpRequest({
          method: 'PUT',
          url: '/api/v1/inputforms/' + moduleId,
          data: inputform,
        }, function(err, data, status) {
          if (err) {
            console.log('failed to update input form - ' + err);
            next('failed to update input form');
          } else {
            $scope.inputform = inputform;
            next();
          }
        });
      };

      var pushDraftUpdate = function(next) {
        $timeout(function() {
          var draft = $scope.draftRevision;
          var data = {
            revisionNote: draft.revisionNote,
            fields: draft.fields.map(function(e) {
              return {
                type: e.type,
                config: (function(){
                  var target = {};
                  Object.keys(e.config).map(function(k) {
                    target[k] = e.config[k].value;
                  });
                  return target;
                }()),
              };
            }),
          };
          TONE.httpRequest({
            method: 'PUT',
            url: '/api/v1/inputforms/' + moduleId + '/draft',
            data: data,
          }, function(err, data, status) {
            if (err) {
              console.log('failed to update draft revision - ' + err);
              next('failed to update draft revision');
            } else {
              setUnpublishedWarning(true);
              next(null, data.success, data.errors);
            }
          });
        });
      };

      var publishDraft = function(next) {
        TONE.httpRequest({
          method: 'POST',
          url: '/api/v1/inputforms/' + moduleId + '/publish',
        }, function(err, data, status) {
          if (err) {
            console.log('failed to post input form - ' + err);
            next('failed to post input form');
          } else {
            $scope.inputform.published = true;
            updateInputForm($scope.inputform, function(){next()});
          }
        });
      };

      var setDraftRevision = function() {
        if ($scope.inputform.revisions.length > 0) {
          $scope.draftRevision = JSON.parse(JSON.stringify($scope.inputform.revisions[0]));
        } else {
          console.log('error: no revision found', $scope.inputform);
        }
      };

      var setUnpublishedWarning = function(force) {
        if($scope.draftRevision.fields.length > 0){
          $scope.canPublish = true;
          $scope.state.unpublishedChanges = force || $scope.draftRevision.dateUpdated !== $scope.draftRevision.dateCreated
                                          ? $scope.i18n.module_form_warn_unpublished_changes : '';
        }
      };

      var init = function() {
        //init steps:
        //- get form
        //- if not exists, create input form
        //- re-fetch form, and open settings modal dialog
        //- if exists, load form and latest revision
        getInputForm(function(err, inputform) {
          if (err) {
            console.log('failed to call getInputForm - ' + err);
          } else if (inputform === 'null') {
            openSettingsModal(blankform(), true);
          } else {
            //form exists
            $scope.inputform = inputform;
            if($scope.inputform.published){
              $scope.canView = true;
            }
            setDraftRevision();
            setUnpublishedWarning();
            getFieldDefinitions(function(err, defs) {
              if (err) {
                console.log('failed to call getFieldDefinitions - ' + err);
              } else {
                $scope.defs = defs;
              }
            });
          }
        });
      };

      init();
    }
]
