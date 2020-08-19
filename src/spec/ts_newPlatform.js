var objLoadUrlpg = require ('./../pages/loadUrl.js');
var objTs1Np = require ('../pages/pg_newPlatform.js');

//Managing logs
var logger = require('./../util/logger.js');

describe('Search Page Suite',function()
{
    it('load url',function(){
        objLoadUrlpg.loadURL();
        objLoadUrlpg.verifyURLLoaded();
    });

    it('enter details',function()
    {
        objTs1Np.enterDetails();

    });
   it('verify find page',function ()
   {
       objTs1Np.verifyFindPage();
    });

    it ('click hotel and find offer',function()
    {
       objTs1Np.clickHotel();
       objTs1Np.checkAvaiablityAndClick();
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
