/**
 * History.js
 *
 * @description :: TODO: let's have the details of this module
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    link_id: {
      type: 'string',
      required: true
    },
    user_agent:{
      type: 'string',
      required: false
    }
  }
};

