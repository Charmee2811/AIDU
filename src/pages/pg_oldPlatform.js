//Managing logs
var logger = require("./../util/logger.js");
logger.info("currosr here after log");
var objCommonFun = require("./../util/common.js");
//config data and other files
var objData = require("./../testData/data.json");
//var objcommon = require ("./../util/common.js");
var EC = protractor.ExpectedConditions;

var pg_oldPlatform = function()
{

//locators
    var link_ownArrival = element(by.css("label.item-ownarrival[for=formSwitcher-ownarrival]"));
    var txt_destination= element(by.css("#ownarrival .ac-item.location.standard-version input[id=idestflat][type=text]"))
        //element(by.css("input[id=idestflat][type=text]"));
    var btn_submit = element(by.css("#ownarrival .postPop[name=submit"));
    var btn_cookieButton = element(by.id("CybotCookiebotDialogBodyButtonAccept"));
    var link_hotelSelect = element(by.css("#ownarrival .aiduac-group.hotel [data-type=hotel]:first-of-type"));
    var link_reiseziel = element(by.css(".region-table .button-next__icon.icon-arrow-right"));
    var btn_hotel = element(by.css(".callToAction"));
    var btn_offerSelect = element(by.css("a.button-next.link:first-of-type .text"));
        //"a[class='button-next link']"));
    //(".button-next.link span[class = 'icon-arrow-right']"));
   // (element(by.linkText("Zur Buchung"))
    var txt_firstName = element(by.css("input[id =customerFirstName]"));
    var txt_selectTraveller = element(by.css("input[id =travellerSummary]"));
    var btn_adultPlus = element(by.css(".adult .plusButton"));
    var btn_childPlus = element(by.css(".child .plusButton"));
    //#ownarrival .aiduac-group.hotel [data-type=hotel][data-value='56050;4'] //
    var btn_submitTraveller = element(by.css(".submit .button-submit"));


    this.submitForm1 = function()
    {
        if (btn_cookieButton.isDisplayed())
            btn_cookieButton.click();

        browser.wait(EC.elementToBeClickable(link_ownArrival),5000);
        link_ownArrival.click().then( function() {
            browser.wait(EC.elementToBeClickable(txt_destination),5000);
             txt_destination.click();
             browser.actions().mouseMove(txt_destination).sendKeys(objData.searchPage.destination).perform().then(function()
             {
                 //browser.wait(EC.visibilityOf(link_hotelSelect),15000);
                 //link_hotelSelect.click();
                 browser.actions().sendKeys(protractor.Key.ENTER).perform();
                 txt_selectTraveller.click();
                 btn_adultPlus.click();
                 btn_childPlus.click();
                 btn_submitTraveller.click();

                 browser.actions().mouseMove(btn_submit).click().perform().then(function()
                 {
                     //btn_submit.click().then(function () {
                     browser.wait(EC.elementToBeClickable(link_reiseziel),15000);
                     link_reiseziel.click();
                     browser.wait(EC.elementToBeClickable(btn_hotel),15000);
                     browser.actions().mouseMove(btn_hotel).click().perform().then(function()
                     {
                         browser.switchTo().activeElement();

                         browser.getCurrentUrl().then(function(currURL) {
                             expect(currURL).toContain('hotel');
                             if(true)
                                 logger.info(" current page is offer list");
                         });

                         browser.wait(EC.visibilityOf(element(by.css(".button-next.scroll-to.jsAutoVacancy.js-events-and-price"))),55000);
                         element(by.css(".button-next.scroll-to.jsAutoVacancy.js-events-and-price")).click();

                         browser.wait(EC.visibilityOf(btn_offerSelect),55000);
                         objCommonFun.scrollTo(btn_offerSelect);

                         browser.actions().mouseMove(btn_offerSelect).click().perform().then(function()
                         {
                             browser.switchTo().activeElement();
                             txt_firstName.sendKeys(objData.bookPage.firstName);
                         });
                     });
                     /* expect(alt_verifySubmit.getText()).toContain("Success!");
                         if (true)
                             logger.info("data entered correctly");
                         else
                             logger.info("TestFailed Incorrect Input");*/
                 });
             });

        });
       // });

    } ;

} ;

module.exports = new pg_oldPlatform();