var errorsonly = true;
var debugmongoose = false;

global.__base = __dirname + '/../../'; // this must be the very first line
var log = require(__base + 'config/log.js');
if (errorsonly) {
  log.setLogLevel('error');
}
var settings = require('../settings.js');
var stools = require(__base + 'config/stools.js');
var tools = require(__base + 'config/tools.js');
var request = require('supertest');
var config = require(__base + 'config/config.js');
var git = require('git-rev');
var _ = require('lodash-node');
var server_;
var cookies_ = {};
var data = require(__base + 'config/data.js');
var installer = require(__base + 'config/installer.js');
var assert = require('assert');

function getcookies(token) {
  token = token || '__global__';
  var result = '';
  var cookies = cookies_[token];
  if (cookies) {
    for (var key in cookies) {
      if (result) {
        result += '; ';
      }
      result += key + '=' + cookies[key];
    }
  }
  return result;
}

function getcookie(token, name) {
  token = token || '__global__';
  var cookies = cookies_[token];
  if (cookies) {
    return cookies[name];
  }
  return '';
}

function setcookies(res, token) {
  token = token || '__global__';
  var headers = res.headers['set-cookie'];
  if (headers) {
    if (!cookies_[token]) {
      cookies_[token] = {};
    }
    var cookies = cookies_[token];
    headers.forEach(function(cs) {
      cs.split(';').map(function(c) {
        var split = c.split('=');
        if (split.length == 2 && split[0] && split[1]) {
          cookies[split[0].trim()] = split[1].trim();
        }
      });
    });
  }
}

function clearcookies(token) {
  token = token || '__global__';
  delete cookies_[token];
}

function clearallcookies() {
  cookies_ = {};
}

var connect = data.connect;
var disconnect = data.disconnect;

before(function(next) {
  git.short(function(rev) {
    global.__rev = rev;
    next();
  });
});

