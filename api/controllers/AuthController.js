/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bcrypt = require('bcrypt');
var saltRounds = 10;

module.exports = {



  /**
   * `AuthController.register()`
   */
  register: function (req, res) {
    return res.view({
      title: "Register Page",
      layout: 'auth/layout_auth'
    });
  },

  make_register: function(req,res) {

    if(req.method == 'POST'){
      var email = req.param('email', null);
      var name  = req.param('name', null);
      var password = req.param('password',null);

      if( (email != null) && (name != null) && (password != null) ){
        //save the data and show success page

        //now check duplicate here


        bcrypt.hash(String(password), saltRounds, function(err, hash) {
          // Store hash in your password DB.

          if(err){
            return res.redirect(sails.config.appUrl+'auth/register');
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
              status : 1
            }
          ).exec(function createFindCB(error, createdOrFoundRecords){

            if (err) {
              sails.log(err);
              return res.redirect(sails.config.appUrl+'auth/register');
            }

            sails.log('Found or Create Result:', createdOrFoundRecords.id);

            //this will be a success page
            return res.redirect(sails.config.appUrl+'auth/register_success');

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

        return res.redirect(sails.config.appUrl+'auth/register');
      }

    }else{
      return res.redirect(sails.config.appUrl+'auth/register');
    }
  },


  register_success: function (req, res) {
    return res.view('auth/message',{
      messageDescription: "Your Account has been Created!",
      messageTitle: "Success!",
      title: "Confirm Page",
      layout: 'auth/layout_auth'
    });
  },


  /**
   * `AuthController.login()`
   */
  login: function (req, res) {
    if(req.method == 'POST'){
      var email = req.param('email', null);
      var password = req.param('password',null);
      if( (email != null) && (password != null) ){

        User.findOne({
          email: email,
          status: '1'
        }).exec(function (err, userInfo){
          if (err) {
            return res.redirect(sails.config.appUrl+'auth/login');
          }
          if (!userInfo) {
            //not found send message
            return res.redirect(sails.config.appUrl+'auth/login');
          }


          bcrypt.compare(password, String(userInfo.password), function(errres, response) {

            if(response == true){

              req.session.userId = userInfo.id;
              req.session.loggedIn = true;
              req.session.userName = userInfo.name;

              return res.redirect(sails.config.appUrl+'admin/dashboard');
            }else{
              return res.redirect(sails.config.appUrl+'auth/login');
            }
          });



        });
      }else{
        return res.redirect(sails.config.appUrl+'auth/login');
      }
    }else{
      return res.view({
        title: "Login Page",
        layout: 'auth/layout_auth'
      });
    }
  },


  /**
   * `AuthController.logout()`
   */
  logout: function (req, res) {

    req.session.destroy(function(err) {
      setTimeout(function(){
        return res.redirect(sails.config.appUrl+'auth/login');
      }, 1000);
    });
  }
};

