var settings = require('../../settings.js');
var api = require('../_api.js');
var request = require('supertest');
var assert = require('assert');
var _ = require('lodash-node');
var config = require(__base + 'config/config.js');
var stools = require(__base + 'config/stools.js');
var data = require(__base + 'config/data.js');

var authtoken_;
var csrf_;
var instanceid_;
var moduleid_;

describe('inputforms', function() {

  var test_params = [];
  test_params['test_1'] = [];
  test_params['test_1']['tonename'] = 'inputformtester';

  before(function(next) {
    api.createtone(test_params['test_1']['tonename'],
      function(err, instance, authtoken, csrf) {
        if (err) {
          next(err);
        } else {
          instanceid_ = instance._id;
          authtoken_ = authtoken;
          csrf_ = csrf;
          next();
        }
      }
    );
  });

  var doPut = function(url, data, next) {
    request(settings.url)
      .put(url)
      .set('Cookie', api.getcookies(authtoken_))
      .set('Content-Type', 'application/json')
      .set('X-CSRF-TOKEN', csrf_)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          ERROR('failed to call request for url =' + url + ', error =' + err);
          next('failed to call request for url =' + url);
        } else {
          var result = res.body;
          next(null, result, res);
        }
      });
  };

  var doDelete = function(url, data, next) {
    request(settings.url)
      .delete(url)
      .set('Cookie', api.getcookies(authtoken_))
      .set('Content-Type', 'application/json')
      .set('X-CSRF-TOKEN', csrf_)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          ERROR('failed to call request for url =' + url + ', error =' + err);
          next('failed to call request for url =' + url);
        } else {
          var result = res.body;
          next(null, result, res);
        }
      });
  };

  var doGet = function(url, next) {
    request(settings.url)
      .get(url)
      .set('Cookie', api.getcookies(authtoken_))
      .set('Content-Type', 'application/json')
      .set('X-CSRF-TOKEN', csrf_)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          ERROR('failed to call request for url =' + url + ', error =' + err);
          next('failed to call request for url =' + url);
        } else {
          var result = res.body;
          next(null, result, res);
        }
      });
  };

  var doPost = function(url, data, next) {
    request(settings.url)
      .post(url)
      .set('Cookie', api.getcookies(authtoken_))
      .set('Content-Type', 'application/json')
      .set('X-CSRF-TOKEN', csrf_)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          ERROR('failed to call request for url =' + url + ', error =' + err);
          next('failed to call request for url =' + url);
        } else {
          var result = res.body;
          next(null, result, res);
        }
      });
  };

  it('it creates, retrieves, updates, deletes a form', function(next) {
    var moduleId = instanceid_ + '.fakemodule';
    var inputform = {
      _id: moduleId,
      title: "input form title",
      description: "input form description",
      backgroundImageUrl: "http://www.example.com/image.jpg",
      submitSuccessTitle: "Submit Success!",
      submitSuccessDescription: "Submit Success Description",
      submitErrorMessage: "Submit Error Message",
      published: true,
      multi: true,
      anon: true,
      publicationSchedule: [{
        startDate: new Date(2016, 0, 1, 0, 0, 0).toString(),
        endDate: new Date(2016, 0, 30, 0, 0, 0).toString(),
        eventNote: 'notes for this event',
      }]
    };
    //create
    doPost('/api/v1/inputforms/' + moduleId, inputform, function(err, result) {
      if (err) {
        ERROR('failed to call post inputforms endpoint - ' + err);
        next(err);
      } else {
        //fetch
        doGet('/api/v1/inputforms/' + moduleId, function(err, result) {
          if (err) {
            ERROR('failed to call post inputforms endpoint - ' + err);
            next(err);
          } else {
            assert.ok(result._id === moduleId);
            assert.ok(result.title === inputform.title);
            assert.ok(result.description === inputform.description);
            assert.ok(result.backgroundImageUrl === inputform.backgroundImageUrl);
            assert.ok(result.submitSuccessTitle === inputform.submitSuccessTitle);
            assert.ok(result.submitSuccessDescription === inputform.submitSuccessDescription);
            assert.ok(result.submitErrorMessage === inputform.submitErrorMessage);
            assert.ok(result.published === inputform.published);
            assert.ok(result.multi === inputform.multi);
            assert.ok(result.anon === inputform.anon);
            assert.ok(result.publicationSchedule[0].startDate === inputform.publicationSchedule[0].startDate.toString());
            assert.ok(result.publicationSchedule[0].endDate === inputform.publicationSchedule[0].endDate.toString());
            assert.ok(result.publicationSchedule[0].eventNote === inputform.publicationSchedule[0].eventNote);
            assert.ok(result.dateCreated !== null);
            assert.ok(result.dateUpdated !== null);
            assert.ok(result.revisions.length == 1);
            //update all update-able fields
            var updatedform = {
              _id: moduleId,
              title: "input form title update",
              description: "input form description update",
              backgroundImageUrl: "http://www.example.com/image.jpg.update",
              submitSuccessTitle: "Submit Success! update",
              submitSuccessDescription: "Submit Success Description updated",
              submitErrorMessage: "Submit Error Message updated",
              published: false,
              multi: false,
              anon: false,
              publicationSchedule: [{
                startDate: new Date(2017, 0, 1, 0, 0, 0).toString(),
                endDate: new Date(2017, 0, 30, 0, 0, 0).toString(),
                eventNote: 'notes for this event updated',
              }, {
                startDate: new Date(2018, 0, 1, 0, 0, 0).toString(),
                endDate: new Date(2018, 0, 30, 0, 0, 0).toString(),
                eventNote: 'notes for this second event',
              }]
            };

            doPut('/api/v1/inputforms/' + moduleId, updatedform, function(err, result) {
              if (err) {
                ERROR('failed to call put inputforms endpoint - ' + err);
                next(err);
              } else {
                //start
                doGet('/api/v1/inputforms/' + moduleId, function(err, result) {
                  if (err) {
                    ERROR('failed to call post inputforms endpoint - ' + err);
                    next(err);
                  } else {
                    assert.ok(result._id === moduleId);
                    assert.ok(result.title === updatedform.title);
                    assert.ok(result.description === updatedform.description);
                    assert.ok(result.backgroundImageUrl === updatedform.backgroundImageUrl);
                    assert.ok(result.submitSuccessTitle === updatedform.submitSuccessTitle);
                    assert.ok(result.submitSuccessDescription === updatedform.submitSuccessDescription);
                    assert.ok(result.submitErrorMessage === updatedform.submitErrorMessage);
                    assert.ok(result.published === updatedform.published);
                    assert.ok(result.multi === updatedform.multi);
                    assert.ok(result.anon === updatedform.anon);
                    assert.ok(result.publicationSchedule[0].startDate === updatedform.publicationSchedule[0].startDate.toString());
                    assert.ok(result.publicationSchedule[0].endDate === updatedform.publicationSchedule[0].endDate.toString());
                    assert.ok(result.publicationSchedule[0].eventNote === updatedform.publicationSchedule[0].eventNote);
                    assert.ok(result.dateCreated !== null);
                    assert.ok(result.dateUpdated !== null);
                    assert.ok(result.revisions.length == 1);

                    doDelete('/api/v1/inputforms/' + moduleId, {}, function(err, result) {
                      if (err) {
                        ERROR('failed to call post inputforms endpoint - ' + err);
                        next(err);
                      } else {
                        doGet('/api/v1/inputforms/' + moduleId, function(err, result) {
                          if (err) {
                            ERROR('failed to call post inputforms endpoint - ' + err);
                            next(err);
                          } else {
                            assert.ok(JSON.stringify(result) === '{}');
                            next();
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('creates, updates, publishes revision', function(next) {
    //new test strategy:
    // - create inputform
    // assert <-- form data is no longer returned
    // - fetch form
    // assert <- schema and revision has been created
    // - fetch field definitions
    // assert <- field definitions
    // - update revision by adding several fields
    // fetch form
    // assert <- draft revision has been updated correctly
    // fetch published form
    // assert <- there is no available revision at this time
    // publish draft revision
    // fetch form
    // assert <- new draft revision has been created
    // fetch published form
    // assert <- the previous draft is now live
    var parseFieldDefinition = function(def) {
      var target = {};
      target.type = def.type;
      target.config = {};

      Object.keys(def.config).forEach(function(k) {
        target.config[k] = def.config[k].value;
      });
      return target;
    };
    var moduleId = instanceid_ + '.fakemodule2';
    var inputform = {
      _id: moduleId,
      title: "input form title",
      description: "input form description",
      backgroundImageUrl: "http://www.example.com/image.jpg",
      submitSuccessTitle: "Submit Success!",
      submitSuccessDescription: "Submit Success Description",
      submitErrorMessage: "Submit Error Message",
      published: true,
      multi: true,
      anon: true,
      publicationSchedule: [{
        startDate: new Date(2016, 0, 1, 0, 0, 0).toString(),
        endDate: new Date(2016, 0, 30, 0, 0, 0).toString(),
        eventNote: 'notes for this event',
      }]
    };
    //create inputform
    doPost('/api/v1/inputforms/' + moduleId, inputform, function(err, result) {
      if (err) {
        ERROR('failed to call post inputforms endpoint - ' + err);
        next(err);
      } else {
        //assert <-- form data is no longer returned
        assert.ok(result === 200, 'result not equal to 200');
        doGet('/api/v1/inputforms/' + moduleId, function(err, result) {
          if (err) {
            ERROR('failed to call get inputforms endpoint - ' + err);
            next(err);
          } else {
            //assert <-- schema and revision has been created
            assert.ok(result._id === moduleId);
            assert.ok(result.title === inputform.title);
            assert.ok(result.description === inputform.description);
            assert.ok(result.backgroundImageUrl === inputform.backgroundImageUrl);
            assert.ok(result.submitSuccessTitle === inputform.submitSuccessTitle);
            assert.ok(result.submitSuccessDescription === inputform.submitSuccessDescription);
            assert.ok(result.submitErrorMessage === inputform.submitErrorMessage);
            assert.ok(result.published === inputform.published);
            assert.ok(result.multi === inputform.multi);
            assert.ok(result.anon === inputform.anon);
            assert.ok(result.publicationSchedule[0].startDate === inputform.publicationSchedule[0].startDate.toString());
            assert.ok(result.publicationSchedule[0].endDate === inputform.publicationSchedule[0].endDate.toString());
            assert.ok(result.publicationSchedule[0].eventNote === inputform.publicationSchedule[0].eventNote);
            assert.ok(result.dateCreated !== null);
            assert.ok(result.dateUpdated !== null);
            assert.ok(result.revisions.length == 1);
            assert.ok(result.revisions[0].dateCreated.length > 0);
            assert.ok(result.revisions[0].revisionNote.length === 0);
            assert.ok(result.revisions[0].fields.length === 0);

            //fetch field definitions
            doGet('/api/v1/inputforms_fields', function(err, result) {
              if (err) {
                ERROR('failed to call get inputforms fields endpoint - ' + err);
                next(err);
              } else {
                //assert <-- form field definitions
                assert.ok(result.TEXT.type === 'TEXT');
                assert.ok(result.TEXT.config != undefined);
                //crete update revision object
                var updaterevision = {
                  revisionNote: 'this is a test',
                  fields: [
                    parseFieldDefinition(result.TEXT),
                    parseFieldDefinition(result.TEXT),
                  ],
                };
                //modify some fields
                updaterevision.fields[0].config.title = 'my custom title';
                updaterevision.fields[0].config.required = true;
                updaterevision.fields[0].config.description = 'my custom description';
                updaterevision.fields[0].config.error = 'my custom error';
                updaterevision.fields[0].config.min = 10; 
                updaterevision.fields[0].config.max = 255; 
                updaterevision.fields[1].config.title = 'my custom title two';
                doPut('/api/v1/inputforms/' + moduleId + '/draft', updaterevision, function(err) {
                  if (err) {
                    ERROR('failed to call draft endpoint - ' + err);
                    next(err);
                  } else {
                    //fetch form again
                    doGet('/api/v1/inputforms/' + moduleId, function(err, result) {
                      if (err) {
                        ERROR('failed to call get inputforms endpoint - ' + err);
                        next(err);
                      } else {
                        //assert <-- schema and revision has been created
                        assert.ok(result._id === moduleId);
                        assert.ok(result.title === inputform.title);
                        assert.ok(result.description === inputform.description);
                        assert.ok(result.backgroundImageUrl === inputform.backgroundImageUrl);
                        assert.ok(result.submitSuccessTitle === inputform.submitSuccessTitle);
                        assert.ok(result.submitSuccessDescription === inputform.submitSuccessDescription);
                        assert.ok(result.submitErrorMessage === inputform.submitErrorMessage);
                        assert.ok(result.published === inputform.published);
                        assert.ok(result.multi === inputform.multi);
                        assert.ok(result.anon === inputform.anon);
                        assert.ok(result.publicationSchedule[0].startDate === inputform.publicationSchedule[0].startDate.toString());
                        assert.ok(result.publicationSchedule[0].endDate === inputform.publicationSchedule[0].endDate.toString());
                        assert.ok(result.publicationSchedule[0].eventNote === inputform.publicationSchedule[0].eventNote);
                        assert.ok(result.dateCreated !== null);
                        assert.ok(result.dateUpdated !== null);
                        assert.ok(result.revisions.length == 1);
                        assert.ok(result.revisions[0].dateCreated.length > 0);
                        assert.ok(result.revisions[0].revisionNote.length != undefined);
                        assert.ok(result.revisions[0].fields.length == updaterevision.fields.length);
                        assert.ok(result.revisions[0].fields[0].validateConfig == undefined); 
                        assert.ok(result.revisions[0].fields[0].config != undefined); 
                        assert.ok(result.revisions[0].fields[0].type != undefined); 
                        // fetch published form
                        doGet('/api/v1/inputforms/' + moduleId + '/live', function(err, result) {
                          if (err) {
                            ERROR('failed to call get inputforms endpoint - ' + err);
                            next(err);
                          } else {
                            // assert <- there is no available revision at this time
                            assert.ok(result._id === moduleId);
                            assert.ok(result.title === inputform.title);
                            assert.ok(result.description === inputform.description);
                            assert.ok(result.backgroundImageUrl === inputform.backgroundImageUrl);
                            assert.ok(result.submitSuccessTitle === inputform.submitSuccessTitle);
                            assert.ok(result.submitSuccessDescription === inputform.submitSuccessDescription);
                            assert.ok(result.submitErrorMessage === inputform.submitErrorMessage);
                            assert.ok(result.published === inputform.published);
                            assert.ok(result.multi === inputform.multi);
                            assert.ok(result.anon === inputform.anon);
                            assert.ok(result.publicationSchedule[0].startDate === inputform.publicationSchedule[0].startDate.toString());
                            assert.ok(result.publicationSchedule[0].endDate === inputform.publicationSchedule[0].endDate.toString());
                            assert.ok(result.publicationSchedule[0].eventNote === inputform.publicationSchedule[0].eventNote);
                            assert.ok(result.dateCreated !== null);
                            assert.ok(result.dateUpdated !== null);
                            assert.ok(result.revisions.length === 0);
                            // publish draft revision
                            doPost('/api/v1/inputforms/' + moduleId + '/publish', {}, function(err) {
                              if (err) {
                                ERROR('failed to call inputforms publish endpoint - ' + err);
                                next(err);
                              } else {
                                // fetch published form
                                doGet('/api/v1/inputforms/' + moduleId + '/live', function(err, result) {
                                  if (err) {
                                    ERROR('failed to call inputforms live endpoint - ' + err);
                                    next(err);
                                  } else {
                                    // assert <- the previous draft is now live
                                    assert.ok(result._id === moduleId);
                                    assert.ok(result.title === inputform.title);
                                    assert.ok(result.description === inputform.description);
                                    assert.ok(result.backgroundImageUrl === inputform.backgroundImageUrl);
                                    assert.ok(result.submitSuccessTitle === inputform.submitSuccessTitle);
                                    assert.ok(result.submitSuccessDescription === inputform.submitSuccessDescription);
                                    assert.ok(result.submitErrorMessage === inputform.submitErrorMessage);
                                    assert.ok(result.published === inputform.published);
                                    assert.ok(result.multi === inputform.multi);
                                    assert.ok(result.anon === inputform.anon);
                                    assert.ok(result.publicationSchedule[0].startDate === inputform.publicationSchedule[0].startDate.toString());
                                    assert.ok(result.publicationSchedule[0].endDate === inputform.publicationSchedule[0].endDate.toString());
                                    assert.ok(result.publicationSchedule[0].eventNote === inputform.publicationSchedule[0].eventNote);
                                    assert.ok(result.dateCreated !== null);
                                    assert.ok(result.dateUpdated !== null);
                                    assert.ok(result.revisions.length == 1);
                                    assert.ok(result.revisions[0].dateCreated.length > 0);
                                    assert.ok(result.revisions[0].revisionNote.length != undefined);
                                    assert.ok(result.revisions[0].fields.length == updaterevision.fields.length);
                                    assert.ok(result.revisions[0].fields[0].validateConfig == undefined); 
                                    assert.ok(result.revisions[0].fields[0].config != undefined); 
                                    assert.ok(result.revisions[0].fields[0].type != undefined); 
                                    next();
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('return form field definitions', function(next) {
    //fetch
    doGet('/api/v1/inputforms_fields', function(err, result) {
      if (err) {
        ERROR('failed to call get inputforms_fields endpoint - ' + err);
        next(err);
      } else {
        var fields = result;
        Object.keys(fields).forEach(function(k){
          var e = fields[k];
          assert.ok(e.type.length > 0);
          assert.ok(e.name.length > 0);
          assert.ok(Object.prototype.toString.call(e.config) === '[object Object]');
        });
        next();
      }
    });
  });

  it('submits a valid entry successfully', function(next) {
    //new test strategy:
    // - create inputform
    // - fetch field definitions
    // - update revision by adding several fields
    // - publish draft revision
    // - fetch published form
    // - submit
    // assert <-- entry data has been successful
    var parseFieldDefinition = function(def) {
      var target = {};
      target.type = def.type;
      target.config = {};

      Object.keys(def.config).forEach(function(k) {
        target.config[k] = def.config[k].value;
      });
      return target;
    };
    var moduleId = instanceid_ + '.fakemodule1';
    var inputform = {
      _id: moduleId,
      title: "input form title",
      description: "input form description",
      backgroundImageUrl: "http://www.example.com/image.jpg",
      submitSuccessTitle: "Submit Success!",
      submitSuccessDescription: "Submit Success Description",
      submitErrorMessage: "Submit Error Message",
      published: true,
      multi: true,
      publicationSchedule: [{
        startDate: new Date(2016, 0, 1, 0, 0, 0).toString(),
        endDate: new Date(2016, 0, 30, 0, 0, 0).toString(),
        eventNote: 'notes for this event',
      }]
    };
    //create inputform
    doPost('/api/v1/inputforms/' + moduleId, inputform, function(err, result) {
      if (err) {
        ERROR('failed to call post inputforms endpoint - ' + err);
        next(err);
      } else {
        //fetch field definitions
        doGet('/api/v1/inputforms_fields', function(err, result) {
          if (err) {
            ERROR('failed to call get inputforms fields endpoint - ' + err);
            next(err);
          } else {
            //crete update revision object
            var updaterevision = {
              revisionNote: 'this is a test',
              fields: [
                parseFieldDefinition(result.TEXT),
                parseFieldDefinition(result.TEXT),
                parseFieldDefinition(result.MEDIA),
              ],
            };
            //modify some fields
            updaterevision.fields[0].config.title = 'first name';
            updaterevision.fields[0].config.required = true;
            updaterevision.fields[0].config.description = 'Enter your first name';
            updaterevision.fields[0].config.error = 'You must enter a name between 2-10 chars long';
            updaterevision.fields[0].config.min = 2; 
            updaterevision.fields[0].config.max = 10; 
            updaterevision.fields[1].config.title = 'last name';
            updaterevision.fields[2].config.title = 'upload image';
            updaterevision.fields[2].config.filetypes = 'png jpg'; 
            doPut('/api/v1/inputforms/' + moduleId + '/draft', updaterevision, function(err) {
              if (err) {
                ERROR('failed to call draft endpoint - ' + err);
                next(err);
              } else {
                // publish draft revision
                doPost('/api/v1/inputforms/' + moduleId + '/publish', {}, function(err) {
                  if (err) {
                    ERROR('failed to call inputforms publish endpoint - ' + err);
                    next(err);
                  } else {
                    // fetch published form
                    doGet('/api/v1/inputforms/' + moduleId + '/live', function(err, result) {
                      if (err) {
                        ERROR('failed to call inputforms live endpoint - ' + err);
                        next(err);
                      } else {
                        //prepare entry
                        var entry = {
                          anon: false,
                          revisionid: result.revisions[0]._id,
                          fields: [
                            "super",
                            "jisan",
                            "http://www.example.com/image.jpg",
                          ]
                        };
                        doPost('/api/v1/inputforms/' + moduleId + '/submit', entry, function(err, result1) {
                          if (err) {
                            ERROR('failed to call inputforms submission endpoint - ' + err);
                            next(err);
                          } else {
                            //assert
                            assert.ok(result1.success === true);
                            assert.ok(result1.errors.length === 0);
                            //prepare another entry
                            var revisionId = result.revisions[0]._id;
                            var entry2 = {
                              anon: false,
                              revisionid: result.revisions[0]._id,
                              fields: [
                                "jisan",
                                "super",
                                "http://www.example.com/image.jpg",
                              ]
                            };
                            doPost('/api/v1/inputforms/' + moduleId + '/submit', entry2, function(err, result2) {
                              if (err) {
                                ERROR('failed to call inputforms submission endpoint - ' + err);
                                next(err);
                              } else {
                                //assert
                                assert.ok(result2.success === true);
                                assert.ok(result2.errors.length === 0);
                                next();
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('foo', function(next) {
    //test strategy:
    // - create inputform
    // - fetch field definitions
    // - update revision by adding several fields
    // - publish draft revision
    // - fetch published form
    // - submit one branch
    // assert <-- entry data has been successful
    // - submit another branch
    // assert <-- entry data has been successful
    var parseFieldDefinition = function(def) {
      var target = {};
      target.type = def.type;
      target.config = {};

      Object.keys(def.config).forEach(function(k) {
        target.config[k] = def.config[k].value;
      });
      return target;
    };
    var moduleId = instanceid_ + '.fakemodule3';
    var inputform = {
      _id: moduleId,
      title: "branching",
      description: "input form description",
      backgroundImageUrl: "http://www.example.com/image.jpg",
      submitSuccessTitle: "Submit Success!",
      submitSuccessDescription: "Submit Success Description",
      submitErrorMessage: "Submit Error Message",
      published: true,
      multi: true,
      publicationSchedule: [{
        startDate: new Date(2016, 0, 1, 0, 0, 0).toString(),
        endDate: new Date(2016, 0, 30, 0, 0, 0).toString(),
        eventNote: 'notes for this event',
      }]
    };
    //create inputform
    doPost('/api/v1/inputforms/' + moduleId, inputform, function(err, result) {
      if (err) {
        ERROR('failed to call post inputforms endpoint - ' + err);
        next(err);
      } else {
        //fetch field definitions
        doGet('/api/v1/inputforms_fields', function(err, result) {
          if (err) {
            ERROR('failed to call get inputforms fields endpoint - ' + err);
            next(err);
          } else {
            //crete update revision object
            var updaterevision = {
              revisionNote: 'this is a test',
              fields: [
                //page1
                parseFieldDefinition(result.TEXT),
                //nav1: choices: (break1, break2)
                parseFieldDefinition(result.NAV),
                //break1: next = null
                parseFieldDefinition(result.BREAK),
                //page2
                parseFieldDefinition(result.TEXT),
                //break2: next = break3
                parseFieldDefinition(result.BREAK),
                //page3
                parseFieldDefinition(result.TEXT),
                //break3 next = null
                parseFieldDefinition(result.BREAK),
                //page4
                parseFieldDefinition(result.TEXT),
              ],
            };
            //---------- configure fields ------------------
            //page1
            updaterevision.fields[0].config.title = 'page1field1';
            //nav1
            updaterevision.fields[1].config.title = 'nav1';
            updaterevision.fields[1].config.pages = [{value:'break1'},{value:'break2'}];
            //break1
            updaterevision.fields[2].config.title = 'break1';
            //page2
            updaterevision.fields[3].config.title = 'page2field1';
            updaterevision.fields[3].config.required = true; 
            //break2: next = break3
            updaterevision.fields[4].config.title = 'break2';
            updaterevision.fields[4].config.jumpToPage = 'break3';
            //page3
            updaterevision.fields[5].config.title = 'page3field1';
            updaterevision.fields[5].config.required = true; 
            //break3
            updaterevision.fields[6].config.title = 'break3';
            //page4
            updaterevision.fields[7].config.title = 'page4field1';

            doPut('/api/v1/inputforms/' + moduleId + '/draft', updaterevision, function(err) {
              if (err) {
                ERROR('failed to call draft endpoint - ' + err);
                next(err);
              } else {
                // publish draft revision
                doPost('/api/v1/inputforms/' + moduleId + '/publish', {}, function(err) {
                  if (err) {
                    ERROR('failed to call inputforms publish endpoint - ' + err);
                    next(err);
                  } else {
                    // fetch published form
                    doGet('/api/v1/inputforms/' + moduleId + '/live', function(err, result) {
                      if (err) {
                        ERROR('failed to call inputforms live endpoint - ' + err);
                        next(err);
                      } else {
                        //first submission: branch A
                        var entry1 = {
                          anon:false,
                          revisionid: result.revisions[0]._id,
                          fields: [
                            "page1field1",
                            "break1", //nav1
                            "", //break1
                            "page2field1",
                            "", //break2
                            "", //page 3 field must be skipped, and required fields must not throw errors
                            "", //break3
                            "page4field1",
                          ]
                        };
                        doPost('/api/v1/inputforms/' + moduleId + '/submit', entry1, function(err, result1) {
                          if (err) {
                            ERROR('failed to call inputforms submission endpoint - ' + err);
                            next(err);
                          } else {
                            //assert
                            assert.ok(result1.success === true);
                            assert.ok(result1.errors.length === 0);
                            //second submission: branch B
                            var entry2 = {
                              anon:false,
                              revisionid: result.revisions[0]._id,
                              fields: [
                                "page1field1",
                                "break2", //nav1
                                "", //break1
                                "", //page 2 field must be skipped and must not throw an error
                                "", //break2
                                "page3field1",
                                "", //break3
                                "page4field1",
                              ]
                            };

                            doPost('/api/v1/inputforms/' + moduleId + '/submit', [entry1,entry2], function(err, result2) {
                              if (err) {
                                ERROR('failed to call inputforms submission endpoint - ' + err);
                                next(err);
                              } else {
                                assert.ok(result2.success === true);
                                assert.ok(result2.errors.length === 0);
                                next();
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
});
