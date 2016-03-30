'use strict';
var Promise = require('bluebird'),
    amqp = require('amqp10'),
    rpc = require('../lib'),
    errors = require('../lib/errors'),
    config = require('./config'),
    expect = require('chai').expect;

function TestFixture() {}
TestFixture.prototype.setup = function() {
  if (!!this.client) delete this.client;
  this.client = new amqp.Client();

  var self = this;
  return this.client.connect(config.address)
    .then(function() { return self.client.createReceiver('rpc.response'); })
    .then(function(receiver) { self.receiver = receiver; });
};

TestFixture.prototype.teardown = function() {
  var self = this;
  return this.client.disconnect()
    .then(function() {
      delete self.client;
      delete self.receiver;
    });
};

var test = new TestFixture();
describe('server', function() {

describe('errors', function() {
  before(function() { amqp.use(rpc()); });
  beforeEach(function() { return test.setup(); });
  afterEach(function() { return test.teardown(); });

  it('should throw an error when trying to bind a duplicate method', function() {
   return test.client.createRpcServer('rpc.request')
      .then(function(server) {
        server.bind('testMethod', function() {});
        expect(function() {
          server.bind('testMethod', function() {});
        }).to.throw('Duplicate method bound: testMethod');
      });
  });

  it('should return an error if request body is not an object', function(done) {
    test.receiver.on('message', function(m) {
      expect(m.body).to.exist;
      expect(m.body).to.have.key('error');
      var error = m.body.error;
      expect(error.code).to.eql(errors.ParseError);
      expect(error.message).to.eql('Unexpected token i');
      done();
    });

    return Promise.all([
      test.client.createRpcServer('rpc.request'),
      test.client.createSender('rpc.request')
    ])
    .spread(function(server, sender) {
      return sender.send('invalid message', {
        properties: { replyTo: 'rpc.response' }
      });
    });
  });

  it('should return an error if no method was provided', function(done) {
    test.receiver.on('message', function(m) {
      expect(m.body).to.exist;
      expect(m.body).to.have.key('error');
      var error = m.body.error;
      expect(error.code).to.eql(errors.InvalidRequest);
      expect(error.message).to.eql('Missing required property: method');
      done();
    });

    return Promise.all([
      test.client.createRpcServer('rpc.request'),
      test.client.createSender('rpc.request')
    ])
    .spread(function(server, sender) {
      return sender.send({ mthd: 'testMethod' }, {
        properties: { replyTo: 'rpc.response' }
      });
    });
  });

}); // errors

describe('basic behavior', function() {
  before(function() { amqp.use(rpc()); });
  beforeEach(function() { return test.setup(); });
  afterEach(function() { return test.teardown(); });

  it('should allow binding a method to an rpc server', function(done) {
   return test.client.createRpcServer('rpc.request')
      .then(function(server) {
        server.bind('testMethod', function() { done(); });
        return test.client.createSender('rpc.request');
      })
      .then(function(sender) {
        return sender.send({ method: 'testMethod' }, {
          properties: { replyTo: 'rpc.response' }
        });
      });
  });
}); // basic behavior

}); // server
