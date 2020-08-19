/**
 * Project Name: invia_BookingTask
 * Automation Framework : Protractor
 */

var HtmlReporter = require('protractor-beautiful-reporter');
const retry = require('protractor-retry').retry;

exports.config = {
    plugins: [
        {
            // The module name
            package: "protractor-react-selector"
        },
        {
            package: 'protractor-testability-plugin'
        }
    ],
    "framework": 'jasmine2',
    "directConnect": true, //bydefault its chrome   now for other borowser add direct connect
    // seleniumAddress: 'http://localhost:4444/wd/hub',
    //to use same framework for non angular apps
    "browser": ignoreSynchronizatio=true,

    "maxSessions": 1, //this will force protractor to execute in sequence (if we execute in parllel reports/screenshots wont be proper).

    // specs: ['./../spec/tsHome.js','./../test/tsShop.js'],
    "specs": ['./../spec/ts_oldPlatform.js'],
   // SELENIUM_PROMISE_MANAGER: false,

    "capabilities": { //to execute on single browser
        'browserName': 'chrome',
        'chromeOptions': {
            // Get rid of --ignore-certificate yellow warning
            "args": ['--no-sandbox', '--test-type=browser'],
            // Set download path and avoid prompting for download even though
            // this is already the default on Chrome but for completeness
            "prefs": {
                'profile.managed_default_content_settings.notifications': 1,
                'download': {
                    'prompt_for_download': false,
                    'directory_upgrade': true,
                }
            }
        }
    },

    /*multiCapabilities: [
        {
            shardTestFiles: true,
            maxInstances: 1,
            sequential: true,
            'browserName': 'chrome',
            'chromeOptions': {
                // Get rid of --ignore-certificate yellow warning
                args: ['--no-sandbox', '--test-type=browser'],
                // Set download path and avoid prompting for download even though
                // this is already the default on Chrome but for completeness
                prefs: {
                    'download': {
                        'prompt_for_download': false,
                        'directory_upgrade': true,
                    }
                  }
                },
                specs: ['./../test/tsShop.js'] //if need to execute different specs for
        },
        {
            shardTestFiles: true,
            maxInstances: 1,
            sequential: true,
            'browserName': 'firefox',
            specs: ['./../test/tsShop.js']
        },
    ],*/


    "getPageTimeout": 30000,
    "allScriptsTimeout": 30000,

    "jasmineNodeOpts": {
        "showColors": true,
        "defaultTimeoutInterval": 90000
    },
    "params": {
        "implicitWaitTime": 7000,
        //Email to be sent to the below mail id's
        //emailToAddress: 'demo@gmail.com',
        "block": ""
    },

    "onPrepare": function ()
    {
        //maximize window
        browser.driver.manage().window().maximize();
        //browser.manage().window().setSize(1600, 1000);

        // empty results folder
        var fs = require('fs-extra');
        fs.emptyDir('./results', function (err) {
            console.log(err);
        });

        //to delete some directories(data of previous execution)
        var del = require('delete');
        del.sync(['./log/logs.log']);

        //Reports



        var path = require('path');
        jasmine.getEnv().addReporter(new HtmlReporter({
            "baseDirectory": './results',
            "screenshotsSubfolder":'screenShots',
            "jsonsSubfolder":'json',
            "docTitle": 'Test Execution Report',
            "gatherBrowserLogs":true
            /*pathBuilder: function pathBuilder(spec, descriptions, results, capabilities)
              {
                  // Return '<browser>/<specname>' as path for screenshots
              	// Example: 'firefox/list-should work'.
                  return path.join(capabilities.caps_.browser, descriptions.join('-'));
                }*/
        }).getJasmine2Reporter());
    },


    "onComplete": function () {
        var browserName, browserVersion;
        var capsPromise = browser.getCapabilities();

        capsPromise.then(function (caps) {
            browserName = caps.get('browserName');
            browserVersion = caps.get('version');

            var reporter = new HtmlReporter
            ({
                "baseDirectory": './results'
            });

        }).then(function () {

            //move log file for bckup
            const fs = require('fs-extra');
            var fileName = './resBackup/bkLog_'+browserName + Date.now() +'log';
            try {
                fs.copySync('./log/logs.log', fileName);
                console.log('success!');
            } catch (err) {
                console.error(err);
            }

          // for ziping the folder
           /* var zipFolder = require('zip-folder');
            var zipFileName = './resBackup/resultsZip_'+ browserName + Date.now() +'.zip';
            zipFolder('./results', zipFileName, function (err) {
                //WIP to make the reports to send it over email
                if (err) {
                    //var logger = require('./../util/logger.js'); not working getting some error of undefined
                    console.log("zip not created properly");
                } else {
                    var mail = require('./../util/mail.js');
                    mail.sendMails();
                    console.log("mail sent succesfully");
                }
            });*/
        });

        //This is to wait for certain given seconds before sending out the reports
        return new Promise(function (resolve, reject) {
            setTimeout(function () {

                //a promise that is resolved after "delay" milliseconds with the data provided
                resolve();
            }, 2000);
        }).then(function () {

            //browser.driver.close();
        });
    },

}
