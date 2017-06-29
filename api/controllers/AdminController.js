/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var bcrypt = require('bcrypt');
var csv = require("fast-csv");
const fs = require('fs');
var saltRounds = 10;

module.exports = {


  /**
   * `AdminController.dashboard()`
   */
  dashboard: function (req, res) {

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      var currentPage =  req.param('page_no', 1);
      var pageLimit = req.param('limit', 15);

      Links.find({
        //user_id: req.session.userId,
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
                    layout: 'admin/layout_ad',
                  });

      });
    }

  },


  load_csv: function (req, res) {

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      req.file('csv_file').upload({
        // don't allow the total upload size to exceed ~10MB
        //maxBytes: 10000000
      },function whenDone(err, uploadedFiles) {
        if (err) {
          return res.redirect(sails.config.appUrl + 'admin/dashboard');
        }

        // If no files were uploaded, respond with an error.
        if (uploadedFiles.length === 0) {
          return res.badRequest('No file was uploaded');
        }

        //console.log(uploadedFiles);
        for(u in uploadedFiles){
          //"fd" contains the actual file path (and name) of your file on disk
          // I suggest you stringify the object to see what it contains and might be useful to you
          csv
            .fromPath(uploadedFiles[u].fd)
            .on("data", function(data){
              //console.log(data);
              console.log(data[0]);
              //console.log(data[2]);


              LinkService.checkOriginal(data[1], function(checker){
                if(checker){
                  LinkService.createNew({
                    url : data[1],
                    urlSlug : data[2],
                    urlName : data[0],
                    userId : req.session.userId
                  },function(errLink){
                    if(errLink){
                      console.log("Error:==="+errLink)
                    }else{
                      console.log("Success");
                    }

                  });
                }
              });



            })
            .on("end", function(){
              //console.log("done");


              fs.unlink(uploadedFiles[u].fd,function(err){
                if(err) return console.log(err);
                //console.log('file deleted successfully');
              });

              return res.redirect(sails.config.appUrl + 'admin/dashboard?reload=1');


            });

        }


      });

    }

  },


  manage_user: function (req, res) {
    if (req.session.isAdmin != 1) {
      return res.redirect(sails.config.appUrl + 'admin/dashboard');
    } else {

      User.find({
        status: '1'
      }).exec(function (err, usersFound) {

        var linkData = [];

        if (err) {
          sails.log(err);
        }

        if (usersFound) {
          userData = usersFound;
        }
        //sails.log(linksFound);

        return res.view({
          users: userData,
          layout: 'admin/layout_ad'
        });

      });
    }
  },

  edit_user: function (req, res) {
    if (req.session.isAdmin != 1) {
      return res.redirect(sails.config.appUrl + 'admin/dashboard');
    } else {

      var userId = req.param('userId');

      if (req.method == 'POST') {

        var newPass = req.param('password', null);
        var nameInfo = req.param('name', null);
        var userType = req.param('type',null);

        var updateInfo = {
          'name': nameInfo,
          'admin': userType
        };

        if (newPass != null) {
          //do this
          //now first old pass match

          bcrypt.hash(String(newPass), saltRounds, function(err, hash) {
            // Store hash in your password DB.

            if (err) {
              return res.redirect(sails.config.appUrl + 'admin/manage_user');
            }

            updateInfo.password = hash;
            User.update({
                id: userId,
                status: '1'
              },
              updateInfo
            ).exec(function afterwards(err, updated) {

              if (err) {
                //error message
                //return false;
                //todo
              }

              //success message
              //return true;
              return res.redirect(sails.config.appUrl + 'admin/manage_user');
            });

          });

        } else {
          User.update({
              id: userId,
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
          return res.redirect(sails.config.appUrl + 'admin/manage_user');
        }


      } else {

        User.findOne({
          id: userId,
          status: '1'
        }).exec(function (err, userInfo) {
          if (err) {
            //error message
            return res.redirect(sails.config.appUrl + 'admin/manage_user');
          }
          if (!userInfo) {
            //error message
            return res.redirect(sails.config.appUrl + 'admin/manage_user');
          }

          return res.view({
            user: userInfo,
            error: req.param('error', null),
            layout: 'admin/layout_ad'
          });
        });
      }

    }

  },

  delete_user : function  (req, res) {
    if (req.session.isAdmin != 1) {
      return res.redirect(sails.config.appUrl + 'admin/dashboard');
    } else {
      var userId = req.param('userId');


      User.update({
          id: userId
        },
        {
          status: '0'
        }
      ).exec(function afterwards(err, updated) {

        if (err) {
          //error message
          return res.redirect(sails.config.appUrl + 'admin/manage_user');
        }

        //success message
        return res.redirect(sails.config.appUrl + 'admin/manage_user');
      });
    }
  },

  create_user : function (req, res) {
    if (req.session.isAdmin != 1) {
      return res.redirect(sails.config.appUrl + 'admin/dashboard');
    }else{
      if (req.method == 'POST') {
        var email = req.param('email', null);
        var name  = req.param('name', null);
        var password = req.param('password',null);
        var userType = req.param('type',null);

        bcrypt.hash(String(password), saltRounds, function(err, hash) {
          // Store hash in your password DB.

          if(err){
            return res.redirect(sails.config.appUrl+'admin/create_user?error=something wrong!');
          }

          User.findOrCreate(
            {
              email: email,
              status: '1'
            },
            {
              email: email,
              password: hash,
              name: name,
              admin: userType,
              status : 1
            }
          ).exec(function createFindCB(error, createdOrFoundRecords){

            if (err) {
              sails.log(err);
              return res.redirect(sails.config.appUrl+'admin/create_user?error=something wrong!!');
            }

            sails.log('Found or Create Result:', createdOrFoundRecords.id);

            //this will be a success page
            return res.redirect(sails.config.appUrl+'admin/manage_user');

          });


          //User.create(
          //  {
          //    email: email,
          //    password: hash,
          //    name: name
          //  }
          //).exec(function (err, finn){
          //  if (err) {
          //    sails.log(err);
          //    return res.redirect(sails.config.appUrl+'auth/register');
          //  }
          //
          //  sails.log('Finn\'s id is:', finn.id);
          //
          //  //this will be a success page
          //  return res.redirect(sails.config.appUrl+'auth/register');
          //});


        });


      }else{
        return res.view({
          error: req.param('error', null),
          layout: 'admin/layout_ad'
        });
      }
    }
  },

  create_link: function (req, res) {

    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      if (req.method == 'POST') {
        var url = req.param('url', null);
        var urlSlug = req.param('url-slug', null);
        var urlName = req.param('link_name', null);


        var removeParam =  parseInt(req.param('remove', 0));
        var passThroughChecker =  parseInt(req.param('passthrough', 0));
        var hasOffers =  parseInt(req.param('hasoffers', 0));


        if (url != null && urlSlug != null ) {


          Links.findOne({
            link_id: urlSlug,
            status: 1
          }).exec(function (err, linkInfo) {
            if (err) {
              //error message
              return res.redirect(sails.config.appUrl + 'admin/create_link/' + urlParts + "?error=Something went wrong!!");
            }
            if (!linkInfo) {

              //if unique update

              Links.findOrCreate(
                {
                  user_id: req.session.userId,
                  status: 1,
                  original_link: url
                },
                {
                  user_id: req.session.userId,
                  original_link: url,
                  link_id: urlSlug,
                  link_name: urlName,
                  remove_qs: removeParam,
                  passThrough: passThroughChecker,
                  hasOffers: hasOffers

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

            }else{

              //if not unique go back
              return res.redirect(sails.config.appUrl + 'admin/create_link/' + "?error=URL slug exists! Enter a different slug.");
            }
          });

        } else {
          return res.redirect(sails.config.appUrl + 'admin/create_link');
        }
      } else {
        return res.view({
          error: req.param('error', null),
          layout: 'admin/layout_ad'
        });
      }

    }

  },

  link_counter: function(req, res){
    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {
      var linkId = req.param('link_id', null);
      History.count({link_id : linkId}).exec(function countCB(error, found) {
        res.json({ totalCount: found })
      });
    }

  },


  edit_link: function (req, res) {
    var urlParts = req.param('urlparts');

    //var meo = urlParts;
    //var Me = req.originalUrl;
    //var length = Me.indexOf(meo)+meo.length;
    //var keyLength = Me.length - meo.length;
    //var secParts = Me.substring(length , length + keyLength);
    //
    //urlParts = urlParts + secParts;


    if (req.session.loggedIn != true) {
      return res.redirect(sails.config.appUrl + 'auth/login');
    } else {

      if (req.method == 'POST') {
        var url = req.param('url', null);
        var urlSlug = req.param('url-slug', null);
        var urlName = req.param('link_name', null);

        var removeParam =  parseInt(req.param('remove', 0));
        var passThroughChecker =  parseInt(req.param('passthrough', 0));
        var hasOffers =  parseInt(req.param('hasoffers', 0));

        if (url != null && urlSlug != null ) {


          //now first check if url is same

          if( urlParts == urlSlug ){

            Links.update({
                //user_id: req.session.userId,
                link_id: urlParts
              },
              {
                original_link: url,
                link_name: urlName,
                remove_qs: removeParam,
                passThrough: passThroughChecker,
                hasOffers: hasOffers
              }
            ).exec(function afterwards(err, updated) {

              if (err) {
                //error message
                return res.redirect(sails.config.appUrl + 'admin/dashboard');
              }

              //success message
              return res.redirect(sails.config.appUrl + 'admin/dashboard');
            });

          }else{

            Links.findOne({
              link_id: urlSlug,
              status: 1
            }).exec(function (err, linkInfo) {
              if (err) {
                //error message
                //return res.redirect(sails.config.appUrl + 'admin/dashboard');
              }
              if (!linkInfo) {

                //if unique update

                Links.update({
                    //user_id: req.session.userId,
                    link_id: urlParts
                  },
                  {
                    original_link: url,
                    link_id: urlSlug,
                    link_name: urlName,
                    remove_qs: removeParam,
                    passThrough: passThroughChecker,
                    hasOffers: hasOffers
                  }
                ).exec(function afterwards(err, updated) {

                  if (err) {
                    //error message
                    return res.redirect(sails.config.appUrl + 'admin/dashboard');
                  }

                  //success message
                  return res.redirect(sails.config.appUrl + 'admin/dashboard');
                });

              }else{

                //if not unique go back
                return res.redirect(sails.config.appUrl + 'admin/edit_link/' + urlParts + "?error=URL slug exists! Enter a different slug.");
              }
            });

          }

          //if same then proceed

          //if not same then check if it's unique


        } else {
          return res.redirect(sails.config.appUrl + 'admin/edit_link/' + urlParts);
        }
      } else {

        Links.findOne({
          //user_id: req.session.userId,
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
            error: req.param('error', null),
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

      //var meo = urlParts;
      //var Me = req.originalUrl;
      //var length = Me.indexOf(meo)+meo.length;
      //var keyLength = Me.length - meo.length;
      //var secParts = Me.substring(length , length + keyLength);
      //
      //urlParts = urlParts + secParts;


      Links.update({
          //user_id: req.session.userId,
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

