process.env.NODE_ENV = 'tmp';
var config = require(__base + 'config/config.js');

var port = 3002;

module.exports = {
  group: 'tmp',
  port: port,
  url: 'http://localhost:' + port,
  toneId: 'tone-tester',
  phone: '123456789',
  password: '~123456789',
  androidDeviceToken: 'APA91bFs92Pdn5KiQy-9gV3Ip4KWDdREhSRnJJfZITjVxKVjvjfbi7WAikBX5m43HD2J8IVKH_kD8KwhuLUL7dVnspl-I7wMtgzYeagN-65Ytz8REGEhqEm2GeZ8RyeiMXoCj5_000000000000000000000000000',
  sendVerificationSMS: false,
  paypalPersonalTestAccountOneEmail: 'dev-one@withtone.com',
  paypalPersonalTestAccountOnePass: '`123456789',
  paypalPersonalTestAccountTwoEmail: 'dev-two@withtone.com',
  paypalPersonalTestAccountTwoPass: '`123456789',
  googleanalyticstrackercode: 'UA-58359704-2'
};
