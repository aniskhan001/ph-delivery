/**
 * LinkService
 *
 * @description :: Creating new Links for user
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var sh = require("shorthash");
module.exports = {


  /**
   * Created A new Link based on option sent
   *
   * @required {String} url
   *   The destination url information
   * @required {String} urlSlug
   *   The url slug information of the URL
   * @required {String} userId
   *   The owner user id of the link
   */
  createNew: function (options, done) {
    var url = options.url;
    var urlSlug = options.urlSlug;
    var urlName = options.urlName;
    var userId = options.userId;

    if (url != null && urlSlug != null) {

      Links.findOne({
        link_id: urlSlug,
        status: 1
      }).exec(function (err, linkInfo) {
        if (err) {
          //change url slug
          return done(err);
        }
        if (!linkInfo) {

          //if unique update

          Links.findOrCreate({
            user_id: userId,
            status: 1,
            original_link: url
          }, {
            user_id: userId,
            original_link: url,
            link_id: urlSlug,
            link_name: urlName
          }).exec(function createFindCB(error, createdOrFoundLinks) {

            if (error) {
              return done(error);
            }

            return done();

          });

        } else {

          urlSlug = sh.unique(String(+new Date()));

          LinkService.createNew({
            url: url,
            urlSlug: urlSlug,
            userId: userId,
            urlName: urlName
          }, function (errLink) {
            if (errLink) {
              return done(errLink);
            }
            return done();
          });

        }
      });


    } else {
      return done("No Information Provided");
    }

  },


  getDestinationLinkP1: function (link, finalLink) {

    if ((typeof link.remove_qs !== 'undefined') && (link.remove_qs == 1)) {
      var infalUrlTest = link.original_link.substring(0, link.original_link.indexOf('?'));
      if (infalUrlTest.length > 0) {
        return finalLink(infalUrlTest);
      } else {
        return finalLink(link.original_link);
      }
    } else {
      return finalLink(link.original_link);
    }
  },

  getDestinationLinkP2: function (link, finalLink) {

    if ((typeof link.passThrough !== 'undefined') && link.passThrough == 1) {




      //now first convert the subs we got
      var getSubArea = "";
      if((typeof link.hasOffers !== 'undefined') && link.hasOffers == 1){
        getSubArea = this.fromObjectToString(link.parts, 1);
      }else{
        getSubArea = this.fromObjectToString(link.parts, 0);
      }


      var infalUrlTest = link.original_link.substring(0, link.original_link.indexOf('?'));


      if (infalUrlTest.length > 0) {

        if(link.link_id === getSubArea){
          return finalLink(link.original_link);
        }else{
          return finalLink(link.original_link + "&" + getSubArea);
        }

      } else {

        if(link.link_id === getSubArea){
          return finalLink(link.original_link);
        }else{
          return finalLink(link.original_link + "?" + getSubArea);
        }
      }

    } else {

      return finalLink(link.original_link);

    }
  },


  getURlParmetersInObject: function(req){
    var allParameter = req.allParams();
    delete allParameter.urlparts;

    return allParameter;
  },

  fromObjectToString: function(allParameter, replace){






    var str = '';
    for( var name in allParameter ) {

      if(replace == 1){
        str += ( this.getValueForTheObject(name)  + '=' + allParameter[name] + '&');
        //console.log(str);
      }else{
        str += (name + '=' + allParameter[name] + '&');
      }


    }
    str = str.slice(0,-1);

    return str;
  },


  getValueForTheObject: function(key){

    var objectMe = {
      utm_source: "source",
      utm_campaign: "aff_sub",
      utm_medium: "aff_sub2"
    };

    //console.log(key);

    if (key in objectMe){
      return objectMe[key];
    }
    return key;


  },

  createHistoryLink: function (linkInfo,callback) {

    var link_id = linkInfo.link_id;
    var broweser_info = linkInfo.broweser_info;
    History.create({
      link_id : link_id,
      user_agent : broweser_info
    }).exec(function (err, finn) {
      if (err) {
        return callback(false);
      }
      return  callback(true);
    });
  },


  /**
   *
   * @param link
   * @param result
   * @returns {*}
   */
  checkOriginal: function (link, result) {
    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);
    if (link.match(regex)) {
      return result(true);
    } else {
      return result(false);
    }
  }

};
