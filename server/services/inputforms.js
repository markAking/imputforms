var FIELDS = {};

FIELDS.TEXT = {
  type: 'TEXT',
  name: 'Text',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Value',
      min: 1,
      max: 256,
    },
    min: {
      required: true,
      input: 'text',
      description: 'Minimum Character Length',
      value: 1,
    },
    max: {
      input: 'text',
      description: 'Maximum Character Length',
      value: null,
    }
  },
  validateConfig: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var min = parseInt(this.config.min.value);
    var max = parseInt(this.config.max.value);
    max = isNaN(max) ? Infinity : max;

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && (!isNaN(min) && !isNaN(max) && min >= 0 && max >= 0 && min <= max)
          ;
  },
  /*
  validateConfig2: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var min = parseInt(this.config.min.value);
    var max = parseInt(this.config.max.value);
    max = isNaN(max) ? Infinity : max;

    var result = {
      success: true,
      errors: [],
    };

    if (typeof r === 'boolean') {
      result.success = false;
      result.errors.push({
        name: 'required',
        message: 'not a boolean'
      });
    } else if (typeof t === 'string' && t_min <= t.length && t.length <= t_max) {
      result.success = false;
      result.errors.push({
        name: 'title',
        message: 'Invalid title type or length',
      });
    } else if (typeof d === 'string' && d_min <= d.length && d.length <= d_max) {
      result.success = false;
      result.errors.push({
        name: 'description',
        message: 'Invalid description type or length',
      });
    } else if (typeof e === 'string' && e_min <= e.length && e.length <= e_max) {
      result.success = false;
      result.errors.push({
        name: 'error',
        message: 'Invalid error type or length',
      });
    } else if (!isNaN(min)) { 
      result.success = false;
      result.errors.push({
        name: 'min',
        message: 'Min must be a positive whole number',
      });
    } else if (!isNaN(max)) { 
      result.success = false;
      result.errors.push({
        name: 'max',
        message: 'Max must be a positive whole number',
      });
    } else if (min >= 0 && max >= 0 && min <= max) {
      result.success = false;
      result.errors.push({
        name: 'max',
        message: 'Max must be larger than min',
      });
    }
    return result;
  },
  */
  validateInput: function(input) {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };

    var min = this.config.min.value;
    var max = this.config.max.value != undefined ? this.config.max.value : Infinity;
    var required = this.config.required.value;

    if (!required) {
      return isEmptyString(input) 
        ? true 
        : typeof input === 'string' && min <= input.length && input.length <= max
        ;
    } else {
      return typeof input === 'string' && min <= input.length && input.length <= max;
    }
  },
  filterInput: function(input) {
    return input != undefined ? input : '';
  },
};

FIELDS.URL = {
  type: 'URL',
  name: 'URL',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid URL',
      min: 1,
      max: 256,
    },
    pattern: {
      input: 'text',
      description: 'Custom Regular Expression',
      value: '',
    }
  },
  validateConfig: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var pattern = this.config.pattern.value;

    var pattern_valid = true;
    if (pattern.length > 0) {
      try {
        new RegExp(pattern);
      } catch (ex) {
        pattern_valid = false;
      }
    }

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && pattern_valid
          ;
  },
  validateInput: function(input) {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    var required = this.config.required.value;
    var pattern = this.config.pattern.value;
    //if not required, and empty string, then return true
    if (!required && isEmptyString(input)) { return true; }
    return URL_REGEX.test(input) && (!isEmptyString(pattern) ? new RegExp(pattern).test(input) : true);
  },
  filterInput: function(input) {
    return input != undefined && typeof input === 'string' ? input.trim() : '';
  },
};

FIELDS.EMAIL = {
  type: 'EMAIL',
  name: 'Email',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Email',
      min: 1,
      max: 256,
    },
    pattern: {
      input: 'text',
      description: 'Custom Regular Expression',
      value: '',
    }
  },
  validateConfig: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var pattern = this.config.pattern.value;

    var pattern_valid = true;
    if (pattern.length > 0) {
      try {
        new RegExp(pattern);
      } catch (ex) {
        pattern_valid = false;
      }
    }

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && pattern_valid
          ;
  },
  validateInput: function(input) {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var URL_REGEX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    var required = this.config.required.value;
    var pattern = this.config.pattern.value;
    //if not required, and empty string, then return true
    if (!required && isEmptyString(input)) { return true; }
    return URL_REGEX.test(input) && (!isEmptyString(pattern) ? new RegExp(pattern).test(input) : true);
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
  },
  filterInput: function(input) {
    return input != undefined && typeof input === 'string' ? input.trim() : '';
  },
};