before(function(next) {
  tools.chain(function(next) {
    if (!config.appRole) {
      next();
    } else {
      var aws = require(__base + 'config/aws.js');
      var runner = require(__base + 'config/taskrunner.js');
      var task = runner.addTask(__base + 'config/tasks/updatecredentials.js');
      task.on('error', function(n, err) {
        ERROR('role task[' + n + '] failed - ' + err);
      });
      task.on('update', function(n, tokeninfo) {
        if (tokeninfo) {
          aws.setTokenInfo(tokeninfo);
        }
        if (!listenonce) {
          listenonce = true;
          next();
        }
      });
      runner.start();
    }
  }, function() {
    connect(function(err) {
      if (err) {
        next(err);
      } else {
        data.Test_DropAll(function(err) {
          if (err) {
            ERROR('failed to drop databases');
            next(err);
          } else {
            disconnect(function(err) {
              if (err) {
                next(err);
              } else {
                connect(function(err) {
                  if (err) {
                    next(err);
                  } else {
                    var mongoose = require('mongoose');
                    var http = require('http');
                    var app = require(__base + 'config/express.js');
                    require(__base + 'config/passport.js');
                    data.initializeConnectConfiguration(app);
                    if (debugmongoose) {
                      mongoose.set('debug', true);
                    }
                    server_ = http.createServer(app);
                    server_.listen(settings.port, function() {
                      INFO('express server listening on port ' + server_.address().port);

                      var config = require(__base + 'config/config.js');

                      next();
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

after(function(next) {
  connect(function(err) {
    if (err) {
      next(err);
    } else {
      if (server_) {
        server_.close();
        server_ = null;
      }
      next();
    }
  });
});

var signup = function(params, next) {

  var toneid;
  var phone;

  if (_.isObject(params)) {
    toneid = params.toneName;
    phone = params.phoneNumber;
  } else if (_.isString(params)) {
    toneid = params;
    phone = (new Date().getTime()).toString();
    phone += Math.floor(Math.random() * 9000) + 1000;
  }
  request(settings.url)
    .post('/api/v1/verification/sendcode')
    .set('Content-Type', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .send({
      phone: phone
    })
    .end(function(err, res) {
      if (err) {
        ERROR('failed to send code');
        next(err);
      } else {
        var verificationtoken_ = res.body.verificationToken;
        getVerificationCode(verificationtoken_, function(code) {
          request(settings.url)
            .post('/api/v1/verification/verifycode')
            .set('Content-Type', 'application/json')
            .set('Verification', 'Bearer ' + verificationtoken_)
            .expect('Content-Type', /json/)
            .expect(200)
            .send({
              code: code
            })
            .end(function(err, res) {
              if (err) {
                ERROR('failed to verify code');
                next(err);
              } else {
                request(settings.url)
                  .post('/api/v1/registrations')
                  .set('Verification', 'Bearer ' + verificationtoken_)
                  .send({
                    toneName: toneid,
                    password: settings.password,
                    passwordConfirm: settings.password
                  })
                  .expect(200)
                  .expect('Content-Type', /json/)
                  .end(function(err, res) {
                    if (err) {
                      if (res.body.message === 'something broke') {
                        WARN('registration publisher error - ' + err);
                        next(err);
                      } else {
                        next(res.body.message);
                      }
                    } else {
                      var token = 'Bearer ' + res.body.token;
                      setcookies(res, token);
                      next(null, token);
                    }
                  });
              }
            });
        });
      }
    });
};

var signin = function(toneid, next) {
  request(settings.url)
    .post('/api/v1/sessions')
    .set('Content-Type', 'application/json')
    .send({
      toneNameOrPhone: toneid,
      password: settings.password
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to signin - ' + err);
        next(err);
      } else if (!res.body || !res.body.token) {
        next('invalid token');
      } else {
        var token = 'Bearer ' + res.body.token;
        var csrf = res.body.csrf;
        setcookies(res, token);
        next(null, token, csrf);
      }
    });
};

var signout = function(authtoken, next) {
  request(settings.url)
    .delete('/api/v1/sessions')
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .expect(200)
    //.expect('Content-Type', /json/)
    .end(function(err, res) {
      clearcookies(authtoken);
      next(err);
    });
};

var loadtone = function(instanceId, authtoken, next) {
  request(settings.url)
    .get('/api/v1/tones/' + instanceId)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to load tone' - err);
        next('failed to load tone');
      } else {
        next(null, res.body);
      }
    });
};

var updatetoneadmin = function(authtoken, csrf, instanceid, fields, next) {
  request(settings.url)
    .put('/api/v1/admin/tones/' + instanceid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send(fields)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to update tone - ' + err);
        next('failed to update tone');
      } else {
        next(null, res.body);
      }
    });
};

var createtonewithphone = function(toneid, phone, next) {
  signup({
    toneName: toneid,
    phoneNumber: phone
  }, function(err) {
    if (err) {
      next(err);
    } else {
      toneid = _.isObject(toneid) ? toneid.toneName : toneid;
      signin(toneid, function(err, authtoken, csrf) {
        if (err) {
          next(err);
        } else {
          loadtone(toneid, authtoken, function(err, tone) {
            if (err) {
              next(err);
            } else {
              next(null, tone, authtoken, csrf);
            }
          });
        }
      });
    }
  });
}
var createtone = function(toneid, next) {
  signup(toneid, function(err) {
    if (err) {
      next(err);
    } else {
      toneid = _.isObject(toneid) ? toneid.toneName : toneid;
      signin(toneid, function(err, authtoken, csrf) {
        if (err) {
          next(err);
        } else {
          loadtone(toneid, authtoken, function(err, tone) {
            if (err) {
              next(err);
            } else {
              next(null, tone, authtoken, csrf);
            }
          });
        }
      });
    }
  });
}

var createtones = function(toneids, next) {
  var resulttones = {};
  var resultauthtokens = {};
  var resultcsrfs = {};
  tools.delay(toneids.length, function(force) {
    toneids.forEach(function(toneid) {
      createtone(toneid, function(err, tone, authtoken, csrf) {
        if (err) {
          force(err);
        } else {
          resulttones[toneid] = tone;
          resultauthtokens[toneid] = authtoken;
          resultcsrfs[toneid] = csrf;
          force();
        }
      });
    });
  }, function(err) {
    if (err) {
      next(err);
    } else {
      next(null, resulttones, resultauthtokens, resultcsrfs);
    }
  });
};

var getVerificationCode = function(verificationtoken, next) {
  var mongoose = require('mongoose');
  stools.decodeauthheader('Bearer ' + verificationtoken, function(err, decoded) {
    data.Verification_FindOne(decoded.phone, decoded.verificationid, function(err, verify) {
      if (err) {
        ERROR("Can't Find Verification Code");
        next(code);
      }
      next(verify.code);
    });
  });
};

var settonestopublic = function(instanceIds, next) {
  data.Test_SetInstanceVisibilities(instanceIds, true, function(err, instances) {
    if (err || !instances) {
      next('instances not found', null);
    } else {
      next(null, instances);
    }
  });
};

var gettonephonenumber = function(tonename, next) {
  data.Entry_FindOneByToneId(tonename.toLowerCase(), function(err, entry) {
    if (err) {
      ERROR('failed to find entry - ' + err);
      next('failed to find entry');
    } else if (!entry) {
      ERROR('entry not found');
      next('entry not found');
    } else {
      next(null, entry.phone);
    }
  });
};


var addNewToneToAccount = function(params, next) {

  var toneid = params.toneName;
  var phone = params.phoneNumber;
  var authToken = params.authToken;

  request(settings.url)
    .post('/api/v1/verification/sendcode')
    .set('Content-Type', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .send({
      phone: phone
    })
    .end(function(err, res) {
      if (err) {
        ERROR('failed to send code');
        next(err);
      } else {
        var verificationtoken_ = res.body.verificationToken;
        getVerificationCode(verificationtoken_, function(code) {
          request(settings.url)
            .post('/api/v1/verification/verifycode')
            .set('Content-Type', 'application/json')
            .set('Verification', 'Bearer ' + verificationtoken_)
            .expect('Content-Type', /json/)
            .expect(200)
            .send({
              code: code
            })
            .end(function(err, res) {
              if (err) {
                ERROR('failed to verify code');
                next(err);
              } else {
                request(settings.url)
                  .post('/api/v1/tones')
                  .set('Cookie', getcookies(authToken))
                  .set('Verification', 'Bearer ' + verificationtoken_)
                  .set('Authorization', authToken)
                  .send({
                    name: toneid
                  })
                  .expect(200)
                  .expect('Content-Type', /json/)
                  .end(function(err, res) {
                    if (err) {
                      ERROR('create tone error - ' + err);
                      next(err);
                    } else {
                      var token = 'Bearer ' + res.body.token;
                      setcookies(res, token);
                      data.Verification_RemoveOne(phone, function(err) {
                        next(null, token);
                      });
                    }
                  });
              }
            });
        });
      }
    });
};



var deleteTone = function(params, next) {

  var toneid = params.toneName;
  var authToken = params.authToken;

  request(settings.url)
    .delete('/api/v1/tones/' + toneid)
    .set('Cookie', getcookies(authToken))
    .set('Authorization', authToken)
    .send({
      _id: toneid
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) {
        ERROR('delete tone error - ' + err);
        next(err);
      } else {
        next();
      }
    });
};


var createtonemobile = function(phone, toneId, token, happypath, initiative, next) {

  request(settings.url)
    .post('/api/v1/verification/sendcode')
    .set('Content-Type', 'application/json')
    .set('user-agent', 'Tone for Android')
    .expect('Content-Type', /json/)
    .expect(200)
    .send({
      phone: phone
    })
    .end(function(err, res) {
      if (err) {
        ERROR('failed to send code');
        next(err);
      } else {
        var verificationtoken_ = res.body.verificationToken;
        getVerificationCode(verificationtoken_, function(code) {
          request(settings.url)
            .post('/api/v1/verification/verifycode')
            .set('Content-Type', 'application/json')
            .set('user-agent', 'Tone for Android')
            .set('Verification', 'Bearer ' + verificationtoken_)
            .expect('Content-Type', /json/)
            .expect(200)
            .send({
              code: code
            })
            .end(function(err, res) {
              if (err) {
                WARN('failed to verify code');
                next(err);
              } else {
                if (res.body.toneExists && happypath) {
                  var mp = res.body.mp;
                  request(settings.url)
                    .post('/api/v1/sessions/mobile')
                    .set('user-agent', 'Tone for Android')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .send({
                      toneNameOrPhone: phone,
                      password: mp,
                      token: token
                    })
                    .end(function(err, res) {
                      if (err) {
                        ERROR('failed to verify code');
                        next(err);
                      } else {

                        request(settings.url)
                          .get('/api/v1/tones/' + toneId.toLowerCase())
                          .set('Content-Type', 'application/json')
                          .expect(200)
                          .expect('Content-Type', /json/)
                          .end(function(err, res) {
                            if (err) {
                              ERROR('failed to get subscriber tone');
                              next(err);
                            } else {
                              next(null, res.body);
                            }
                          });
                      }
                    });
                } else {
                  var args = {
                    toneName: toneId,
                  };
                  if (initiative) {
                    args.initiative = initiative
                  }
                  request(settings.url)
                    .post('/api/v1/registrations/mobile')
                    .set('Content-Type', 'application/json')
                    .set('Verification', 'Bearer ' + verificationtoken_)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .send(args)
                    .end(function(err, res) {
                      if (err) {
                        if (res.body.message === 'something broke') {
                          WARN('failed mobile registration - unable to create account - ' + err);
                          next(err);
                        } else {
                          next(res.body.message);
                        }
                      } else {
                        var program = res.body.program;
                        var mp = res.body.mp;
                        request(settings.url)
                          .post('/api/v1/sessions/mobile')
                          .set('Content-Type', 'application/json')
                          .expect('Content-Type', /json/)
                          .expect(200)
                          .send({
                            toneNameOrPhone: phone,
                            password: mp,
                            token: token
                          })
                          .end(function(err, res) {
                            if (err) {
                              ERROR('failed to to complete mobile login');
                              next(err);
                            } else {
                              var signinprogram = res.body.program;
                              if (program) {
                                assert(signinprogram);
                                assert(signinprogram._id == program._id);
                                assert(signinprogram.instanceId == program.instanceId);
                                assert(signinprogram.group == program.group);
                                assert(signinprogram.type == program.type);
                              }
                              request(settings.url)
                                .get('/api/v1/tones/' + toneId.toLowerCase())
                                .set('Content-Type', 'application/json')
                                .expect(200)
                                .expect('Content-Type', /json/)
                                .end(function(err, res) {
                                  if (err) {
                                    ERROR('failed to get subscriber tone');
                                    next(err);
                                  } else {
                                    if (signinprogram) {
                                      assert(signinprogram.instanceId == res.body.initiativeInstanceId);
                                    }
                                    next(null, res.body, program);
                                  }
                                });
                            }
                          });
                      }
                    });
                }
              }
            });
        });
      }
    });
};

function removeaccountdocument(accountid, toneid, next) {
  data.Test_UpdateEntry(toneid, function(err) {
    if (err) {
      ERROR('failed to unconfirm entry - ' + err);
      next('failed to unconfirm entry');
    } else {
      data.Test_RemoveAccount(accountid, next);
    }
  });
}

function removeinstancedocument(instanceid, next) {
  data.Test_Remove('Instance', {
    _id: instanceid
  }, next);
}

function removetonedocument(toneid, next) {
  data.Test_Remove('Tone', {
    toneId: toneid
  }, next);
}

function findinvite(code, type, next) {
  data.Test_FindOne('InitiativeInvite', {
    _id: code,
    type: type
  }, {}, next);
}

function addrole(authtoken, csrf, role, next) {
  request(settings.url)
    .post('/api/v1/roles/' + role)
    .set('Content-Type', 'application/json')
    .set('Cookie', getcookies(authtoken))
    .set('X-CSRF-TOKEN', csrf)
    .expect('Content-Type', /json/)
    .expect(200)
    .send({})
    .end(function(err, res) {
      if (err) {
        ERROR('failed to add role - ' + err);
        next('failed to add role');
      } else {
        next();
      }
    });
}

function createmodule(authtoken, csrf, instanceid, moduletype, title, next) {
  request(settings.url)
    .post('/api/v1/tones/' + instanceid + '/modules/')
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .set('X-CSRF-TOKEN', csrf)
    .send({
      moduleBuilderId: moduletype,
      title: title
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to create ' + moduletype + ' module - ' + err);
        next(err);
      } else {
        var moduleid = res.body._id;
        next(null, res.body._id);
        /*
        request(settings.url)
          .get('/api/v1/tones/' + instanceid + '/modules/' + moduleid)
          .set('Cookie', getcookies(authtoken))
          .set('Content-Type', 'application/json')
          .set('Authorization', authtoken)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              ERROR('failed to create slide show module');
              next(err);
            } else {
              next(null, res.body._id);
            }
          });
        */
      }
    });
}

function updatemodule(authtoken, csrf, instanceid, moduleid, fields, next) {
  request(settings.url)
    .put('/api/v1/tones/' + instanceid + '/modules/' + moduleid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .expect('Content-Type', /json/)
    .send(fields)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to update module - ' + err);
        next('failed to update module');
      } else {
        next(null, res.body);
      }
    });
}

function findmodule(authtoken, instanceid, moduleid, next) {
  request(settings.url)
    .get('/api/v1/tones/' + instanceid + '/modules/' + moduleid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .end(function(err, res) {
      if (err) {
        ERROR('failed to find module ' + moduleid + ' - ' + err);
        next('failed to find module ' + moduleid);
      } else if (res.headers['content-type'].match(/json/) && res.statusCode == 200) {
        next(null, res.body);
      } else if (res.headers['content-type'].match(/plain/) && res.statusCode == 403) {
        next();
      } else {
        next('invalid find module response');
      }
    });
}

function findsubscriptionmodule(authtoken, instanceid, moduleid, next) {
  request(settings.url)
    .get('/api/v1/subscriptions/tones/' + instanceid + '/modules/' + moduleid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .end(function(err, res) {
      if (err) {
        ERROR('failed to find module ' + moduleid + ' - ' + err);
        next('failed to find module ' + moduleid);
      } else if (res.headers['content-type'].match(/json/) && res.statusCode == 200) {
        next(null, res.body);
      } else if (res.headers['content-type'].match(/plain/) && res.statusCode == 403) {
        next();
      } else {
        next('invalid find module response');
      }
    });
}

function findinitiativemodule(authtoken, instanceid, moduleid, next) {
  request(settings.url)
    .get('/api/v1/initiative/' + instanceid + '/modules/' + moduleid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .end(function(err, res) {
      if (err) {
        ERROR('failed to find module ' + moduleid + ' - ' + err);
        next('failed to find module ' + moduleid);
      } else if (res.headers['content-type'].match(/json/) && res.statusCode == 200) {
        next(null, res.body);
      } else if (res.headers['content-type'].match(/plain/) && res.statusCode == 403) {
        next();
      } else {
        next('invalid find module response');
      }
    });
}

function findmodules(authtoken, hostinstanceid, subinstanceid, packagename, next) {
  if (typeof subinstanceid == "function") {
    next = subinstanceid;
  }
  request(settings.url)
    .get('/api/v1/tones/' + hostinstanceid + '/modules')
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to find weather module');
        next(err);
      } else {
        next(null, res.body);
      }
    });
}

function findinitiativemodules(authtoken, hostinstanceid, subinstanceid, packagename, next) {
  request(settings.url)
    .get('/api/v1/initiatives/' + hostinstanceid + '/modules')
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to find initiative modules');
        next(err);
      } else {
        next(null, res.body);
      }
    });
}

function findsubscriptionmodulesnonsubscriber(authtoken, hostinstanceid, subinstanceid, packagename, next) {
  request(settings.url)
    .get('/api/v1/premiums/' + subinstanceid + '/tones/' + packagename + '/' + hostinstanceid + '/modules')
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to retrieve modules');
        next(err);
      } else {
        next(null, res.body);
      }
    });
}

function findsubscriptionmodules(authtoken, hostinstanceid, subinstanceid, packagename, next) {
  var token = 'should.somoethingsomething' + Math.floor(Math.random() * 9000);
  request(settings.url)
    .get('/api/v1/premiums/' + subinstanceid + '/tones/' + packagename + '/' + hostinstanceid + '/modules?productid=' + hostinstanceid + '&initiative=true&token=' + token)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .send({})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to retrieve modules');
        next(err);
      } else {
        next(null, res.body);
      }
    });
}

function removemodule(authtoken, csrf, instanceid, moduleid, next) {
  request(settings.url)
    .delete('/api/v1/tones/' + instanceid + '/modules/' + moduleid)
    .set('Cookie', getcookies(authtoken))
    .set('Content-Type', 'application/json')
    .set('Authorization', authtoken)
    .set('X-CSRF-TOKEN', csrf)
    .send({})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        ERROR('failed to delete module - ' + err);
        next(err);
      } else {
        next();
      }
    });
}

