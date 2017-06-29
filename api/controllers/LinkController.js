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

    //urlParts = urlParts + secParts;

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



      if(linksInfo){



        var linkParts = LinkService.getURlParmetersInObject(req);
        linksInfo.parts = linkParts;

        LinkService.getDestinationLinkP1(linksInfo, function(checker){
          if(checker){
            linksInfo.original_link = checker;


            LinkService.getDestinationLinkP2(linksInfo, function(finalChecker){

              if(finalChecker){

                var browserInfo = req.headers['user-agent'];

                var linkInfoForSaving = {
                  link_id: linksInfo.id,
                  broweser_info: browserInfo
                };


                if(Object.keys(linkParts).length <= 0){
                  LinkService.createHistoryLink(linkInfoForSaving, function(checker){});
                }


                res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                res.writeHead(301, {'Location' : finalChecker});
                res.end();

              }else{
                return res.serverError('Sorry! Something went wrong!','500');
              }

            });
          }else{
            return res.serverError('Sorry! Something went wrong!','500');
          }
        });

      }



    });

  }
};

