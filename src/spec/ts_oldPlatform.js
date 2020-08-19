var objLoadUrlpg = require ('./../pages/loadUrl.js');
var objTs1Pg = require ('../pages/pg_oldPlatform.js');

//Managing logs
var logger = require('./../util/logger.js');

describe('Search Page Suite',function()
{
    /* beforeEach(function() will be loaded for each IT
     {
         objLoadUrlpg.loadURL();
         objLoadUrlpg.verifyURLLoaded();
     });*/

    it('load url',function(){
        objLoadUrlpg.loadURL();
        objLoadUrlpg.verifyURLLoaded();
    });

    it('enter details',function()
    {
        objTs1Pg.submitForm1();

    });
  

    it('display browser logs',function()
    {
        browser.manage().logs().get('browser').then(function (browserLogs) {

            console.log(browserLogs)

            browserLogs.forEach(function (log) {
                console.log("-------------------");
                console.log(log.message);
                if (log.level.value > 900) {
                    throw log.message;
                }
            })
        })
    });

    afterEach(function(){
        logger.info("Search Page Suite Test is Completed");
    })

});
