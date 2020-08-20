var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "load url|Search Page Suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10668,
        "browser": {
            "name": "chrome",
            "version": "84.0.4147.125"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://consent.cookiebot.com/ - Refused to frame 'https://consentcdn.cookiebot.com/' because it violates the following Content Security Policy directive: \"default-src 'self' https://aidu-search-public-test.s3.eu-central-1.amazonaws.com\". Note that 'frame-src' was not explicitly set, so 'default-src' is used as a fallback.\n",
                "timestamp": 1597840442474,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://consent.cookiebot.com/uc.js 0 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://consentcdn.cookiebot.com') does not match the recipient window's origin ('null').",
                "timestamp": 1597840442531,
                "type": ""
            }
        ],
        "screenShotFile": "screenShots\\00620075-00b3-00e8-0087-001a0071000f.png",
        "timestamp": 1597840439284,
        "duration": 3470
    },
    {
        "description": "enter details|Search Page Suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10668,
        "browser": {
            "name": "chrome",
            "version": "84.0.4147.125"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://consent.cookiebot.com/ae5b6291-94a6-4df9-ac96-b76a282aa626/cc.js?renew=false&referer=search.travel-test.invia.lan&dnt=false&forceshow=false&cbid=ae5b6291-94a6-4df9-ac96-b76a282aa626&whitelabel=false&brandid=Cookiebot&framework= 0:213 \"Error: SEARCH.TRAVEL-TEST.INVIA.LAN is not a valid domain. Please add it to the cookie consent manager to authorize the domain.\"",
                "timestamp": 1597840443626,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://search.travel-test.invia.lan/ - Refused to load the image 'https://cx.atdmt.com/?c=10041009669812281329&f=AYzrRWElLNDOIaPHo6x43cTh4k1bbuqEsa7-FM__2WaGGq52AH9_YvAnbRrtYveS3-XlJeFunM3_oSrWbjyFoyw_&id=348366469141221&l=3&v=0' because it violates the following Content Security Policy directive: \"img-src 'self' data: https://*.giatamedia.com https://maps.googleapis.com/ https://maps.gstatic.com/ https://*.images.traveltainment.eu/ https://www.google-analytics.com https://stats.g.doubleclick.net https://pci.usd.de/ bat.bing.com https://www.google.com https://www.google.de https://www.facebook.com https://aidu-search-public-test.s3.eu-central-1.amazonaws.com\".\n",
                "timestamp": 1597840444157,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://bat.bing.com/bat.js 0 Refused to connect to 'https://bat.bing.com/actionp/0?ti=5014468&Ver=2&mid=06ed5c09-54dd-316e-8bbf-0f90af816e83&sid=5699322bf2b178f64699beb0e1a77d3b&vid=c421b8b5196bedf5418e50e5568fc742&vids=1&evt=pageHide' because it violates the following Content Security Policy directive: \"connect-src 'self' https://search.travel-test.invia.lan https://aidu-search-public-test.s3.eu-central-1.amazonaws.com https://lighthouse-find.s3.eu-central-1.amazonaws.com https://www.google-analytics.com https://consent.cookiebot.com https://consentcdn.cookiebot.com/ https://www.googletagmanager.com https://stats.g.doubleclick.net *.eum-appdynamics.com https://*.bd4travel.com https://conversion.lambda.travel-test.invia.lan https://aidu-search-public-test.s3.eu-central-1.amazonaws.com\".\n",
                "timestamp": 1597840444635,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-TSDP75P 1306 Refused to load the script 'https://www.googleadservices.com/pagead/conversion_async.js' because it violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com/ https://www.googletagmanager.com/ https://www.google-analytics.com https://consent.cookiebot.com https://consentcdn.cookiebot.com/ data: https://aidu-find-public-test.s3.eu-central-1.amazonaws.com\". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.\n",
                "timestamp": 1597840445264,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security 0 Refused to load the script 'https://bat.bing.com/bat.js' because it violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com/ https://www.googletagmanager.com/ https://www.google-analytics.com https://consent.cookiebot.com https://consentcdn.cookiebot.com/ data: https://aidu-find-public-test.s3.eu-central-1.amazonaws.com\". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.\n",
                "timestamp": 1597840445265,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "security 0 Refused to load the script 'https://connect.facebook.net/en_US/fbevents.js' because it violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com/ https://www.googletagmanager.com/ https://www.google-analytics.com https://consent.cookiebot.com https://consentcdn.cookiebot.com/ data: https://aidu-find-public-test.s3.eu-central-1.amazonaws.com\". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.\n",
                "timestamp": 1597840445266,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.googletagmanager.com/gtm.js?id=GTM-TSDP75P 1476 Refused to load the script 'https://cdn.appdynamics.com/adrum/adrum-4.5.1.1066.js' because it violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com/ https://www.googletagmanager.com/ https://www.google-analytics.com https://consent.cookiebot.com https://consentcdn.cookiebot.com/ data: https://aidu-find-public-test.s3.eu-central-1.amazonaws.com\". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.\n",
                "timestamp": 1597840445286,
                "type": ""
            }
        ],
        "screenShotFile": "screenShots\\009400ab-00b2-004a-0067-000f00b3009f.png",
        "timestamp": 1597840443469,
        "duration": 1824
    },
    {
        "description": "verify find page|Search Page Suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10668,
        "browser": {
            "name": "chrome",
            "version": "84.0.4147.125"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://consent.cookiebot.com/ - Refused to frame 'https://consentcdn.cookiebot.com/' because it violates the following Content Security Policy directive: \"default-src 'self' https://aidu-find-public-test.s3.eu-central-1.amazonaws.com\". Note that 'frame-src' was not explicitly set, so 'default-src' is used as a fallback.\n",
                "timestamp": 1597840445341,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://find.find.travel-test.invia.lan/site.webmanifest - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1597840445399,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://find.find.travel-test.invia.lan/site.webmanifest 0 Manifest: Line: 1, column: 5, Unexpected data after root element.",
                "timestamp": 1597840445399,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://consent.cookiebot.com/uc.js 0 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://consentcdn.cookiebot.com') does not match the recipient window's origin ('null').",
                "timestamp": 1597840445427,
                "type": ""
            }
        ],
        "screenShotFile": "screenShots\\00640091-008e-009e-003c-0059009300d9.png",
        "timestamp": 1597840445832,
        "duration": 13
    },
    {
        "description": "click hotel and find offer|Search Page Suite",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10668,
        "browser": {
            "name": "chrome",
            "version": "84.0.4147.125"
        },
        "message": [
            "Failed: Wait timed out after 7002ms"
        ],
        "trace": [
            "TimeoutError: Wait timed out after 7002ms\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: <anonymous wait>\n    at scheduleWait (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\built\\browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\built\\browser.js:67:16)\n    at pg_newPlatform.clickHotel (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\src\\pages\\pg_newPlatform.js:44:14)\n    at UserContext.<anonymous> (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\src\\spec\\ts_newPlatform.js:26:17)\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\nFrom: Task: Run it(\"click hotel and find offer\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\src\\spec\\ts_newPlatform.js:24:5)\n    at addSpecsToSuite (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\c.desai\\IdeaProjects\\AIDU\\src\\spec\\ts_newPlatform.js:7:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://consent.cookiebot.com/ae5b6291-94a6-4df9-ac96-b76a282aa626/cc.js?renew=false&referer=find.find.travel-test.invia.lan&dnt=false&forceshow=false&cbid=ae5b6291-94a6-4df9-ac96-b76a282aa626&whitelabel=false&brandid=Cookiebot&framework= 0:216 \"Error: FIND.FIND.TRAVEL-TEST.INVIA.LAN is not a valid domain. Please add it to the cookie consent manager to authorize the domain.\"",
                "timestamp": 1597840446450,
                "type": ""
            }
        ],
        "screenShotFile": "screenShots\\006800e5-005a-002a-0039-00c500b80038.png",
        "timestamp": 1597840446308,
        "duration": 7016
    },
    {
        "description": "display browser logs|Search Page Suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10668,
        "browser": {
            "name": "chrome",
            "version": "84.0.4147.125"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "screenShots\\002b00d1-0033-00b6-0027-0008009d0061.png",
        "timestamp": 1597840454071,
        "duration": 5
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