// var onboarding = (function() {

//   var truncateonboardingtables = function(next) {
//     var tables = [
//       'Carrier',
//       'OrderStatus',
//       'ProductType',
//       'PriceTier',
//       'PriceTierCurrency',
//       'Product',
//       'BundleProduct',
//       'OrderItem',
//       'OrderItemLog',
//       'UserProduct',
//     ];

//     var sql = tables.map(function(e) {
//       return 'TRUNCATE `' + e + '`;';
//     }).reduce(function(a, b) {
//       return a + b;
//     });
//     data.Test_ExecuteSql(sql, function(err) {
//       if (err) {
//         ERROR('failed to execute sql - ' + err);
//         next(err);
//       } else {
//         next();
//       }
//     });
//   };

//   var teardown = function(next) {
//     truncateonboardingtables(function(err) {
//       if (err) {
//         ERROR('failed to call truncateonboardingtables - ' + err);
//         next(err);
//       } else {
//         next();
//       }
//     });
//   };

//   var seeddatabase = function(next) {
//     stools.getsql('DatabaseSeedOnboarding', function(err, sql) {
//       if (err) {
//         ERROR('failed to call stools.getsql - ' + err);
//         next(err);
//       } else {
//         data.Test_ExecuteSql(sql, function(err) {
//           if (err) {
//             ERROR('failed to execute sql - ' + err);
//             next(err);
//           } else {
//             next();
//           }
//         });
//       }
//     });
//   };