FIELDS.NUMBER = {
  type: 'NUMBER',
  name: 'Number',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Value',
      min: 1,
      max: 256,
    },
    quantization: {
      input: 'text',
      description: 'Round Factor',
      value: 0,
      min: 0,
    },
    precision: {
      input: 'text',
      description: 'Precision Digit Number',
      value: 0,
      min: 0,
      max: 10,
    },
    min: {
      input: 'text',
      description: 'Minimum',
      value: null,
    },
    max: {
      input: 'text',
      description: 'Maximum',
      value: null,
    }
  },
  validateConfig: function() {
    var isNullOrEmpty = function(value) { return value == undefined || value === ''; }
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };
    var isIntegerOrInfinite = function(value) { return isInteger(value) || Math.abs(value) == Infinity; };

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var precision = parseFloat(this.config.precision.value);
    var precision_min = this.config.precision.min;
    var precision_max = this.config.precision.max;
    var quantization = parseFloat(this.config.quantization.value);
    var quantization_min = this.config.quantization.min;
    var quantization_max = this.config.quantization.max;

    var min = isNullOrEmpty(this.config.min.value) ? -Infinity : parseFloat(this.config.min.value);
    var max = isNullOrEmpty(this.config.max.value) ? Infinity : parseFloat(this.config.max.value);

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && (isInteger(precision) && precision >= precision_min && precision <= precision_max) 
          && (isInteger(quantization) && quantization >= quantization_min) 
          && (isIntegerOrInfinite(min) && isIntegerOrInfinite(max))
          && ( (min != -Infinity
                  ? (max != Infinity
                      ? min <= max
                      : true
                    )
                  : true
                )
              )
          ;
  },
  validateInput: function(input) {
    var isNullOrEmpty = function(value) { return value == undefined || value === ''; }
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };
    var isFloatWithPrecision = function(value, precision) { 
      var split;
      return !isNaN(value) && (split = value.toString().split('\.')).length == 2 && split[1].length == precision;
    };

    var precision = parseInt(this.config.precision.value);
    var min = !isNullOrEmpty(this.config.min.value) ? parseInt(this.config.min.value) : -Infinity;
    var max = !isNullOrEmpty(this.config.max.value) ? parseInt(this.config.max.value) : Infinity;
    var required = this.config.required.value;

    if (!required) {
      if (input == '') { return true; }
      if (precision === 0) {
        return isInteger(input) && min <= input && input <= max;
      } else {
        return isFloatWithPrecision(input, precision) && min <= input && input <= max;
      }
    } else {
      if (precision === 0) {
        return isInteger(input) && min <= input && input <= max;
      } else {
        return isFloatWithPrecision(input, precision) && min <= input && input <= max;
      }
    }
  },
  filterInput: function(input) {
    var precision = this.config.precision.value;
    var quantization = this.config.quantization.value;
    var min = this.config.min.value;
    var max = this.config.max.value;
    var required = this.config.required.value;

    if (!input) { 
      return ''; 
    } else {
      var integer = precision === 0;
      var number = integer ? parseInt(input) : parseFloat(input);
      if (isNaN(number)) {
        return ''; //return null when value is not a number
      } else if (integer) {
        if (quantization === 0) {
          return number; //return integer number when quantization is 0
        } else {
          return number - number % Math.ceil(quantization); //return quantized number otherwise
        }
      } else {
        if (quantization === 0) {
          return parseFloat(number.toFixed(precision)); //round to required precision
        } else {
          return parseFloat((number - Math.round(number % quantization)).toFixed(precision)); //round to required precision
        }
      }
    }
  }
};

