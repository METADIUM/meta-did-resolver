const express = require('express');
const app = express();
//const bodyParser = require('body-parser');
const logger = require('morgan');
const ansi = require('ansicolor').nice;
const log = require('ololog').configure
({
  time: true,
  locate: true,
  tag: true
});

const { Web3 } = require('web3');
import AppConfig from '../conf/config.json';
import {IdentityRegistry, getPublicKeyResolvers, getServiceKeyResolvers} from './contracts';
import NodeCache from 'node-cache';

app.web3 = new Web3(AppConfig.url);

log.info(ansi.yellow('Configuration'));
log.info.indent (1)(`web3Config.URL : ${ansi.bright.green(AppConfig.url)}`);
log.info.indent (1)(`Identity Registry : ${ansi.magenta(AppConfig.addresses.identityRegistry)}`);
log.info.indent (1)(`ServiceKey Resolvers :${ansi.magenta(AppConfig.addresses.serviceKeyResolvers)}`);
log.info.indent (1)(`PublicKey Resolvers : ${ansi.magenta(AppConfig.addresses.publicKeyResolvers)}`);
log.info.indent (1)(`Node Cache : { stdTLL : ${ansi.magenta(AppConfig.cache.stdTTL)} , checkperiod : ${ansi.magenta(AppConfig.cache.checkperiod)} }`);
log.info(ansi.yellow('Initialized...'));
app.appConfig = AppConfig;

app.cache = new NodeCache({ stdTTL: AppConfig.cache.stdTTL, checkperiod: AppConfig.cache.checkperiod }); //stdTTL (sec), checkperiod(sec)
log.info.indent (1)('initialized NodeCache');
app.net = 'testnet';
app.log=log;
app.use(logger('dev'));
app.use(express.static('public'));
app.use(express.json());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());

app.contracts = {
  identitiyRegistry: new IdentityRegistry(app.web3, AppConfig.addresses.identityRegistry),
  publicKeyResolvers: getPublicKeyResolvers(app.web3, AppConfig.addresses.publicKeyResolvers),
  serviceKeyResolvers: getServiceKeyResolvers(app.web3, AppConfig.addresses.serviceKeyResolvers)
};

require('./routes/v1')(app);
log.info.indent (1)('initialized router');

var server = app.listen(AppConfig.port, function(){
  log.info(ansi.yellow(`Express server has started on port ${ansi.bright.green(AppConfig.port)} for ${ansi.bright.green(AppConfig.network)}`));
});