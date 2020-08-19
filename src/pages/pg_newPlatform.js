//Managing logs
var logger = require("./../util/logger.js");
logger.info("currosr here after log");
var objCommonFun = require("./../util/common.js");
//config data and other files
var objData = require("./../testData/data.json");
var EC = protractor.ExpectedConditions;


var pg_newPlatform = function() {
 var txt_destination = element(by.css('span[data-cy = summary-destination]'));
 var txt_destinationInput = element(by.css('[data-cy=destination-input'));
 var btn_searchSubmit = element(by.css('[data-cy=search-submit'));
 var btn_summaryTravellers = element(by.css('[data-cy =summary-travellers]'));
 var btn_minusAdult = element(by.css('[data-cy =decrease-quantity]'));
 var btn_submitTraveller = element(by.css('.button.button--primary.button--full-width'));
 var link_hotel = element(by.css('.hotel-tile__gallery:nth-of-type(2)'));
 var lin_checkAvablity =  element(by.css('[data-cy =offer-tile-check-availability]'));
 var link_booked = element(by.css('[data-cy = booked-out-button-text]'));

 this.enterDetails = function()
    {
        txt_destination.click();
        txt_destinationInput.sendKeys('Turkei');
        txt_destinationInput.click();
        browser.actions().sendKeys(protractor.Key.ENTER).perform().then(function()
        {
            browser.wait(EC.elementToBeClickable(btn_summaryTravellers),5000);
           btn_summaryTravellers.click();
            btn_minusAdult.click();
            btn_submitTraveller.click();
            btn_searchSubmit.click();
        });

    }
 this.verifyFindPage =function()
 {
     var curUrl = browser.getCurrentUrl();
     expect(curUrl).toContain('find');
 }

 this.clickHotel = function()
 {
     browser.wait(EC.elementToBeClickable(link_hotel),7000);
     link_hotel.click();
 }

 this.checkAvaiablityAndClick = function()
 {
     browser.wait(EC.elementToBeClickable(lin_checkAvablity),8000);
     lin_checkAvablity.click();
     browser.wait(EC.textToBePresentInElement(link_booked),10000);
     if(link_booked.isDisplayed())
         console.log("Offer not avaiabe");
 }
};

module.exports = new pg_newPlatform();