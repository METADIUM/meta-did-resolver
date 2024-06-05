import ansicolor from 'ansicolor';
import winston from 'winston';

const ansi = ansicolor.nice
const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp}    ${level.toUpperCase()}\t${message}`;
});
  
const log = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      myFormat
    ),
    transports: [
      new winston.transports.Console()
    ]
});

export {
    ansi,
    log
};
