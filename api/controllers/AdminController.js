/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var sh = require("shorthash");
var bcrypt = require('bcrypt');
var saltRounds = 10;

module.exports = {


  /**
   * `AdminController.dashboard()`
   */
  dashboard: function (req, res) {

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      Links.find({
        user_id: req.session.userId,
        status: 1
      }).exec(function (err, linksFound) {

        var linkData = [];

        if (err) {
          sails.log(err);
        }

        if (linksFound) {
          linkData = linksFound;
        }
        //sails.log(linksFound);

        return res.view({
          userLinks: linkData,
          layout: 'admin/layout_ad'
        });

      });
    }

  },

  create_link: function (req, res) {

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      if (req.method == 'POST') {
        var url = req.param('url', null);
        if (url != null) {


          Links.findOrCreate(
            {
              user_id: req.session.userId,
              status: 1,
              original_link: url
            },
            {
              user_id: req.session.userId,
              original_link: url,
              link_id: sh.unique(String(+new Date()))
            }
          ).exec(function createFindCB(error, createdOrFoundLinks) {

            if (error) {
              sails.log(err);
              return res.redirect(sails.config.appUrl + 'admin/create_link');
            }

            sails.log('Found or Create Result:', createdOrFoundLinks.id);

            //this will be a success page
            return res.redirect(sails.config.appUrl + 'admin/dashboard');

          });

        } else {
          return res.redirect(sails.config.appUrl + 'admin/create_link');
        }
      } else {
        return res.view({
          layout: 'admin/layout_ad'
        });
      }

    }

  },


  edit_link: function (req, res) {
    var urlParts = req.param('urlparts');

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      if (req.method == 'POST') {
        var url = req.param('url', null);
        if (url != null) {


          Links.update({
              user_id: req.session.userId,
              link_id: urlParts
            },
            {
              original_link: url
            }
          ).exec(function afterwards(err, updated) {

            if (err) {
              //error message
              return res.redirect(sails.config.appUrl + 'admin/dashboard');
            }

            //success message
            return res.redirect(sails.config.appUrl + 'admin/dashboard');
          });

        } else {
          return res.redirect(sails.config.appUrl + 'admin/edit_link/' + urlParts);
        }
      } else {

        Links.findOne({
          user_id: req.session.userId,
          link_id: urlParts,
          status: 1
        }).exec(function (err, linkInfo) {
          if (err) {
            //error message
            return res.redirect(sails.config.appUrl + 'admin/dashboard');
          }
          if (!linkInfo) {
            //error message
            return res.redirect(sails.config.appUrl + 'admin/dashboard');
          }

          return res.view({
            link: linkInfo,
            layout: 'admin/layout_ad'
          });
        });
      }

    }

  },


  delete_link: function (req, res) {
    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {
      //first check if the link is yours
      var urlParts = req.param('urlparts');


      Links.update({
          user_id: req.session.userId,
          link_id: urlParts
        },
        {
          status: 0
        }
      ).exec(function afterwards(err, updated) {

        if (err) {
          //error message
          return res.redirect(sails.config.appUrl + 'admin/dashboard');
        }

        //success message
        return res.redirect(sails.config.appUrl + 'admin/dashboard');
      });


    }
  },


  settings: function (req, res) {
    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      if (req.method == 'POST') {
        //off here

        //first check if old and new password has been provided
        var oldPass = req.param('old_pass', null);
        var newPass = req.param('new_pass', null);
        var nameInfo = req.param('name', null);

        var updateInfo = {
          'name': nameInfo
        };

        if ((oldPass != null) && (newPass != null)) {
          //do this
          //now first old pass match

          User.findOne({
            id: req.session.userId,
            status: '1'
          }).exec(function (err, userInfo) {
            if (err) {
              return res.redirect(sails.config.appUrl + 'auth/login');
            }
            if (!userInfo) {
              //not found send message
              return res.redirect(sails.config.appUrl + 'auth/login');
            }
            bcrypt.compare(oldPass, String(userInfo.password), function (errres, response) {

              if (response == true) {

                bcrypt.hash(String(newPass), saltRounds, function(err, hash) {
                  // Store hash in your password DB.

                  if (err) {
                    return res.redirect(sails.config.appUrl + 'admin/settings');
                  }

                  updateInfo.password = hash;
                  User.update({
                      id: req.session.userId,
                      status: '1'
                    },
                    updateInfo
                  ).exec(function afterwards(err, updated) {

                    if (err) {
                      //error message
                      //return false;
                    }

                    //success message
                    //return true;
                  });

                });





                req.session.userName = nameInfo;

                return res.redirect(sails.config.appUrl + 'admin/settings');
              } else {


                User.update({
                    id: req.session.userId,
                    status: '1'
                  },
                  updateInfo
                ).exec(function afterwards(err, updated) {

                  if (err) {
                    //error message
                    //return false;
                  }

                  //success message
                  //return true;
                });
                req.session.userName = nameInfo;

                return res.redirect(sails.config.appUrl + 'admin/settings');
              }
            });
          });

        } else {
          User.update({
              id: req.session.userId,
              status: '1'
            },
            updateInfo
          ).exec(function afterwards(err, updated) {

            if (err) {
              //error message
              //return false;
            }

            //success message
            //return true;
          });


          req.session.userName = nameInfo;
          return res.redirect(sails.config.appUrl + 'admin/settings');
        }
      } else {

        User.findOne({
          id: req.session.userId,
          status: '1'
        }).exec(function (err, userInfo) {
          if (err) {
            console.log(err);
            //error message
            return res.redirect(sails.config.appUrl + 'admin/dashboard');
          }
          if (!userInfo) {
            //error message
            console.log("yahoo");
            return res.redirect(sails.config.appUrl + 'admin/dashboard');
          }

          return res.view({
            user: userInfo,
            layout: 'admin/layout_ad'
          });
        });
      }

    }

  }
};

