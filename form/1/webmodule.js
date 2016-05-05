['$scope', 'TONE', '$http', '$state', '$timeout', '$window', '$location',
  function($scope, TONE, $http, $state, $timeout, $window, $location) {
    
    var isDraft = $location.search().draft || false;
    var moduleId = $scope.$tone.moduleid,
        storedsubmissions,
        sectionId = 0,
        sectionObj = [],
        historyState = [],
        mediaArray = [],
        languagessupported = [
          'us',
          'id',
          'bd'
        ];

    var i18n = {
      "us": {
        "later": "later",
        "save": "save",
        "submit": "Submit",
        "submitting": "Submitting form, please wait",
        "cancel": "Cancel",
        "select_date_time": "Select Date",
        "error": "error",
        "input_location": "Select Location",
        "error_media_still_uploading": "Please wait while your media is still uploading",
        "error_failed_upload_image": "Your Image failed to upload",
        "error_failed_upload_video": "Your Video failed to upload",
        "error_required_fields": "One or more fields are required",
        "error_in_fields": "One or more fields have errors",
        "offline_submit": "You have a previous submission's, would you like to submit this now?",
        "offline_title": "You are currently offline.",
        "offline_message": "Would you like to save this for submiting later?",
        "select_image": "Select Image",
        "select_video": "Select Video",
        "on": "ON",
        "off": "OFF"
      },
      "id": {
        "later": "Nanti",
        "save": "simpan",
        "submit": "Kirim",
        "submitting": "mengirimkan",
        "cancel": "batal",
        "select_date_time": "Pilih Tanggal",
        "error": "Eror",
        "input_location": "Pilih Lokasi",
        "error_media_still_uploading": "Mohon menunggu saat media Anda masih diunggah",
        "error_failed_upload_image": "Gambar Anda gagal di-upload",
        "error_failed_upload_video": "Video Anda gagal di-upload",
        "error_required_fields": "Masih diperlukan satu atau lebih bidang",
        "error_in_fields": "Eror pada suatu atau lebih bidang",
        "offline_submit": "Anda memiliki kiriman sebelumnya, Anda ingin mengirimkan ini sekarang?",
        "offline_title": "Anda sedang offline",
        "offline_message": "Apakah Anda ingin menyimpan ini untuk mengirimkan nanti?",
        "select_image": "Select Image",
        "select_video": "Select Video",
        "on": "ON",
        "off": "OFF"
      },
      "bd": {
        "later": "পরে",
        "save": "সংরক্ষণ করুন",
        "submit": "সরবরাহ করুন",
        "submitting": "সাবমিট হচ্ছে",
        "cancel": "বাতিল করুন",
        "select_date_time": "তারিখ নির্বাচন",
        "error": "ভুল",
        "input_location": "ন্থান  নির্বাচন করুন",
        "error_media_still_uploading": "আপনার মিডিয়া আপলোডের সময় অপেক্ষা করুন",
        "error_failed_upload_image": "আপনার ছবি সফল ভাবে যুক্ত হয়নি",
        "error_failed_upload_video": "আপনার ভিডিও সফল ভাবে যুক্ত হয়নি",
        "error_required_fields": "এক বা একাধিক ফিল্ড দরকার",
        "error_in_fields": "এক বা একাধিক  ফিল্ডে ত্রুটি",
        "offline_submit": "আপনার আগে একটি সাবমিসন রয়েছে , এটা কি সাবমিট করতে চান ?",
        "offline_title": "আপনি অফ্ললাইন",
        "offline_message": "আপনি কি পরে সাবমিটের জন্য  সেভ করতে চান ?",
        "select_image": "Select Image",
        "select_video": "Select Video",
        "on": "ON",
        "off": "OFF"
      }
    };

    $scope.issubmitting = false;
    $scope.formpage = 'formview';
    $scope.showerrors = false;
    $scope.errors = [];
    $scope.section = {
      title: '',
      description: '',
      next: false,
      prev: false
    }
    $scope.formsections = [];
    $scope.formfields = [];

    $window.onpopstate = function(){
      $timeout(function() {
        getPageSection();
      });
    };

    $scope.startform = function(){
      $scope.formpage = 'formview';
      sectionId = 0;
      getPageSection();
    };

    $scope.submitStored = function(){
      postInputForm(storedsubmissions, function(err){
        $scope.formpage = 'formview';
      });
    };

    $scope.storeSubmission = function(){
      settolocalstore("offlineformsubmission", JSON.stringify(storedsubmissions));
      $scope.formpage = 'successview';
    };

    $scope.submitForm = function(form){
      if(validateSection()){
        var returnvalues = [];
        var offlinesubmissions = [];

        $scope.formsections.forEach(function(section){
          section.forEach(function(e){
            returnvalues.push(normalizeValue(e))
          });
        });

        // Store to local in case we have gone offline
        var inputform = {
          revisionid: $scope.inputform.revisions[0]._id, 
          fields: returnvalues, 
          anon: $scope.inputform.isanonymous
        };

        // Appened to stored submissions if we have any.
        if (storedsubmissions) {
          try {
            offlinesubmissions = JSON.parse(storedsubmissions);
            if (typeof offlinesubmissions != "object") {
              removefromlocalstore("offlineformsubmission");
            }
          } catch (e) {
            console.log("failed to parse from offline submissions: ", storedsubmissions, e);
            removefromlocalstore("offlineformsubmission");
          }
        }
        
        // IF we have queueJob in the APK
        if(TONE.queueJob){
          TONE.queueJob('FORM', '/api/v1/inputforms/' + moduleId + '/submit', JSON.stringify(inputform), JSON.stringify(mediaArray));
        } else {
          offlinesubmissions.push(inputform);

          if(TONE.isOnline()){
            postInputForm(offlinesubmissions, function(err){
              if(!err){
                $scope.formpage = 'successview';
              }
            });
          } else {
            storedsubmissions = offlinesubmissions;
            $scope.formpage = 'offlineview';
          }
        }
      }
    };

    $scope.nextSection = function(){
      if(validateSection()){
        historyState.push(sectionId);
        sectionId ++;
        getPageSection();
      }
    };

    $scope.prevSection = function(){
      if(historyState.length > 0){
        sectionId = historyState.pop();
      }
      getPageSection();
    };

    $scope.gotoPage = function(page){
      if(page.value != null){
        var i = sectionObj.filter(function(e){ return e.name === page.value.value});
        if(i && validateSection()){
          historyState.push(sectionId);
          sectionId = i[0].id;
          getPageSection();
        }
      }
    };

    $scope.getDefualtSelected = function(array, selectbox){
      if( array.filter(function(e){ return e.selected; }).length > 0 ){ 
        return (selectbox) ? array[array.findIndex(function(e){ return e.selected })] : array[array.findIndex(function(e){ return e.selected })].value
      } else {
        return (selectbox) ? array[0] : array[0].value;
      }
    };

    $scope.hasImages = function(array){
      return (array.filter(function(e){ return e.url; }).length > 0) ? 'images' : 'default';
    };

    $scope.itemSelected = function(group, item){
      $(group).removeClass('selected');
      $(item).addClass('selected');
    }

    $scope.addMedia = function(field) {
      if(TONE.getMediaURI && !field.value){
        var type = field.config.mediatype.value.toUpperCase();
        TONE.getMediaURI(type, function(mediaObj){
          if(mediaObj.fileLocation !== 'null') {
            var key = Math.random().toString(36).substr(2);
            field.value = key;
            $timeout(function() {
              
              mediaArray.push({
                id: key,
                fileLocation: mediaObj.fileLocation,
                thumbnailLocation: mediaObj.thumbnailLocation,
                mediaOptions: {
                  mediaType: type,
                  size: mediaObj.size
                }
              });
              if(type === "VIDEO"){
                field.thumbnail = mediaObj.thumbnailLocation;
                var player = document.getElementById("v_"+key);
                    player.src = mediaObj.fileLocation;
              } else if(type === "IMAGE"){
                field.thumbnail = mediaObj.fileLocation;
              }
            });
          }
        });
      } else if(!field.value ) {
        if(field.config.mediatype.value === 'Image'){
          TONE.getUploadedImageURL({}, function(err, url){
            var lastIndex = url.lastIndexOf('\.');
            if (err) {
              showErrors($scope.i18n.error_failed_upload_image);
            } else if(lastIndex != -1){
              $timeout(function() {
                field.value = url;
                showErrors(false);
              });
            }
          })
        } else if(field.config.mediatype.value === 'Video'){
          TONE.getUploadedVideoURL({}, function(err, url){
            var lastIndex = url.lastIndexOf('\.');
            if (err) {
              showErrors($scope.i18n.error_failed_upload_video);
            } else if(lastIndex != -1){
              $timeout(function() {
                field.value = url;
                showErrors(false);
              });
            }
          })
        }
      }
    };

    $scope.displayDate = function(field) {
      if(field.value == null || field.value == ''){
        return $scope.i18n.select_date_time;
      }else{
        return field.value.toISOString().substring(0, 10);
      }
    };

    $scope.displayTime = function(time) {
      return time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
    };

    $scope.setTime = function(field) {
      TONE.timePicker(field[time], function(newtime) {
        field[time] = newtime;
      });
    };

    $scope.setDate = function(field) {
      var date = new Date();
      TONE.datePicker(date, function(newdate) {
        field.value = newdate;
      });
    };

    $scope.getLocation = function(field) {
      if(field.value == null){
        field.value = {latitude: 0, longitude: 0};
      }
      TONE.setGeolocation(field.value.latitude, field.value.longitude, function(err, location) {
        if (err) {
          console.log(err);
        } else {
          field.value = {latitude: location.lat, longitude: location.lng};
          $timeout(function() {
            $scope.inputLocation = location.lat + " : " + location.lng;
          });
        }
      });
    };

    $scope.checkNumber = function(field, error){
      if(error.max){
        field.value = parseInt(field.config.max.value);
      } else if(error.min){
        field.value = parseInt(field.config.min.value);
      }
    };

    $scope.addTouch = function(elem, type) {
      $(elem).find(type).bind('vmousedown vmouseup vmouseout mouseleave', function(event) {
        if(event.type == 'vmousedown'){
          $(this).addClass('active');
        } else {
          $(this).removeClass('active');
        }
      });
    };

    $scope.showFields = function(last){
      if(last) { 
        $('.formview').show();
      }
    };

/*
 * Validation 
 */

    var validateSection = function(){
      $scope.showerrors = false;
      $scope.errors = [];
      $scope.formfields.forEach(function(e, i){
        e.errors = false;
        if((typeof e.value === 'undefined' || e.value == null) && (typeof e.config.required != 'undefined' && e.config.required.value === true)){
          e.errors = true;
          showErrors($scope.i18n.error_required_fields);
        } else {
          if(!e.thumbnail){
            var filterValues = filterFieldInput(e.value, e);
            var validateValue;
            e.value = (typeof filterValues === 'undefined')? null : filterValues
            validateValue = normalizeValue(e);
            if(!validateFieldInput(validateValue, e)){
              e.errors = true;
              showErrors(e.config.error.value);
            }
          }
        }
      });

      return !$scope.showerrors;
    };

    var normalizeValue = function(field){
      var value = null
      if(field.type === 'SELECT' && typeof field.other === 'undefined'){
        value = field.value.value;
      } else if(field.type === 'CHECKBOXES' && typeof field.other === 'undefined'){
        var c = [];
        field.config.choices.value.filter(function(a){ return a.selectedvalue }).forEach(function(a){ c.push(a.value) })
        value = c;
      } else if(typeof field.other != 'undefined'){
        value = field.other;
      } else {
        value = field.value;
      }
      return value;
    };

    var parseFunction = function(val) {
      var target = null;

      var regex_head = /^function\s*\(([a-zA-Z0-9$_,\s]*)\)\s*\{/;
      var regex_tail = /\s*\}$/;
      var regex_variable = /^[a-zA-Z$_]{1}[a-zA-Z0-9$_]*$/;
      
      var args = [];
      var fn_def = val.trim().replace(regex_head, function(m1, m2) {
        args = m2 ? m2.split(',')
        .map(function(e) { return e.trim(); })
        .filter(function(e) { return regex_variable.test(e); }) : [];
        return '';
      }).replace(regex_tail, '').trim();
      args.push(fn_def);
      try {
        target = Function.apply(null, args);
      } catch (ex) {
        console.error('failed to convert string to function -' + ex);
      }
      return target;
    };

    var validateFieldInput = function(input, model) {
      var target = false;
      if (!model.validateInput) {
        console.error('invalid model = ', model);
        return true;
      } else {
        target = model.validateInput(input);
      }
      return target;
    };

    var filterFieldInput = function(input, model) {
      var target = null;
      if (!model.filterInput) {
        console.error('invalid model = ', model);
      } else {
        target = model.filterInput(input);
      }
      return target;
    };

    var showErrors = function(string){
      if(string){
        $scope.showerrors = true;
        $scope.errors.push(string);
        $('body').scrollTop(0)
      } else {
        $scope.showerrors = false;
        $scope.errors = [];
      }
    };

    var initform = function(store, formfeed){
      $('html').height($(window).height() - 50);
      $scope.inputform = formfeed;
      $scope.inputform.isanonymous = false;

      var sectionIndex = 0,
          sectionCount = 0,
          fields = JSON.parse(JSON.stringify(formfeed.revisions[0].fields));

      fields.forEach(function(e, i){
        e.errors = false;
        e.value = null;

        if (e.filterInput) {
          e.filterInput = parseFunction(e.filterInput);
        }

        if (e.validateInput) {
          e.validateInput = parseFunction(e.validateInput);
        }

        if(e.type === "BREAK"){
          sectionCount++;
          $scope.formsections.push( fields.slice(sectionIndex, i+1) ); 
          sectionObj.push({name: e.config.title.value, id: sectionCount});
          sectionIndex = i+1;
        }
      });

      if(sectionIndex > 0){
        $scope.formsections.push( fields.slice(sectionIndex) ); 
      } else {
        $scope.formsections.push( fields );
      }

      getPageSection();

      if(store) {
        settolocalstore("webform", JSON.stringify(formfeed));
      }

      // Check for offline submissions and begin posting if online
      if (TONE.isOnline()) {
        getfromlocalstoreasync("offlineformsubmission", function(err, offlinesubmissions){
          if(offlinesubmissions){
            $scope.formpage = 'introview';
            storedsubmissions = JSON.parse(offlinesubmissions);
          } else {
            $scope.formpage = 'formview';
          }
        });
      }
    };

    var getPageSection = function(){
      var header = $scope.formsections[sectionId].filter(function(e){ if(e.type == "HEADER") return e });
      var nextbutton = $scope.formsections[sectionId].filter(function(e){ if(e.type == "BREAK") return e });
      $scope.formfields = $scope.formsections[sectionId];
      $scope.section.prev = (sectionId > 0) ? 'Previous' : false;
      $scope.section.next = (nextbutton.length > 0) ? 'Next' : false;

      if(header.length > 0){
        $scope.section.title = header[0].config.title.value;
        $scope.section.description = header[0].config.description.value;
      } else {
        $scope.section.title = $scope.inputform.title;
        $scope.section.description = $scope.inputform.description;
      }
    };

    var postInputForm = function(submissions, next) {  
      if(TONE.isOnline()){
        $scope.issubmitting = true;
        // Need to add in media upload.
        TONE.httpRequest({
          method: 'POST',
          url: '/api/v1/inputforms/' + moduleId + '/submit',
          data: submissions,
        }, function(err, data, status) {
          if (err) {
            console.log('failed to post input form - ' + err);
          } else {
            removefromlocalstore("offlineformsubmission");
          }
          $scope.issubmitting = false;
          next(err);
        });

      } else if(submissions.length > 0 && !TONE.isOnline()){
        settolocalstore("offlineformsubmission", JSON.stringify(submissions));
      }
    };

    var getInputForm = function(next) {
      TONE.httpRequest({
        url: (!isDraft) ? '/api/v1/inputforms/' + moduleId + '/live' : '/api/v1/inputforms/' + moduleId,
      }, function(err, data, status) {
        if (err) {
          console.log('failed to get input form - ' + err);
          next('failed to get input form');
        } else {
          next(null, data);
        }
      });
    };

    var getfromlocalstoreasync = function(key, next) {
      TONE.getFromLocalStoreAsync(moduleId, key, next);
    };

    var settolocalstore = function(key, value) {
      TONE.setToLocalStore(moduleId, key, value);
    };

    var removefromlocalstore = function(key) {
      TONE.removeFromLocalStore(moduleId, key);
    };

    TONE.getSettings(function(settings) {
      lang = JSON.parse(JSON.stringify(settings.culture));
      lang = lang.split('-').pop().toLowerCase();

      if(languagessupported.indexOf(lang) == -1){
        $scope.i18n = i18n['us'];
      }else{
        $scope.i18n = i18n[lang];
      }

      $scope.inputLocation = $scope.i18n.input_location;
    });

    TONE.current(function(err, tone) {
      if (err) {
        console.log("can't get current tone: ", err);
      } else {

        getfromlocalstoreasync("webform", function(err, webformobject){
          if (err) {
            console.log('failed to call getfromlocalstoreasync - ' + err);
          } else {
            var formfeed;
            if (webformobject) {
              try {
                formfeed = JSON.parse(webformobject);
                if (typeof formfeed != "object") {
                  removefromlocalstore("webform")
                  formfeed = null;
                }
              } catch (e) {
                console.log("failed to parse webform from local storage: ", webformobject, e);
                removefromlocalstore("webform");
              }
            }

            if (formfeed) {
              if (TONE.isOnline()) {
                getInputForm(function(err, inputform) {
                  if (err) {
                    console.log('failed to call getInputForm - ' + err);
                    initform(false, formfeed);
                  } else {
                    initform(true, inputform);
                  }
                });
              } else {
                initform(false, formfeed);
              }
            } else {
              getInputForm(function(err, inputform) {
                if (err) {
                  console.log('failed to call getInputForm - ' + err);
                } else {
                  initform(true, inputform);
                }
              });
            }
          }
        });
      }
    });
  }
]
