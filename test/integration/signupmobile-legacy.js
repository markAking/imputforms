var settings = require('../settings.js');
var request = require('supertest');
var db = require(__base + 'config/db.js');
var assert = require('assert');
var expect = require('chai').expect;
var _ = require('lodash-node');
var stools = require(__base + 'config/stools.js');
var tools = require(__base + 'config/tools.js');
var api = require('./_api.js');
var token = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";

describe('signupmobile-legacy', function() {

  it('should create a new tone and should not be able to create another tone with either the same toneid or same phone', function(next) {
    api.createtonemobile('12129122115', 'mtesttone', token, true, '', function(err, instance, authtoken) {
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
                    api.createtonemobile('12129122115', 'mtesttone-1', "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WxW", false, '', function(err, instance, authtoken) {
                      if (!err) {
                        ERROR('phone should already exist');
                        next('phone should already exist');
                      } else if (err != 'phone number already in use') {
                        ERROR('unexpected response - ' + err);
                        next('unexpected response');
                      } else {
                        api.createtonemobile('12129122114', 'mtesttone', token, false, '', function(err, instance, authtoken) {
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
    api.createtonemobile('12128122116', 'mtesttone-2', token, true, '', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeinstance(instance._id, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtonemobile('12128122116', 'mobiletesttone-2', token, false, '', function(err, instance, authtoken) {
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
    api.createtonemobile('12128122117', 'mtesttone-3', token, false, '', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeaccount(instance.ownerId, instance.toneId, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtonemobile('12128122117', 'mtesttone-3', token, false, '', function(err, instance, authtoken) {
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
    api.createtonemobile('12128122118', 'mtesttone-4', token, false, '', function(err, instance, authtoken) {
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
                api.createtonemobile('12128122118', 'mtesttone-4', token, false, '', function(err, instance, authtoken) {
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

  it('should create a web account and then create password on mobile', function(next) {
    api.createtonewithphone('mtesttone-5', '12128122119', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.createtonemobile('12128122119', 'mtesttone-5', token, true, '', function(err, instance, authtoken) {
          if (err) {
            ERROR('failed to login on mobile - ' + err);
            next('failed to login on mobile');
          } else {
            next();
          }
        });
      }
    });
  });

  it('should replace a tone on mobile when either its accountdocument or its instancedocument are absent', function(next) {
    api.createtonewithphone('mtesttone-6', '12128122100', function(err, instance, authtoken) {
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
                api.createtonemobile('12128122100', 'mtesttone-6', token, false, '', function(err, instance, authtoken) {
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

  it('should replace a tone on mobile when its accountdocument is absent', function(next) {
    api.createtonewithphone('mtesttone-7', '12128122101', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeaccount(instance.ownerId, instance.toneId, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtonemobile('12128122101', 'mtesttone-7', token, false, '', function(err, instance, authtoken) {
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

  it('should fail to create a tone if only its instancedocument is absent', function(next) {
    api.createtonewithphone('mtesttone-8', '12128122102', function(err, instance, authtoken) {
      if (err) {
        ERROR('failed to create tone - ' + err);
        next('failed to create tone');
      } else {
        api.db.removeinstance(instance._id, function(err) {
          if (err) {
            ERROR('failed to remove account - ' + err);
            next('failed to remove account');
          } else {
            api.createtonemobile('12128122102', 'mtesttone-8', token, false, '', function(err, instance, authtoken) {
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
});

/*
var test_params = {};
test_params['test_1'] = {};
test_params['test_1']['phone'] = "27182291018";
test_params['test_1']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";

test_params['test_2'] = {};
test_params['test_2']['phone'] = "22128122115";
test_params['test_2']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_3'] = {};
test_params['test_3']['phone'] = "291721521152";
test_params['test_3']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_3']['toneName'] = "SignUpMobileTest1";
test_params['test_4'] = {};
test_params['test_4']['phone'] = "29174349668";
test_params['test_4']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_4']['toneName'] = "SignUpMobileTest2";
test_params['test_5'] = {};
test_params['test_5']['phone'] = "291721521153";
test_params['test_5']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_5']['toneName'] = "SignUpMobileTest3";
test_params['test_6'] = {};
test_params['test_6']['phone'] = "291721521154";
test_params['test_6']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_6']['toneName'] = "SignUpMobileTest4";
test_params['test_7'] = {};
test_params['test_7']['phone'] = "29172152116";
test_params['test_7']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_7']['toneName'] = "SignUpMobileTest7";
test_params['test_8'] = {};
test_params['test_8']['phone'] = "29172152118";
test_params['test_8']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_8']['toneName'] = "SignUpMobileTest8";
test_params['test_8']['token2'] = "BAA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_9'] = {};
test_params['test_9']['phone'] = "29172152118";
test_params['test_9']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_9']['toneName'] = "SignUpMobileTest9";
test_params['test_10'] = {}; // same phone as test_9
test_params['test_10']['phone'] = "29172152118";
test_params['test_10']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_10']['toneNameA'] = "SignUpMobileTest10a";
test_params['test_10']['toneNameB'] = "SignUpMobileTest10b";
test_params['test_11'] = {}; // same toneid as test_9
test_params['test_11']['phoneA'] = "29172152129";
test_params['test_11']['phoneB'] = "29172152222";
test_params['test_11']['token'] = "APA91bHctZ0ATuG-I6yhqTMa9dVIsPVYd-LjyvsysTpxZ4TR1aMJpdrW0WVW5dt9dpOahYL3g7jp2C7Dssg8QDn5D6JkVMb5WsqbeUQO2EQPZq2myLSt16vnVGDAWFR293IYJAQRbAp-v18T5_fWWeXHZpbDL1WqFw";
test_params['test_11']['toneName'] = "SignUpMobileTest9";


describe('signup-mobile-workflow', function() {

  //set up the test configuration to support cross-region requests
  before(function() {
    var config = require(__base + 'config/config.js');
    config.appRole = 'mocha-test::' + settings.url;
  });

  describe('mobile sign up is successful when phone, tone, and account do not already exist', function() {
    var instanceId;

    before(function(next) {

      api.createtonemobile(test_params['test_3']['phone'], test_params['test_3']['toneName'], test_params['test_3']['token'], '', function(err, data) {
        if (err) {
          next(err);
        } else {
          instanceId = data._id;
          next();
        }
      });
    });

    it('creates the Tone document', function(done) {
      db.directory.model('Tone').findOne({
        instanceId: instanceId
      }, function(err, phone) {
        if (err) {
          console.log(err);
          done(err);
        } else {
          expect(phone).to.not.be.null;
          done();
        }
      });
    });

    it('creates the Instance document', function(done) {
      var toneName = test_params['test_3']['toneName'].toLowerCase();
      db.instance.model('Instance').findOne({
        toneId: toneName
      }, function(err, tone) {
        if (err) {
          console.log(err);
          done(err);
        } else {
          expect(tone).to.not.be.null;
          done();
        }
      });
    });

    it('creates the Account document', function(done) {
      db.auth.model('Account').findOne({
        instanceIds: {
          $in: [instanceId]
        }
      }, function(err, account) {
        if (err) {
          console.log(err);
          done(err);
        } else {
          expect(account).to.not.be.null;
          done();
        }
      });
    });
  });

  describe('sign up is successful when phone number already exists, due to failure to properly delete a tone', function() {

    var instanceId;
    var phoneNumber;

    before(function(next) {
      api.createtonemobile(test_params['test_4']['phone'], test_params['test_4']['toneName'], test_params['test_4']['token'], '', function(err, data) {
        if (err) {
          next(err);
        } else {
          instanceId = data._id;
          phoneNumber = test_params['test_4']['phone'];
          next();
        }
      });
    });

    it('links a new tone to the existing account', function(done) {
      var newToneName = tools.randomHash(30).toLowerCase();
      var newPhoneNumber = (new Date().getTime()).toString();
      newPhoneNumber += Math.floor(Math.random() * 90) + 10;

      api.createtone({
        toneName: newToneName,
        phoneNumber: newPhoneNumber
      }, function(err, result) {
        if (err) {
          console.log(err);
          done();
        } else {
          db.auth.model('Account').count({
            instanceIds: {
              $in: [instanceId]
            }
          }, function(err, count) {
            if (err) {
              console.log(err);
            } else {
              expect(count).to.equal(1);
            }
            done();
          });
        }
      });
    });

    describe.skip('mobile sign up is successful when phone number already exists, and tone has been deleted', function() {
      var phoneNumber;
      var newInstanceId;
      var instanceId;
      var toneName = test_params['test_5']['toneName'].toLowerCase();

      before(function(next) {
        api.createtonemobile(test_params['test_5']['phone'], test_params['test_5']['toneName'], test_params['test_5']['token'], '', function(err, data) {
          if (err) {
            next(err);
          } else {
            instanceId = data._id;
            phoneNumber = test_params['test_5']['phone'];

            var Tone = db.directory.model('Tone');
            var Account = db.auth.model('Account');
            var Instance = db.instance.model('Instance');

            //grab the instanceId of the existing phone record
            Tone.findOne({
              _id: phoneNumber
            }, function(err, phone) {
              if (err) {
                console.log(err);
              } else {
                Account.update({
                  instanceIds: {
                    $in: [instanceId]
                  }
                }, {
                  $pull: {
                    instanceIds: instanceId
                  }
                }, function(err) {
                  if (err) {
                    ERROR('could not remove instanceid from account -' + err);
                  } else {
                    //delete the tone record
                    Instance.remove({
                      _id: instanceId
                    }, function(err, result) {
                      if (err) {
                        console.log(err);
                      } else {

                        api.createtonemobile(test_params['test_5']['phone'], test_params['test_5']['toneName'], test_params['test_5']['token'], '', function(err, data) {
                          if (err) {
                            next(err);
                          } else {
                            newInstanceId = data._id;
                            next(null);
                          }
                        });
                      }
                    });
                  }
                })
              }
            });
          }
        });
      });

      it('replaces the Tone document with new tone instanceId', function(done) {
        db.directory.model('Tone').findOne({
          _id: phoneNumber
        }, function(err, phone) {
          var newPhoneInstanceId = phone.instanceId;
          var tmp1 = instanceId.split('_');
          var tmp2 = newPhoneInstanceId.split('_');
          var result = tmp1[0] === tmp2[0] && tmp1[1] !== tmp2[1];
          expect(result).is.true;
          done();
        });
      });

      it('creates the Instance document', function(done) {
        db.instance.model('Instance').count({
          _id: newInstanceId
        }, function(err, count) {
          expect(count).to.equal(1);
          done();
        });
      });

      it('recreates the Account document', function(done) {
        db.auth.model('Account').count({
          instanceIds: {
            $in: [newInstanceId]
          }
        }, function(err, count) {
          expect(count).to.equal(1);
          done();
        });
      });
    });

    it('should fail sign up when the phone is in use', function(next) {
      api.createtonemobile(test_params['test_10']['phone'], test_params['test_10']['toneNameA'], test_params['test_10']['token'], '', function(err, data) {
        if (err) {
          ERROR('failed to create mobile tone - ' + err);
          next('failed to craete mobile tone');
        } else {
          api.createtonemobile(test_params['test_10']['phone'], test_params['test_10']['toneNameB'], test_params['test_10']['token'], '', function(err, data) {
            if (!err) {
              ERROR('should not be able to create another account with existing phone');
              next('should not be able to create another account with existing phone');
            } else {
              next();
            }
          });
        }
      });
    });

    it('should fail sign up when the toneid is in use', function(next) {
      api.createtonemobile(test_params['test_11']['phoneA'], test_params['test_11']['toneName'], test_params['test_11']['token'], '', function(err, data) {
        if (err) {
          ERROR('failed to create mobile tone - ' + err);
          next('failed to craete mobile tone');
        } else {
          api.createtonemobile(test_params['test_11']['phoneB'], test_params['test_11']['toneName'], test_params['test_11']['token'], '', function(err, data) {
            if (!err) {
              ERROR('should not be able to create another account with existing phone');
              next('should not be able to create another account with existing phone');
            } else {
              next();
            }
          });
        }
      });
    });

  });
});

*/
