'use strict';

var config = require(__base + 'config/config.js');
var stools = require(__base + 'config/stools.js');
var tools = require(__base + 'config/tools.js');
var data = require(__base + 'config/data.js');
var _ = require('lodash-node');
var errres = require(__base + 'config/errorresponse.js');
var aws = require(__base + 'config/aws.js');
var path = require('path');
var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
var inputforms = require(__base + 'server/services/inputforms.js');
var AWS = require('aws-sdk');
var s3uploadstream = require('s3-upload-stream');
var tmp = require('tmp');
var fs = require('fs');

var isValidModuleId = function(val) {
  var s1, s2;
  return val
    //val matches format [instanceId].[hash]
    && (s1 = val.split('\.')).length == 2
    //[instanceId] matches format [tone]_....
    && (s2 = s1[0].split('_')).length >= 2
    //[hash] is not empty
    && s1[1].length > 0;
};

var parseModuleId = function(req, next) {
  var moduleId = req.param('moduleid');
  if (!moduleId) {
    ERROR('missing parameter: moduleId');
    next('missing parameter');
  } else if (!isValidModuleId(moduleId)) {
    ERROR('invalid parameter: moduleId - ' + moduleId);
    next('invalid parameter');
  } else {
    next(null, moduleId);
  }
};

var parseModuleIdAndValidateIsModuleOwner = function(req, next) {
  var moduleId = req.param('moduleid');
  if (!moduleId) {
    ERROR('missing parameter: moduleId');
    next('missing parameter');
  } else if (!isValidModuleId(moduleId)) {
    ERROR('invalid parameter: moduleId - ' + moduleId);
    next('invalid parameter');
  } else {
    var instanceId = moduleId.split('\.')[0];
    if (req.session.instanceIds.indexOf(instanceId) == -1) {
      ERROR('instanceId in moduleId not found in user session instanceIds moduleId = ' + moduleId);
      next('invalid permission');
    } else {
      next(null, moduleId);
    }
  }
};

var generateInputFormRevisionId = function(moduleId) {
  /*var randomHash = crypto.randomBytes(16)
    .toString('base64')
    .replace(/\=+/g, '')
    .replace(/\++/g, '--')
    .replace(/\/+/g, '-');
  var timestamp = new Date().getTime();
  return moduleId + '_' + timestamp + '_' + randomHash;*/
  return stools.makeObjectId();
};

var sanitizeText = function(val) {
  return val ? stools.sanitize(val).trim() : '';
};
var parseBool = function(val) {
  return (val && typeof val === 'boolean') ? val : false;
};
var parseSchedule = function(val) {
  if (!val || !Array.isArray(val)) {
    return [];
  } else {
    return val.filter(function(e) {
      return e.startDate && e.endDate;
    }).map(function(e) {
      return {
        startDate: new Date(e.startDate).toString(),
        endDate: new Date(e.endDate).toString(),
        eventNote: sanitizeText(e.eventNote),
      };
    });
  }
};
var nowDate = function() {
  return new Date();
}

var parseInputFormModel = function(moduleId, input, insert, next) {
  if (!input) {
    ERROR('invalid input - ' + input);
    next('invalid input');
  } else {
    //this map maintains a lookup for functions
    //used to parse each field
    var modelParsers = {
      title: sanitizeText,
      description: sanitizeText,
      backgroundImageUrl: sanitizeText,
      submitSuccessTitle: sanitizeText,
      submitSuccessDescription: sanitizeText,
      submitErrorMessage: sanitizeText,
      published: parseBool,
      multi: parseBool,
      anon: parseBool,
      publicationSchedule: parseSchedule,
      dateCreated: nowDate,
      dateUpdated: nowDate,
    };
    //create the initial model
    var model = {
      _id: moduleId,
      dateUpdated: nowDate(),
    };
    //change creation if we are dealing with an insert
    if (insert) {
      model.dateCreated = nowDate();
    }
    //enumerate through each model parser property
    //and parse fields for insert or update
    Object.keys(modelParsers).forEach(function(k) {
      var fn = modelParsers[k];
      if (insert) {
        var arg = input[k];
        model[k] = fn(arg);
      } else {
        //if we are dealing with an update
        //only parse those properties that are present on input
        if (k in input) {
          var arg = input[k];
          model[k] = fn(arg);
        }
      }
    });
    next(null, model);
  }
};