FIELDS.DATETIME = {
  type: 'DATETIME',
  name: 'Date/Time',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Date/Time Value',
      min: 1,
      max: 256,
    },
    datetime: {
      input: 'text',
      description: 'Default Date',
      value: '',
    },
    includeDate: {
      input: 'switch',
      description: 'Include Date',
      value: true,
    },
    includeTime: {
      input: 'switch',
      description: 'Include Time',
      value: true,
    },
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isValidOrEmptyDate = function(value) {
      if (isEmptyString(value)) { return true; }
      var d = new Date(value);
      return d.toString() !== 'Invalid Date';
    };

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;
    var datetime = this.config.datetime.value;
    var includeDate = this.config.includeDate.value;
    var includeTime = this.config.includeTime.value;

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && (isValidOrEmptyDate(datetime))
          && (typeof includeDate === 'boolean')
          && (typeof includeTime === 'boolean')
          && !(includeDate === false && includeTime === false)
          ;
  },
  validateInput: function(input) {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isValidDate = function(value) {
      var d = new Date(value);
      return d.toString() !== 'Invalid Date';
    };
    var required = this.config.required.value;

    if (!required) { return input ? isValidDate(input) : true; }
    return isValidDate(input);
  },
  filterInput: function(input) {
    var isNullOrEmptyString = function(value) { 
      return value == undefined || (typeof value === 'string' && value.length === 0);
    };
    var isValidDate = function(value) {
      var d = new Date(value);
      return d.toString() !== 'Invalid Date';
    };
    var includeDate = this.config.includeDate.value;
    var includeTime = this.config.includeTime.value;
    if (!includeDate) {
      return !isNullOrEmptyString(input) ? input : '';
    } else {
      if (!includeTime) {
        return isNullOrEmptyString(input) || !isValidDate(input)
                ? '' 
                : new Date(new Date(input).toDateString()).toISOString().substring(0, 10) + "T00:00:00.000Z";
      } else {
        return !isNullOrEmptyString(input) ? input : '';
      }
    }
  }
};

FIELDS.LOCATION = {
  type: 'LOCATION',
  name: 'Location',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Value',
      min: 1,
      max: 256,
    },
  },
  validateConfig: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          ;
  },
  validateInput: function(input) {
    var required = this.config.required.value;
    if (!required && !input) {
      return true;
    } else if (required && !input) {
      return false;
    } else {
      var lat = input.latitude;
      var lon = input.longitude;
      var alt = input.altitude;
      var pre = input.precision;
     
      var latvalid = !isNaN(lat) && -90.0 <= lat && lat <= 90.0;
      var lonvalid = !isNaN(lon) && -180.0 <= lon && lon <= 180.0;
      var altvalid = !isNaN(alt);
      var prevalid = !isNaN(alt) && 0.0 <= pre && pre <= 1.0;
      return latvalid && lonvalid && altvalid && prevalid;
    }
  },
  filterInput: function(input) {
    var target = null;
    if (input) {
      try {
        var o = JSON.parse(JSON.stringify(input));
        if (Object.prototype.toString.call(o) === '[object Object]') {
          var lat = parseFloat(o.latitude); 
          var lon = parseFloat(o.longitude); 
          var alt = parseFloat(o.altitude); 
          var pre = parseFloat(o.precision); 
          if (!isNaN(lat) && !isNaN(lon)) {
            target = {
              latitude: lat,
              longitude: lon,
              altitude: !isNaN(alt) ? alt : 0.0,
              precision: !isNaN(pre) ? pre : 0.0,
            };
          }
        }
      } catch (ex) {
        //do nothing
      } 
    }
    return target;
  },
};

FIELDS.BREAK = {
  type: 'BREAK',
  name: 'Page Break',
  config: {
    title: {
      required: true,
      input: 'text',
      description: 'Page Label',
      value: '',
      min: 1,
      max: 256,
    },
    jumpToPage: {
      required: false,
      input: 'select',
      description: 'Jump to Page',
      value: '',
    },
  },
  validateConfig: function() {
    var v = this.config.title.value;
    return typeof v === 'string' && v.length >= 1 && v.length <= 256;
  },
  validateInput: function(input) {
    return true;
  },
  filterInput: function(input) {
    return input;
  },
};

FIELDS.HEADER = {
  type: 'HEADER',
  name: 'Page Header',
  config: {
    title: {
      required: true,
      input: 'text',
      description: 'Header Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Header Description',
      value: '',
      min: 0,
      max: 256,
    },
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };

    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;

    return   (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          ;
  },
  validateInput: function(input) {
    return true;
  },
  filterInput: function(input) {
    return input;
  },
};

FIELDS.SWITCH = {
  type: 'SWITCH',
  name: 'Switch',
  config: {
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };

    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;

    return   (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          ;
  },
  validateInput: function(input) {
    return typeof input === 'boolean';
  },
  filterInput: function(input) {
    return input;
  },
};

