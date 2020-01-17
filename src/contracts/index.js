//import { initContractsAddresses } from '../addresses';

import IdentityRegistry from './IdentityResitry';
import ServiceKeyResolver from './ServiceKeyResolver';
import PublicKeyResolver from './PublicKeyResolver';
// const IdentityRegistry = require('./IdentityResitry');
// const PublicKeyResolver = require('./PublicKeyResolver');
// const ServiceKeyResolver = require('./ServiceKeyResolver');


function getServiceKeyResolvers(web3, addresses ) {
  let contracts = [];
  addresses.forEach(function(address){
    // let contract = { address: address, contract: new ServiceKeyResolver(web3,address)}; 
    // contracts.push(contract);
    contracts.push (new ServiceKeyResolver(web3,address));
  });
  return contracts;
}

function getPublicKeyResolvers(web3, addresses ) {
  let contracts = [];
  addresses.forEach(function(address){
    // let contract = { address: address, contract: new PublicKeyResolver(web3,address)}; 
    // contracts.push(contract);
      contracts.push (new PublicKeyResolver(web3,address));
  });
  return contracts;
}

export {
    IdentityRegistry,
    ServiceKeyResolver,
    PublicKeyResolver,
    getPublicKeyResolvers,
    getServiceKeyResolvers,
  };
  // module.exports = {
  //   IdentityRegistry: IdentityRegistry,
  //   ServiceKeyResolver: ServiceKeyResolver,
  //   PublicKeyResolver: PublicKeyResolver,
  //   getPublicKeyResolvers: getPublicKeyResolvers,
  //   getServiceKeyResolvers: getServiceKeyResolvers,
  // }



/*
const IdentityRegistry = new IdentityRegistry(web3);
const identity = await this.IdentityRegistry.getIdentity(metaID);
const resolverAddress = identity.resolvers[0];

this.serviceKey = new ServiceKey(web3, resolverAddress);
const result = this.serviceKey.isKeyFor(serviceID, metaID);
*/