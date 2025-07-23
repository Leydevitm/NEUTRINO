const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');



const transport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive:false,
  maxSize:'5m',
  maxFiles: '7d'
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.printf(info =>{

    return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`})
  ),
  transports: [
    new winston.transports.Console(),
  transport]
});

module.exports = logger;