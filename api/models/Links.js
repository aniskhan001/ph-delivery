/**
 * Links.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    user_id: {
      type: 'string',
      required: true
    },

    link_name:{
      type: 'string',
      required: false
    },

    original_link:{
      type: 'string',
      required: true
    },

    link_id: {
      type: 'string',
      required: true,
      unique: true
    },

    remove_qs: {
      type: 'integer',
      defaultsTo: 0
    },

    passThrough:{
      type: 'integer',
      defaultsTo: 0
    },

    hasOffers:{
      type: 'integer',
      defaultsTo: 0
    },

    status:{
      type: 'integer',
      defaultsTo: 1
    }
  }
};

