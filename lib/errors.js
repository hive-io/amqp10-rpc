'use strict';
var util = require('util'),
    errors = module.exports = {};

/**
 * The base error all amqp10-rpc Errors inherit from.
 *
 * @constructor
 * @alias Error
 */
errors.BaseError = function() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'AmqpRpcError';

  this.message = tmp.message;
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, this.constructor);
};
util.inherits(errors.BaseError, Error);

/**
 * An error thrown when an attempt to bind a duplicate method is made.
 *
 * @param method the method bound to the server
 * @extends BaseError
 * @constructor
 */
errors.DuplicateMethodError = function(method) {
  errors.BaseError.call(this, 'Duplicate method bound: ' + method);
  this.name = 'AmqpRpcDuplicateMethodError';
};
util.inherits(errors.DuplicateMethodError, errors.BaseError);

/**
 * An error thrown when an attempt to bind a method with an invalid name
 *
 * @param method the method bound to the server
 * @extends BaseError
 * @constructor
 */
errors.InvalidMethodNameError = function(name) {
  errors.BaseError.call(this, 'Invalid method name: ' + name);
  this.name = 'AmqpRpcInvalidMethodNameError';
};
util.inherits(errors.InvalidMethodNameError, errors.BaseError);

/**
 * An error thrown when an attempt to bind a method with an invalid definition
 *
 * @param method the method bound to the server
 * @extends BaseError
 * @constructor
 */
errors.InvalidMethodDefinitionError = function(message) {
  errors.BaseError.call(this, 'Invalid method definiton: ' + message);
  this.name = 'AmqpRpcInvalidMethodDefinitionError';
};
util.inherits(errors.InvalidMethodDefinitionError, errors.BaseError);

/**
 * An error thrown when an attempt to bind a method with an invalid validation definition
 *
 * @param method the method bound to the server
 * @extends BaseError
 * @constructor
 */
errors.InvalidValidationDefinitionError = function(message) {
  errors.BaseError.call(this, 'Invalid validation definiton: ' + message);
  this.name = 'AmqpRpcInvalidValidationDefinitionError';
};
util.inherits(errors.InvalidValidationDefinitionError, errors.BaseError);

/**
 * An error thrown when an rpc request has timed out
 *
 * @extends BaseError
 * @constructor
 */
errors.RequestTimeoutError = function(message) {
  errors.BaseError.call(this, message || 'Request timed out');
  this.name = 'AmqpRpcRequestTimeoutError';
};
util.inherits(errors.RequestTimeoutError, errors.BaseError);

/**
 * An error thrown when an invalid rpc request has been made
 *
 * @extends BaseError
 * @constructor
 */
errors.BadRequestError = function(message) {
  errors.BaseError.call(this, message || 'Bad request');
  this.name = 'AmqpRpcBadRequestError';
};
util.inherits(errors.BadRequestError, errors.BaseError);

var ErrorCode = errors.ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603
};

/**
 * The base class for amqp10-rpc protocol errors
 *
 * @param code the error code
 * @param message the error message
 * @param data optional data associated with the error
 * @extends BaseError
 * @constructor
 */
errors.ProtocolError = function(code, message, data) {
  this.code = code;
  this.message = message;
  if (!!data) this.data = data;

  // so we can catch these with bluebird's `.error` handler
  Object.defineProperty(this, 'isOperational', {
    value: true, enumerable: false, writable: false, configurable: false
  });
};

errors.ParseError = function(message, data) {
  errors.ProtocolError.call(this, ErrorCode.ParseError, message, data);
};
util.inherits(errors.ParseError, errors.ProtocolError);

errors.InvalidRequestError = function(message, data) {
  errors.ProtocolError.call(this, ErrorCode.InvalidRequest, message, data);
};
util.inherits(errors.InvalidRequestError, errors.ProtocolError);

errors.MethodNotFoundError = function(method, data) {
  errors.ProtocolError.call(this, ErrorCode.MethodNotFound, 'No such method: ' + method, data);
};
util.inherits(errors.MethodNotFoundError, errors.ProtocolError);

errors.InvalidParamsError = function(message, data) {
  errors.ProtocolError.call(this, ErrorCode.InvalidParams, message, data);
};
util.inherits(errors.InvalidParamsError, errors.ProtocolError);

errors.InternalError = function(message, data) {
  errors.ProtocolError.call(this, ErrorCode.InternalError, message, data);
};
util.inherits(errors.InternalError, errors.ProtocolError);

errors.wrapProtocolError = function(err) {
  var ErrorType = errors.ProtocolError;
  switch(err.code) {
  case ErrorCode.ParseError: ErrorType = errors.ParseError; break;
  case ErrorCode.InvalidRequest: ErrorType = errors.InvalidRequestError; break;
  case ErrorCode.MethodNotFound: ErrorType = errors.MethodNotFoundError; break;
  case ErrorCode.InvalidParams: ErrorType = errors.InvalidParamsError; break;
  case ErrorCode.InternalError: ErrorType = errors.InternalError; break;
  default:
    return err;
  }

  var result = new ErrorType();
  result.message = err.message;
  result.data = err.data;
  return result;
};
