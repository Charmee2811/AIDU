/**
 * Project Name: selfLearning
 * Automation Framework : Protractor
 */

//var exceptions = require("exceptions");
//var myException = new exceptions.Exception("CustomException");

//Managing logs
var logger = require('./../util/logger.js');

//config data
var objConfig = require('./../testData/data.json');

var varLoadURLPage = function(){

    // Load the URL and wait for getting an Angular element
    this.loadURL = function(){
        try{
            //browser.angularAppRoot();
            browser.ignoreSynchronization = true;
            browser.get(objConfig.configData.baseUrl);
            logger.info("Browser launched");
        }
        catch(error){
            logger.info(error.name +':'+ error.message);
        }
    };

    /*
     * Validate Login Page loaded
     */
    this.verifyURLLoaded = function(){
        try{
            //browser.waitForAngularEnabled(false);

            browser.getTitle().then(function(webpagetitle)
            {
                logger.info("site title is -->"+ webpagetitle);
                expect(webpagetitle).toEqual(objConfig.configData.title);
                if(true)
                    logger.info(" URL opened");
            })
        }
        catch(error){
            logger.info(error.name +':'+ error.message);
        }
    };
};

module.exports = new varLoadURLPage();