var parseInputFormFields = function(val) {
  if (!val || !Array.isArray(val)) {
    return [];
  } else {
    return val.map(function(e) {
      return {
        type: sanitizeText(e.type),
        name: sanitizeText(e.name),
        config: e.config ? stools.sanitizeObjectRecursively(e.config) : {}
      };
    });
  }
};

var parseInputFormRevisionModel = function(moduleId, input, next) {
  if (!input) {
    ERROR('invalid input - ' + input);
    next('invalid input');
  } else {
    //this map maintains a lookup for functions
    //used to parse each field
    var modelParsers = {
      revisionNote: sanitizeText,
      fields: parseInputFormFields
    };
    //create the initial model
    var model = {
      _id: generateInputFormRevisionId(moduleId),
      dateCreated: nowDate(),
      dateUpdated: nowDate(),
    };
    //enumerate through each model parser property
    //and parse fields for insert or update
    Object.keys(modelParsers).forEach(function(k) {
      var fn = modelParsers[k];
      var arg = input[k];
      model[k] = fn(arg);
    });
    next(null, model);
  }
};

exports.create = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      parseInputFormModel(moduleId, req.body, true, function(err, insert) {
        if (err) {
          ERROR('failed to parse input - ' + err);
          next('faied to parse input');
        } else {
          var initialRevision = {};
          parseInputFormRevisionModel(moduleId, initialRevision, function(err, revision) {
            if (err) {
              ERROR('failed to call parseInputFormRevisionModel - ' + err);
              res.json(_somethingbroke_);
            } else {
              insert.revisions = [];
              insert.revisions.push(revision);
              data.InputForm_Insert(insert, function(err, docs) {
                if (err) {
                  ERROR('failed to call data.InputForm_Insert - ' + err);
                  res.json(_somethingbroke_);
                } else {
                  res.json(200);
                }
              });
            }
          });

        }
      });
    }
  });
};

exports.show = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      //insert
      data.InputForm_FindOne(moduleId, function(err, doc) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else {
          if (!doc || doc.revisions.length === 0) {
            res.json(200, doc);
          } else {
            var last = doc.revisions[doc.revisions.length - 1];
            doc.revisions = [last];
            doc.revisions[0].fields.forEach(function(e) {
              //delete e.filterInput;
              //delete e.validateInput;
              delete e.validateConfig;
            });
            res.json(200, doc);
          }
        }
      });
    }
  });
};

exports.update = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      //insert
      parseInputFormModel(moduleId, req.body, false, function(err, update) {
        if (err) {
          ERROR('failed to parse input - ' + err);
          next('faied to parse input');
        } else {
          data.InputForm_Update(moduleId, update, function(err) {
            if (err) {
              ERROR('failed to call data.InputForm_Update - ' + err);
              res.json(_somethingbroke_);
            } else {
              res.json(200, {
                message: 'updated'
              });
            }
          });
        }
      });
    }
  });
};

exports.live = function(req, res) {
  parseModuleId(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      //insert
      data.InputForm_FindOne(moduleId, function(err, doc) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else {
          if (!doc || doc.revisions.length === 0) {
            res.json(200, doc);
          } else {
            //two revisions: draft + latest live are present
            if (doc.revisions.length == 2) {
              doc.revisions = [doc.revisions[0]]; //remove the draft version
              doc.revisions[0].fields.forEach(function(e) {
                //delete e.filterInput;
                //delete e.validateInput;
                delete e.validateConfig;
              });
            } else {
              doc.revisions = [];
            }
            res.json(200, doc);
          }
        }
      });
    }
  });
};


exports.delete = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      //insert
      data.InputForm_Delete(moduleId, function(err) {
        if (err) {
          ERROR('failed to call data.InputForm_Delete - ' + err);
          res.json(_somethingbroke_);
        } else {
          res.json(200, {
            message: 'deleted'
          });
        }
      });
    }
  });
};