//   var addpremiumtone = function(instanceid, next) {
//     var sql = "INSERT INTO `Product` select (max(productid) + 1),1,3,1,1,30,'" + instanceid + "', '" + instanceid + "', '" + instanceid + " TEST', now(),now() from Product; ";
//     data.Test_ExecuteSql(sql, function(err) {
//       if (err) {
//         ERROR('failed to execute sql - ' + err);
//         next(err);
//       } else {
//         next();
//       }
//     });
//   };

//   var setup = function(next) {
//     teardown(function(err) {
//       if (err) {
//         ERROR('failed to call teardown during setup - ' + err);
//         next('failed to call teardown during setup');
//       } else {
//         seeddatabase(function(err) {
//           if (err) {
//             ERROR('failed to call seeddatabase - ' + err);
//             next(err);
//           } else {
//             next();
//           }
//         });
//       }
//     });
//   };

//   return {
//     setup: setup,
//     teardown: teardown,
//     addpremiumtone: addpremiumtone
//   };
// }());

module.exports = {
  connect: connect,
  signup: signup,
  signin: signin,
  signout: signout,
  loadtone: loadtone,
  createtone: createtone,
  updatetoneadmin: updatetoneadmin,
  createtonewithphone: createtonewithphone,
  createtonemobile: createtonemobile,
  addnewtonetoaccount: addNewToneToAccount,
  deletetone: deleteTone,
  createtones: createtones,
  getVerificationCode: getVerificationCode,
  setcookies: setcookies,
  getcookies: getcookies,
  getcookie: getcookie,
  clearcookies: clearcookies,
  clearallcookies: clearallcookies,
  gettonephonenumber: gettonephonenumber,
  settonestopublic: settonestopublic,
  addrole: addrole,
  createmodule: createmodule,
  updatemodule: updatemodule,
  findmodule: findmodule,
  findmodules: findmodules,
  findsubscriptionmodule: findsubscriptionmodule,
  findsubscriptionmodules: findsubscriptionmodules,
  findsubscriptionmodulesnonsubscriber: findsubscriptionmodulesnonsubscriber,
  findinitiativemodule: findinitiativemodule,
  findinitiativemodules: findinitiativemodules,
  removemodule: removemodule,
  db: {
    FishCatalog_Update: data.FishCatalog_Update,
    FishCatalog_FindOne: data.FishCatalog_FindOne,
    FishCatalog_Remove: data.FishCatalog_Remove,
    findtone: data.Entry_FindOneByToneId,
    findinstance: data.Instance_FindOneById,
    findaccount: data.Account_FindOneById,
    removeaccount: removeaccountdocument,
    removetone: removetonedocument,
    removeinstance: removeinstancedocument,
    findroles: data.Account_Roles,
    findgroup: data.Group_FindOne,
    findconnection: data.Connection_FindOne,
    findinvite: findinvite,
    updateinvite: data.Test_UpdateInvite,
    setupsponsorship: data.Test_SetupSponsorship,
    sponsorcreate: data.Test_SponsorCreate,
    sponsortopup: data.Test_SponsorTopup,
    allowancecreate: data.Test_AllowanceCreate,
    sponsorshipcreate: data.Test_SponsorshipCreate,
    sponsorshipinstanceattach: data.Test_SponsorshipInstanceAttach,
    sponsorshipinstancedetach: data.Test_SponsorshipInstanceDetach,
    findsponsorshipstate: data.Test_FindSponsorshipState,
    sponsorshipconsume: data.Test_SponsorshipConsume
  },
  // onboarding: onboarding
};