FIELDS.SCALE = {
  type: 'SCALE',
  name: 'Scale',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Value',
      min: 1,
      max: 256,
    },
    step: {
      input: 'text',
      description: 'Step',
      value: 1,
      min: 1,
    },
    min: {
      input: 'text',
      description: 'Minimum',
      value: 1,
      min: -1e9,
      max: 1e9,
    },
    max: {
      input: 'text',
      description: 'Maximum',
      value: 100,
      min: -1e9,
      max: 1e9,
    }
  },
  validateConfig: function() {
    var isInteger = function(value) { return typeof value === "number" && !isNaN(value) && isFinite(value) && Math.floor(value) === value; };

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;

    var step = parseFloat(this.config.step.value);
    var step_min = this.config.step.min;

    var min = parseFloat(this.config.min.value);
    var min_min = this.config.min.min;
    var min_max = this.config.min.max;

    var max = parseFloat(this.config.max.value);
    var max_min = this.config.max.min;
    var max_max = this.config.max.max;

    return typeof r === 'boolean'
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && (isInteger(step) && step >= step_min) 
          && (isInteger(min) && min >= min_min && min <= min_max) 
          && (isInteger(max) && max >= max_min && max <= max_max) 
          && (min <= max)
          ;
  },
  validateInput: function(input) {
    var required = this.config.required.value;
    var step = parseInt(this.config.step.value);
    var min = parseInt(this.config.min.value);
    var max = parseInt(this.config.max.value);

    if (!required) {
      if (input == undefined) {
        return true;
      } else {
        return min <= input && input <= max && input % step == 0;
      }
    } else {
        return min <= input && input <= max && input % step == 0;
    }
  },
  filterInput: function(input) {
    var parseStringToNumber = function(val) {
      var target = (val.indexOf('\.') != -1) ? parseFloat(val) : parseInt(val);
      return !isNaN(target) ? target : null;
    };
    var result = null;
    if (input != undefined) {
      if (typeof input === 'string') {
        result = parseStringToNumber(input);
      } else if (typeof input === 'number' && !isNaN(input)) {
        result = input;
      }
    }
    return result;
  }
};

FIELDS.CHECKBOXES = {
  type: 'CHECKBOXES',
  name: 'Checkboxes',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    choices: {
      input: 'editablelist',
      value: [],
    },
    preselected: {
      input: 'editablelistpreselected',
      target: 'choices',
      value: [],
    },
    other: {
      input: 'switch',
      description: 'Allow Other option',
      value: false,
    }
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };
    var isIntegerOrInfinite = function(value) { return isInteger(value) || Math.abs(value) == Infinity; };
    var URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var other = this.config.other.value;
    var choices = this.config.choices.value;
    var preselected = this.config.preselected.value;

    var areChoicesValid = false;
    var arePreselectedValid = false;
    var choiceValues = [];
    if (choices && Array.isArray(choices) && choices.length > 0) {
      areChoicesValid = choices.filter(function(e) {
                            if (!e || !e.value || typeof e.value !== 'string') {
                              return false;
                            } else if (!e.url) {
                              return true;
                            } else {
                              return URL_REGEX.test(e.url);
                            }
                          }).length === choices.length;

      choiceValues = choices.map(function(e) { return e.value; });
      arePreselectedValid = preselected
                              && Array.isArray(preselected) && preselected.filter(function(e) {
                              return e && choiceValues.indexOf(e) != -1;
                            }).length === preselected.length;
    }

    return (typeof r === 'boolean')
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof other === 'boolean')
          && areChoicesValid
          && arePreselectedValid
          ;

  },
  validateInput: function(input) {
    var required = this.config.required.value;
    var other = this.config.other.value;
    var choiceValues = this.config.choices.value.map(function(e) { return e.value; });
    if (!input || !Array.isArray(input) || input.length === 0) {
      return !required;
    } else if (!other) {
      return input.filter(function(e) { return e && typeof e === 'string' && choiceValues.indexOf(e) > -1; }).length === input.length;
    } else {
      var choices = input.slice(0, input.length - 1);
      var last = input[input.length - 1];
      return choices.filter(function(e) { return e && typeof e === 'string' && choiceValues.indexOf(e) > -1; }).length === choices.length
             && typeof last === 'string';
    }
  },
  filterInput: function(input) {
    if (!input || !Array.isArray(input)) {
      return null;
    } else {
      return input;
    }
  },
};

