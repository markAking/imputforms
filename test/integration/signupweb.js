var settings = require('../settings.js');
var request = require('supertest');
var db = require(__base + 'config/db.js');
var assert = require('assert');
var expect = require('chai').expect;
var _ = require('lodash-node');
var stools = require(__base + 'config/stools.js');
var tools = require(__base + 'config/tools.js');
var api = require('./_api.js');

describe('signupweb', function() {

  it('should create a new tone and should not be able to create another tone with either the same toneid or same phone', function(next) {
    api.createtonewithphone('webtesttone', '12345678900', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create a tone - ' + err);
        next('failed to create a tone');
      } else {
        api.db.findtone(instance.toneId, function(err, tone) {
          if (err) {
            ERROR('failed to find toneref - ' + err);
            ERROR('failed to find toneref');
          } else {
            api.db.findinstance(instance._id, function(err, instance) {
              if (err) {
                ERROR('failed to find instance - ' + err);
                next('failed to find instance');
              } else {
                api.db.findaccount(instance.ownerId, function(err, account) {
                  if (err) {
                    ERROR('failed to find account - ' + err);
                    next('failed to find account');
                  } else {
                    api.createtonewithphone('webtesttone-1', '12345678900', function(err, instance, authtoken) {
                      if (!err) {
                        ERROR('phone should already exist');
                        next('phone should already exist');
                      } else if (err != 'tone name already in use') {
                        ERROR('unexpected response - ' + err);
                        next('unexpected response');
                      } else {
                        api.createtonewithphone('webtesttone', '22345678900', function(err, instance, authtoken) {
                          if (!err) {
                            ERROR('toneid should already exist');
                            next('toneid should already exist');
                          } else if (err != 'tone name already in use') {
                            ERROR('unexpected response - ' + err);
                            next('unexpected response');
                          } else {
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

  it('should fail to create a tone if only its instancedocument is absent', function(next) {
    api.createtone('webtesttone2', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeinstance(instance._id, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtone('webtesttone2', function(err, instance, authtoken) {
              if (!err) {
                ERROR('should not be able to replace an existing account - ' + err);
                next('should not be able to replace an existing account');
              } else {
                next();
              }
            });
          }
        });
      }
    });
  });

  it('should replace a tone when its accountdocument is absent', function(next) {
    api.createtone('webtesttone1', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeaccount(instance.ownerId, instance.toneId, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtone('webtesttone1', function(err, instance, authtoken) {
              if (err) {
                ERROR('failed to create replacement tone - ' + err);
                next('failed to create replacement tone');
              } else {
                next();
              }
            });
          }
        });
      }
    });
  });

  it('should replace a tone when either its accountdocument or its instancedocument are absent', function(next) {
    api.createtone('webtesttone3', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeaccount(instance.ownerId, instance.toneId, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.db.removeinstance(instance._id, function(err) {
              if (err) {
                ERROR('failed to remove instance - ' + err);
                next('failed to remove instance');
              } else {
                api.createtone('webtesttone3', function(err, instance, authtoken) {
                  if (err) {
                    ERROR('failed to create replacement tone - ' + err);
                    next('failed to create replacement tone');
                  } else {
                    next();
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