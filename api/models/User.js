/**
 * User.js
 *
 * @description :: It will store user info.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    email: {
      type: 'string',
      required: true
    },

    password:{
      type: 'string',
      required: true
    },

    name: {
      type: 'string',
      required: true
    },

    status:{
      type: 'int',
      defaultsTo: 0
    }

  }
};