FIELDS.SELECT = {
  type: 'SELECT',
  name: 'Select',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    choices: {
      input: 'editablelist',
      value: [],
    },
    preselected: {
      input: 'editablelistvalue',
      target: 'choices',
      value: '',
    },
    other: {
      input: 'switch',
      description: 'Allow Other option',
      value: false,
    }
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };
    var isIntegerOrInfinite = function(value) { return isInteger(value) || Math.abs(value) == Infinity; };
    var URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var other = this.config.other.value;
    var choices = this.config.choices.value;
    var preselected = this.config.preselected.value;

    var areChoicesValid = false;
    var isPreselectedValid = false;
    var choiceValues = [];
    if (choices && Array.isArray(choices) && choices.length > 0) {
      areChoicesValid = choices.filter(function(e) {
                            if (!e || !e.value || typeof e.value !== 'string') {
                              return false;
                            } else if (!e.url) {
                              return true;
                            } else {
                              return URL_REGEX.test(e.url);
                            }
                          }).length === choices.length;

      choiceValues = choices.map(function(e) { return e.value; });
      isPreselectedValid = preselected
                            ? (typeof preselected === 'string' && choiceValues.indexOf(preselected) != -1)
                            : true;
    }

    return (typeof r === 'boolean')
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof other === 'boolean')
          && areChoicesValid
          && isPreselectedValid
          ;
  },
  validateInput: function(input) {
    var required = this.config.required.value;
    var other = this.config.other.value;
    var choiceValues = this.config.choices.value.map(function(e) { return e.value; });
    if (input == undefined) {
      return !required;
    } else if (typeof input === 'string') {
      if (!other) {
        return choiceValues.indexOf(input) > -1;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },
  filterInput: function(input) {
    if (!input) {
      return null;
    } else {
      return input;
    }
  },
};

FIELDS.RADIO = {
  type: 'RADIO',
  name: 'Radio',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    choices: {
      input: 'editablelist',
      value: [],
    },
    preselected: {
      input: 'editablelistvalue',
      target: 'choices',
      value: '',
    },
    other: {
      input: 'switch',
      description: 'Allow Other option',
      value: false,
    }
  },
  validateConfig: function() {
    var isEmptyString = function(value) { return typeof value === 'string' && value.length === 0; };
    var isInteger = function(value) { return typeof value === "number" && isFinite(value) && Math.floor(value) === value; };
    var isIntegerOrInfinite = function(value) { return isInteger(value) || Math.abs(value) == Infinity; };
    var URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var other = this.config.other.value;
    var choices = this.config.choices.value;
    var preselected = this.config.preselected.value;

    var areChoicesValid = false;
    var isPreselectedValid = false;
    var choiceValues = [];
    if (choices && Array.isArray(choices) && choices.length > 0) {
      areChoicesValid = choices.filter(function(e) {
                            if (!e || !e.value || typeof e.value !== 'string') {
                              return false;
                            } else if (!e.url) {
                              return true;
                            } else {
                              return URL_REGEX.test(e.url);
                            }
                          }).length === choices.length;

      choiceValues = choices.map(function(e) { return e.value; });
      isPreselectedValid = preselected
                            ? (typeof preselected === 'string' && choiceValues.indexOf(preselected) != -1)
                            : true;
    }

    return (typeof r === 'boolean')
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (typeof other === 'boolean')
          && areChoicesValid
          && isPreselectedValid
          ;
  },
  validateInput: function(input) {
    var required = this.config.required.value;
    var other = this.config.other.value;
    var choiceValues = this.config.choices.value.map(function(e) { return e.value; });
    if (input == undefined) {
      return !required;
    } else if (typeof input === 'string') {
      if (!other) {
        return choiceValues.indexOf(input) > -1;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },
  filterInput: function(input) {
    if (!input) {
      return null;
    } else {
      return input;
    }
  },
};

FIELDS.MEDIA = {
  type: 'MEDIA',
  name: 'Media',
  config: {
    required: {
      input: 'switch',
      description: 'Make Required Field',
      value: false,
    },
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    error: {
      input: 'text',
      description: 'Custom Error Text',
      value: 'Invalid Value',
      min: 1,
      max: 256,
    },
    mediatype: {
      input: 'select',
      description: 'Media Type',
      options: [ 'Image', 'Video' ],
      value: 'Image',
    },
    minBytes: {
      input: 'text',
      description: 'Minimum Size (Bytes)',
      value: 1,
    },
    maxBytes: {
      input: 'text',
      description: 'Maximum Size (Bytes) 25 MB max',
      value: 1e7, //10MB
    },
  },
  validateConfig: function() {
    var r = this.config.required.value;
    var t = this.config.title.value;
    var t_min = this.config.title.min;
    var t_max = this.config.title.max;
    var d = this.config.description.value;
    var d_min = this.config.description.min;
    var d_max = this.config.description.max;
    var e = this.config.error.value;
    var e_min = this.config.error.min;
    var e_max = this.config.error.max;

    var mediatype = this.config.mediatype.value;
    var mediatype_options = this.config.mediatype.options;

    var minBytes = parseInt(this.config.minBytes.value);
    var maxBytes = parseInt(this.config.maxBytes.value);

    var MAX_BYTES = 1e9; //1GB

    return (typeof r === 'boolean')
          && (typeof t === 'string' && t_min <= t.length && t.length <= t_max)
          && (typeof e === 'string' && e_min <= e.length && e.length <= e_max)
          && (typeof d === 'string' && d_min <= d.length && d.length <= d_max)
          && (!isNaN(minBytes) && minBytes >= 1 && minBytes <= MAX_BYTES)
          && (!isNaN(maxBytes) && maxBytes >= minBytes && maxBytes <= MAX_BYTES)
          && (typeof mediatype === 'string' && mediatype_options.indexOf(mediatype) > -1)
          ;

  },
  validateInput: function(input) {
    var isValidExtension = function(filename) {
      if (!filename) {
        return false;
      } else {
        var lastIndex = filename.toLowerCase().lastIndexOf('\.');
        if (lastIndex == -1) {
          return false;
        } else {
          var extension = filename.substring(lastIndex + 1);
          return /^[a-z0-9]+$/i.test(extension);
        }
      }
    };
    var isDataLengthWithinRange = function(data, min, max) {
      var len = -1;
      if (data && data.length) {
        try {
          var buffer = new Buffer(data, 'base64');
          len = buffer.length;
        } catch (ex) {}
      }
      return min <= len && len <= max;
    };
    var isValidURL = function(url) {
      var URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;
      return URL_REGEX.test(url);
    };
    var required = this.config.required.value;
    var min = this.config.minBytes.value;
    var max = this.config.maxBytes.value;
    
    if (!input) { 
      return !required;
    } else if (typeof input === 'string') {
      return isValidURL(input);
    } else {
      return isDataLengthWithinRange(input.data, min, max) 
            && isValidExtension(input.filename);
            ;
    }
  },
  filterInput: function(input) {
    var target = null;
    if (input && Object.prototype.toString.call(input) === '[object Object]') { 
      target = {
        filename: input.filename || '',
        data: input.data || '',
      };
    } else if (typeof input === 'string') { 
      target = input.trim();
    }
    return target;
  },
};

FIELDS.NAV = {
  type: 'NAV',
  name: 'Page Navigation',
  config: {
    title: {
      required: true,
      input: 'text',
      description: 'Question Title',
      value: '',
      min: 1,
      max: 256,
    },
    description: {
      input: 'text',
      description: 'Help Text',
      value: '',
      min: 0,
      max: 256,
    },
    pages: {
      input: 'pagenav',
      description: 'Choose Page Breaks',
      value: [],
    },
  },
  validateConfig: function() {
    var t = this.config.title.value;
    var d = this.config.description.value;

    return (typeof t === 'string' && 1 <= t.length && t.length <= 256)
          && (typeof d === 'string' && 0 <= d.length && d.length <= 256)
          ;
  },
  validateInput: function(input) {
    return true;
  },
  filterInput: function(input) {
    return input;
  },
};

var clone = function(obj) {
  var result = {};
  if (obj) {
    Object.keys(obj).forEach(function(k) {
      if (obj.hasOwnProperty(k)) {
        var val = obj[k];
        var t = typeof val;
        if (val != undefined && t === 'object') {
          result[k] = Array.isArray(val) ? val : clone(val);
        } else if (t === 'function') {
          result[k] = val.toString();
        } else {
          result[k] = val;
        }
      }
    });
  }
  return result;
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
    ERROR('failed to convert string to function -' + ex);
  }
  return target;
};

var getFields = function() {
  return FIELDS;
};

var getFieldDefinitions = function() {
  return JSON.parse(JSON.stringify(FIELDS));
};

var getFieldModel = function(modelName) {
  return modelName in FIELDS ? clone(FIELDS[modelName]) : null;
};

var mapFieldModel = function(model, data) {
  var result = false;
  if (!model || !model.config || !data) {
    ERROR('invalid arguments model = ' + model + ', data' + data);
  } else {
    //map config properties
    result = true;
    Object.keys(model.config).forEach(function(k) {
      if (!(k in data)) {
        ERROR('the following property is missing - ' + k);
        result = false;
      } else {
        var e = model.config[k];
        e.value = data[k];
      }
    });
  }
  return result;
};

var validateFieldModel = function(model) {
  var target = false;
  if (!model || !model.validateConfig) {
    ERROR('invalid model = ', model);
  } else {
    var validate = parseFunction(model.validateConfig);
    if (!validate) {
      ERROR('failed to parse validateConfig Function - ');
    } else {
      var obj = JSON.parse(JSON.stringify(model));
      obj.validate = validate;
      target = obj.validate();
    }
  }
  return target;
};

var validateFieldInput = function(input, model) {
  var target = false;
  if (!model || !model.validateInput) {
    ERROR('invalid model = ', model);
  } else {
    var validate = parseFunction(model.validateInput);
    if (!validate) {
      ERROR('failed to parse validateInput Function - ');
    } else {
      model.validateInput = validate;
      target = model.validateInput(input);
    }
  }
  return target;
};

var filterFieldInput = function(input, model) {
  var target = null;
  if (!model || !model.filterInput) {
    ERROR('invalid model = ', model);
  } else {
    var filter = parseFunction(model.filterInput);
    if (!filter) {
      ERROR('failed to parse filterInput Function - ');
    } else {
      var copy = JSON.parse(JSON.stringify(model));
      copy.filterInput = filter;
      target = copy.filterInput(input);
    }
  }
  return target;
};

var validateSubmission = function(submission, revision, errors) {
  var mapped = revision.fields.map(function(model, i) {
    //1. filter input
    var unfiltered = submission[i];
    var input = filterFieldInput(unfiltered, model);
    return {
      input: input, 
      model: model,
    };
  });

  var findBreakIndex = function findBreakIndex(v, list){
    var index = -1;
    list.forEach(function(x, i) {
      if (x.model.type === 'BREAK' && x.model.config.title.value === v) {
        index = i;
      }
    });
    return index;
  };

  var target = [];
  var breakIndex = -1;
  (function walk(i) {
    i = i || 0;
    if (i < mapped.length) {
      var e = mapped[i];
      var t = e.model.type;
      var v = e.input;
      if (t === 'NAV') {
        //determine if the nav break exists
        breakIndex = findBreakIndex(v, mapped);

      } else if (t === 'BREAK' && e.model.config.jumpToPage.value) {
        //determine if the nav break exists
        breakIndex = findBreakIndex(e.model.config.jumpToPage.value, mapped);
      } else {
        //do nothing
      }
      //console.log(breakIndex)
      //add current
      target.push({
        e: mapped[i],
        originalIndex: i,
        breakIndex: breakIndex
      });
      //continue to the next element
      walk(i + 1);
    } else {
      return;
    }
  }());

  //run validation on newly created array based on branch
  var questions = target.map(function(f, i) {
    var model = f.e.model;
    var unfiltered = f.e.input;
    var originalIndex = f.originalIndex;
    //1. filter input
    var input = filterFieldInput(unfiltered, model);
    //2. validate input:
    if(f.breakIndex == -1 && i > f.breakIndex){
      if (!validateFieldInput(input, model)) {
        WARN('invalid input = "' + input + '" for field = ' + model.type);
        errors.push({
          name: model.config.title.value,
          index: originalIndex,
          message: model.config.error.value || 'invalid input',
        });
      }
    }
    
    return {
      type: model.type,
      question: model.config.title.value.question,
      answer: input,
    };
  });
  return questions;
};

module.exports = {
  parseFunction: parseFunction,
  getFields: getFields,
  getFieldModel: getFieldModel,
  mapFieldModel: mapFieldModel,
  validateFieldModel: validateFieldModel,
  validateFieldInput: validateFieldInput,
  filterFieldInput: filterFieldInput,
  getFieldDefinitions: getFieldDefinitions,
  validateSubmission: validateSubmission,
};
