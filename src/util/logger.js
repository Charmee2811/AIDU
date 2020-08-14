'use strict';
var winston = require('winston');
winston.emitErrs = true;

var timestampFormat= function(){
    return (new Date()).toLocaleTimeString();
}
var fileName = './log/logs_' + timestampFormat +'.log';

var logger = new winston.Logger({
    transports: [
        //Output to generated log file
        new winston.transports.File({
            //level:'info',
            levels: winston.config.npm,
            //filename: fileName,
            filename:'./log/logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: true,
            timestamp:timestampFormat
        }),
        // Output to the console
        new winston.transports.Console({
            //level: 'info',
            levels: winston.config.npm,
            handleExceptions: true,
            json: false,
            colorize: true,
            timestamp:timestampFormat
        }),
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
        logger.error(message);
    }
};