exports.createRevision = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      //insert
      data.InputForm_FindOne(moduleId, function(err, form) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else if (!form) {
          WARN('failed to find form with _id = ' + moduleId);
          res.json(_somethingbroke_);
        } else {
          parseInputFormRevisionModel(moduleId, req.body, function(err, revision) {
            if (err) {
              ERROR('failed to call parseInputFormRevisionModel - ' + err);
              res.json(_somethingbroke_);
            } else {
              data.InputForm_InsertRevision(form._id, revision, function(err) {
                if (err) {
                  ERROR('failed to call data.InputForm_InsertRevision - ' + err);
                  res.json(_somethingbroke_);
                } else {
                  res.json(200, revision);
                }
              });
            }
          });
        }
      });
    }
  });
};

exports.updateDraft = function(req, res) {
  var parseRevisionUpdate = function(revisionId, dateCreated, input, next) {
    if (!input || !input.fields || !Array.isArray(input.fields)) {
      ERROR('invalid input -' + input);
      next('invalid input');
    } else {
      var errors = [];
      var fields = inputforms.getFields();
      var revision = {
        _id: revisionId,
        dateCreated: dateCreated,
        dateUpdated: nowDate(),
        revisionNote: input.revisionNote || '',
        fields: [],
      };
      input.fields.map(function(e, i) {
        if (!e.type || !e.config) {
          WARN('invalid field - ', e);
          errors.push({
            index: i,
            message: 'invalid field',
          });
        } else if (!(e.type in fields)) {
          WARN('invalid field type found - ' + e.type);
          errors.push({
            index: i,
            message: 'non-supported field type',
          });
        } else {
          var model = inputforms.getFieldModel(e.type);
          if (!inputforms.mapFieldModel(model, e.config)) {
            WARN('failed to map field model - ', e);
            errors.push({
              index: i,
              message: 'invalid field model',
            });
          } else {
            if (!inputforms.validateFieldModel(model)) {
              WARN('failed to validate field model - ', e);
              errors.push({
                index: i,
                message: 'invalid field configuration',
              });
            } else {
              revision.fields.push(model);
            }
          }
        }
      });
      if (errors.length > 0) {
        next(null, errors);
      } else {
        next(null, errors, revision);
      }
    }
  };
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      data.InputForm_FindOne(moduleId, function(err, doc) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else if (!doc) {
          ERROR('failed to find form for moduleId = ' + moduleId);
          res.json(_somethingbroke_);
        } else {
          var draftRevision = doc.revisions[doc.revisions.length - 1];
          var revisionId = draftRevision._id;
          var revisionDateCreated = draftRevision.dateCreated;
          parseRevisionUpdate(revisionId, revisionDateCreated, req.body, function(err, validationErrors, revision) {
            if (err) {
              ERROR('failed to exec parseRevisionUpdate - ' + err);
              res.json(_somethingbroke_);
            } else if (validationErrors.length > 0) {
              res.json(200, {
                success: false,
                errors: validationErrors,
              });
            } else {
              data.InputForm_UpdateRevision(moduleId, revisionId, revision, function(err) {
                if (err) {
                  ERROR('failed to call data.InputForm_UpdateRevision - ' + err);
                  res.json(_somethingbroke_);
                } else {
                  res.json(200, {
                    success: true,
                    errors: [],
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

exports.publishDraft = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      data.InputForm_FindOne(moduleId, function(err, doc) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else if (!doc) {
          ERROR('failed to find form for moduleId = ' + moduleId);
          res.json(_somethingbroke_);
        } else if (doc.revisions.length == 0) {
          ERROR('no revision found for moduleId = ' + moduleId);
          res.json(_somethingbroke_);
        } else {
          //grab the last revision
          var revision = doc.revisions[doc.revisions.length - 1];
          //publishing a draft is achieved by cloning the last revision
          //generating a new revision Id
          //and inserting it as a new revision
          //the last revision is always the draft one
          //the one before last is always the live one
          revision._id = generateInputFormRevisionId(moduleId);
          revision.dateCreated = nowDate();
          revision.dateUpdated = nowDate();
          data.InputForm_InsertRevision(moduleId, revision, function(err) {
            if (err) {
              ERROR('failed to call data.InputForm_InsertRevision - ' + err);
              res.json(_somethingbroke_);
            } else {
              res.json(200, revision);
            }
          });
        }
      });
    }
  });
};

exports.showRevision = function(req, res) {
  parseModuleId(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      var revisionId = req.param('revisionid');
      if (!revisionId || !revisionId.startsWith(moduleId)) {
        ERROR('missing parameter: revisionId - ' + revisionId);
        res.json(_somethingbroke_);
      } else {
        data.InputForm_FindRevision(moduleId, revisionId, function(err, revision) {
          if (err) {
            ERROR('failed to call data.InputForm_FindRevision - ' + err);
            res.json(_somethingbroke_);
          } else {
            res.json(200, revision);
          }
        });
      }
    }
  });
};

exports.listRevisions = function(req, res) {
  parseModuleId(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      data.InputForm_FindRevisions(moduleId, function(err, revisions) {
        if (err) {
          ERROR('failed to call data.InputForm_FindOne - ' + err);
          res.json(_somethingbroke_);
        } else {
          res.json(200, revisions);
        }
      });
    }
  });
};

exports.deleteRevision = function(req, res) {
  parseModuleIdAndValidateIsModuleOwner(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId');
      res.json(_somethingbroke_);
    } else {
      var revisionId = req.param('revisionid');
      if (!revisionId || !revisionId.startsWith(moduleId)) {
        ERROR('missing parameter: revisionId - ' + revisionId);
        res.json(_somethingbroke_);
      } else {
        data.InputForm_DeleteRevision(moduleId, revisionId, function(err) {
          if (err) {
            ERROR('failed to call data.InputForm_DeleteRevision - ' + err);
            res.json(_somethingbroke_);
          } else {
            res.json(200);
          }
        });
      }
    }
  });
};

