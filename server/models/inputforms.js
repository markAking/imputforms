'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require(__base + 'config/config.js');
var stools = require(__base + 'config/stools.js');

var InputFormSchema = new Schema({
  //id = moduleId
  _id: {
    type: String,
    required: 'inputForm _id is required',
  },
  title: String,
  description: String,
  backgroundImageUrl: String,
  submitSuccessTitle: String,
  submitSuccessDescription: String,
  submitErrorMessage: String,
  published: Boolean,
  multi: Boolean,
  anon: Boolean,
  publicationSchedule: [ InputFormPublicationEventSchema ],
  revisions: [ InputFormRevisionSchema ],
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
});

var InputFormRevisionSchema = new Schema({
  //[inputFormId]_[timestamp]
  _id: {
    type: String,
    required: 'revision _id is required',
  },
  revisionNote: String,
  draft: Boolean,
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUpdated: {
    type: Date,
    default: Date.now,
  },
  fields: [ InputFormFieldSchema ],
});

var InputFormFieldSchema = new Schema({
  //_id is objectId
  type: {
    type: String,
    required: 'type is required',
  },
  name: {
    type: String,
    required: 'name is required',
  },
  config: Schema.Types.Mixed,
});

var InputFormPublicationEventSchema = new Schema({
  //_id is objectId
  startDate: {
    type: Date,
    required: 'startDate is required',
  },
  endDate: {
    type: Date,
    required: 'startDate is required',
  },
  eventNote: String,
});

//set indexes
//InputFormSchema.index({ moduleId: 1, revisionId: 1}, { unique: true }); 
InputFormSchema.set('autoIndex', config.autoIndex);
InputFormRevisionSchema.set('autoIndex', config.autoIndex);
InputFormFieldSchema.set('autoIndex', config.autoIndex);
InputFormPublicationEventSchema.set('autoIndex', config.autoIndex);

//set mongoose models
mongoose.model('InputForm', InputFormSchema);
mongoose.model('InputFormRevision', InputFormSchema);
mongoose.model('InputFormField', InputFormFieldSchema);
mongoose.model('InputFormPublicationEvent', InputFormPublicationEventSchema);

