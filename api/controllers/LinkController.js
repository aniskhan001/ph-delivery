/**
 * LinkController
 *
 * @description :: Server-side logic for managing links
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {



  /**
   * `LinkController.manage()`
   */
  manage: function (req, res) {

    var urlParts = req.param('urlparts');

    Links.findOne({
      link_id: urlParts,
      status: 1
    }).exec(function (err, linksInfo) {
      if (err) {
        return res.serverError('Sorry! Something went wrong!','500');
      }
      if (!linksInfo) {
        //not found send message
        return res.serverError('Sorry! Nothing found','404');
      }

      console.log()

      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      res.writeHead(301, {'Location' : linksInfo.original_link});
      res.end();

    });

  }
};