exports.getFieldDefinitions = function(req, res) {
  var fields = inputforms.getFieldDefinitions();
  res.json(200, fields);
};

function savesubmission(instanceid, hostmoduleid, revisionid, isformvalid, fields, entry, next) {
  if (!hostmoduleid || !_.isString(hostmoduleid) || !revisionid || !_.isString(revisionid) || !fields || !entry || !entry.submissionDate || !_.isArray(entry.questions)) {
    ERROR('invalid submission');
    next('invalid submission');
  } else {
    aws.uploadlog(instanceid, hostmoduleid, revisionid, isformvalid, fields, entry, function(err) {
      if (err) {
        ERROR('failed to uploadlog - ' + err);
        next(err);
      } else {
        next();
      }
    });
  }
}

exports.submit = function(req, res) {
  ERROR('no longer supported');
  res.json(_somethingbroke_);
}

exports.submit_v2 = function(req, res) {
  parseModuleId(req, function(err, moduleId) {
    if (err) {
      ERROR('failed to parse ModuleId - ' + err);
      res.json(_somethingbroke_);
    } else {
      var submissions = _.isArray(req.body) ? req.body : [req.body];
      if (submissions.length == 0) {
        ERROR('no user submission found');
        res.json(_somethingbroke_);
      } else {
        data.InputForm_FindOne(moduleId, function(err, form) {
          if (err) {
            ERROR('failed to call InputForm_FindOne - ' + err);
            res.json(_somethingbroke_);
          } else if (!form) {
            ERROR('failed to find form with formId =' + moduleId);
            res.json(_somethingbroke_);
          } else {
            // when returning form errors, only return errors of last submission
            tools.sfold(submissions, [], function(submission, result, next) {
              if (!submission) {
                next(null, result);
              } else {
                var isAnonymous = submission.anon;
                var revisionId = submission.revisionid;
                var userId = req.session.instanceIds[0];
                //validate submitted values against the model.validateInput for this revision
                //generate entry
                var entry = {
                  submissionDate: nowDate(),
                };
                // Get Revision and Validate submission
                data.InputForm_FindRevision(moduleId, revisionId, function(err, revision) {
                  if (err) {
                    ERROR('failed to call data.InputForm_FindRevision - ' + err);
                    next(null, result);
                  } else if (!revision || !submission.fields) {
                    ERROR('failed to find revisioin for revisionId - ' + revisionId);
                    next(null, result);
                  } else if (revision.fields.length !== submission.fields.length) {
                    ERROR('number of field submitted does not match the number of form fields - revision id = ' + revisionId + ', ' + submission.fields);
                    next(null, result);
                  } else {
                    var errors = [];
                    entry.questions = inputforms.validateSubmission(submission.fields, revision, errors);
                    //set validation to true if no errors were found:
                    var isFormValid = errors.length === 0;
                    //if there are any media fields that require an upload, upload files to repository at this point
                    //note: media fields can come in two flavors:
                    //1. if answer.url, then there is no need to upload anything
                    //2. if answer.data and answer.filename is present then content must be uploaded and url generated
                    var mediafiles = entry.questions.filter(function(e) {
                      return e.type === 'MEDIA' && typeof e.answer !== 'string';
                    });

                    //determine if the form should be anonymous or not
                    //does this form allow anonymity? this is decided by the form creator through the cms
                    //if so, has the user requested anonymity for this submission?
                    //if so, set the ID to null. otherwise set it to the first instanceid associated with this user
                    if (form.anon && isAnonymous) {
                      userId = null;
                      savesubmission(userId, moduleId, revisionId, isFormValid, revision.fields, entry, function(err) {
                        if (err) {
                          ERROR('failed to savesubmission - ' + err);
                          next(null, result);
                        } else {
                          next(null, {
                            success: errors.length === 0,
                            errors: errors,
                          });
                        }
                      });
                    } else if (form.multi) {
                      savesubmission(userId, moduleId, revisionId, isFormValid, revision.fields, entry, function(err) {
                        if (err) {
                          ERROR('failed to savesubmission - ' + err);
                          next(null, result);
                        } else {
                          next(null, {
                            success: errors.length === 0,
                            errors: errors,
                          });
                        }
                      });
                    } else {
                      // None Multi submission form
                      data.InputForm_GetEntryCount(moduleId, revisionId, userId, function(err, entryCount) {
                        if (err) {
                          ERROR('failed to call InputForm_GetEntryCount - ' + err);
                          next(null, result);
                        } else if (entryCount) {
                          next(null, {
                            success: false,
                            errors: errors,
                            other_error: 'ALREADY_SUBMITTED',
                          });
                        } else {
                          savesubmission(userId, moduleId, revisionId, isFormValid, revision.fields, entry, function(err) {
                            if (err) {
                              ERROR('failed to savesubmission - ' + err);
                              next(null, result);
                            } else {
                              next(null, {
                                success: errors.length === 0,
                                errors: errors,
                              });
                            }
                          });
                        }
                      });
                    }
                  }
                });
              }
            }, function(err, lastresult) {
              if (err) {
                ERROR('failed to save submissions - ' + err);
                res.json(_somethingbroke_);
              } else {
                res.json(200, lastresult);
              }
            });
          }
        });
      }
    }
  });
};

exports.logsummaries = function(req, res) {
  var moduleid = req.param('moduleid');
  if (!moduleid) {
    ERROR('moduleid is missing');
    res.json(_somethingbroke_);
  } else {
    var skip = parseInt(req.param('skip'));
    skip = isNaN(skip) ? 0 : skip;
    var limit = parseInt(req.param('limit'));
    limit = isNaN(limit) ? 25 : limit;
    data.InputForm_FindLogSummaries(moduleid, skip, limit, function(err, summaries) {
      if (err) {
        ERROR('failed to get log summaries - ' + err);
        res.json(_somethingbroke_);
      } else {
        res.json(200, summaries.map(function(summary) {
          summary.url = config.s3host + '/' + config.s3databucket + summary.url;
          return summary;
        }));
      }
    });
  }
}
