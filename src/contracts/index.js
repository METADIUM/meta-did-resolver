import IdentityRegistry from './IdentityResitry.js';
import ServiceKeyResolver from './ServiceKeyResolver.js';
import PublicKeyResolver from './PublicKeyResolver.js';



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