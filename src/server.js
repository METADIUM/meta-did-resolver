import express from 'express';
import morgan from 'morgan';
import {ansi,log} from './helper/logHelper.js';
import Web3 from 'web3';
import AppConfig from '../conf/config.json' assert { type: 'json' };
import {IdentityRegistry, getPublicKeyResolvers, getServiceKeyResolvers} from './contracts/index.js';
import NodeCache from 'node-cache';

if (AppConfig.method !== AppConfig.method.toLowerCase() || AppConfig.network !== AppConfig.network.toLowerCase()){
  log.error(ansi.red('Did method & network only allow lowercase letters. Please modify the config.json file.'));  
  process.exit(1);
}
const port = process.env.PORT || AppConfig.port;

const app = express();

app.use(morgan(':date[iso]    ACCESS\t:method :url :status :response-time ms - :res[content-length]'));
app.use(express.static('public'));
app.use(express.json());

app.log=log;
app.web3 = new Web3(AppConfig.url);
app.appConfig = AppConfig;

log.info(ansi.yellow('Configuration'));
log.info(`  web3Config.URL : ${ansi.bright.green(AppConfig.url)}`);
log.info(`  Identity Registry : ${ansi.magenta(AppConfig.addresses.identityRegistry)}`);
log.info(`  ServiceKey Resolvers :${ansi.magenta(AppConfig.addresses.serviceKeyResolvers)}`);
log.info(`  PublicKey Resolvers : ${ansi.magenta(AppConfig.addresses.publicKeyResolvers)}`);
log.info(`  Node Cache : { stdTLL : ${ansi.magenta(AppConfig.cache.stdTTL)} , checkperiod : ${ansi.magenta(AppConfig.cache.checkperiod)} }`);

log.info(ansi.yellow('Initialized...'));
app.cache = new NodeCache({ stdTTL: AppConfig.cache.stdTTL, checkperiod: AppConfig.cache.checkperiod }); //stdTTL (sec), checkperiod(sec)
log.info('  Initialized NodeCache');

app.contracts = {
  identitiyRegistry: new IdentityRegistry(app.web3, AppConfig.addresses.identityRegistry),
  publicKeyResolvers: getPublicKeyResolvers(app.web3, AppConfig.addresses.publicKeyResolvers),
  serviceKeyResolvers: getServiceKeyResolvers(app.web3, AppConfig.addresses.serviceKeyResolvers)
};

import routesV1 from './routes/v1.js';
routesV1(app);
log.info('  initialized Router');

let server = app.listen(port, function(){
  log.info(ansi.yellow(`DID Resolver has started on port ${ansi.bright.green(port)} for ${ansi.bright.green(AppConfig.network)}`));
});