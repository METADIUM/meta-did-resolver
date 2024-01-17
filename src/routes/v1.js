//const DIDDocument = require('../model/DIDDocument.js');
import DIDDocument from '../model/DIDDocument';
import PublicKey from '../model/PublicKey';
import Service from '../model/Service';

module.exports = function(app)
{
    const prefixURI ='/1.0';
    const methodMetadata = {
        network:app.appConfig.network,
        registryAddress:app.appConfig.addresses.identityRegistry
    };
   
    // // DID Discovery  GET /identifier/:DID
    app.get(prefixURI+'/identifiers/:meta_did', async function (req, res){
        const { headers } = req;
        const nocache = headers['no-cache'] || false; 
        console.log('no-cache:',nocache);
        let retrieved = new Date();
        let startTime = new Date().getTime();
        let metaDID = req.params.meta_did.toLowerCase();
       
        let regex = new RegExp(`did:${app.appConfig.method}:(?:(testnet|mainnet|enterprise):)?([0-9a-f]{64})`,'i');
        let matcher = regex.exec(metaDID);
        if (matcher == null) {
            res.status(400).json({success:false, message:'invalid did'});
            return;
        }

        let net = 'mainnet';
        if (matcher[1]){
            net = matcher[1].toLowerCase();
            if(matcher[1] === 'mainnet'){
               metaDID = `did:${app.appConfig.method}:${matcher[2]}`;
               app.log.info('converted DID:', metaDID);
            }
        }
        //let net = matcher[1] ? matcher[1].toLowerCase():'mainnet';
        
        app.log.info(`net is ${net} `);

        if (app.appConfig.network !== net) {
            app.log.info(`not found in ${app.network} `);
            res.status(404).json({success:false, message:`This server is DID resolver for ${app.appConfig.network}`});
            return;
        }
        let metaid = '0x'+matcher[2];
        // if nocache is false, use cache
        if(nocache === false){
            let cachedDoc = app.cache.get( metaid );
            if ( cachedDoc != undefined ){
                let ttl = app.cache.getTtl( metaid );
                let endTime = new Date().getTime();
                res.json({
                    redirect: null, 
                    didDocument:cachedDoc, 
                    resolverMetadata:getResolverMetadata(app,retrieved, endTime - startTime,true,ttl - endTime),
                    methodMetadata: methodMetadata
                });

                return;
            }
        }
        try {
        app.log.info(`DID : ${metaDID} / ${net} / ${metaid}`);
        let identityExists = await app.contracts.identitiyRegistry.identityExists(metaid);
        app.log.info(`identityExists: [${identityExists}]`);
        if (identityExists === null ){
            res.status(500).json({success:false, message:"Contract Connection Error"});
            return;
        }
        if (!identityExists){
            res.status(404).json({success:false, message:"not found"});
            return; 
        }
        let identity = await app.contracts.identitiyRegistry.getIdentity(metaid);
        app.log.info(`Identity :${JSON.stringify(identity)}`);

        app.log.info(`identity.associatedAddresses : ${typeof identity.associatedAddresses}`);
        app.log.info(`identity.associatedAddresses : [${identity.associatedAddresses}]`);
        if( typeof identity.associatedAddresses === 'object' && Array.isArray(identity.associatedAddresses) && identity.associatedAddresses.length === 0 ){
            res.status(404).json({success:false, message:"deleted meta id"});
           return;
        }

        let pubKeyContract = [];
        let svcKeyContract = [];
        for (let idx in identity.resolvers) {
            let addr = identity.resolvers[idx];
        // identity.resolvers.forEach(function (addr) {
            let publicKeyContract = app.contracts.publicKeyResolvers.find(function (contract){
                app.log.info(`check pubkeyContract ${addr.toLowerCase()} / ${contract.getAddress().toLowerCase()}`);
                return addr.toLowerCase() == contract.getAddress().toLowerCase();
            });

            if (publicKeyContract != null){
                pubKeyContract.push(publicKeyContract);
                app.log.info(`add PubKeyContract ${publicKeyContract.getAddress()}`);
            } else {
                app.log.info(`not add PubKeyContract`);
                let serviceKeyContract = app.contracts.serviceKeyResolvers.find(function (contract){
                    app.log.info(`check svckeyContract ${addr.toLowerCase()} / ${contract.getAddress().toLowerCase()}`);
                    return addr.toLowerCase() == contract.getAddress().toLowerCase();
                });
                if (serviceKeyContract != null){
                    svcKeyContract.push(serviceKeyContract);
                    app.log.info(`add serviceKeyContract ${serviceKeyContract.getAddress()}`);
                } else {
                    app.log.info(`not add serviceKeyContract`);
                }
            }
        // });
        }

        app.log.info('pubKeyContract length :', pubKeyContract.length);
        app.log.info('svcKeyContract length :', svcKeyContract.length);

        let publicKeyList = [];
        let authNList = [];
        for (let idx in identity.associatedAddresses) {
            let addr = identity.associatedAddresses[idx];
            let keyObj = new PublicKey(metaDID,"MetaManagementKey", addr);
          
            app.log.info(`Added address : ${JSON.stringify(keyObj)}`);

            for (let idx2 in pubKeyContract) {
                let pkrObj = pubKeyContract[idx2];
                let pubKey = await pkrObj.getPublicKey(addr);
                app.log.info('publicKey',pubKey);
                if(pubKey!= null && pubKey !=='0x') {
                    // let authObj = new Authentication(addr,pubKey);
                    // authNList.push(authObj);
                    // app.log.info('Added Publickey',pubKey);
                    keyObj.setPublicKey(pubKey);
                    break;
                }
            }
            publicKeyList.push(keyObj);
            authNList.push(keyObj.getId());
        }
        app.log.info(`finish PublicKey`);
        for (let idx in svcKeyContract) {
            let skcObj = svcKeyContract[idx];
            let serviceKeyAddrList = await skcObj.getKeys(metaid);
            for (let idx2 in serviceKeyAddrList){
                let addr = serviceKeyAddrList[idx2];
                let symbol = await skcObj.getSymbol(addr);
                publicKeyList.push(keyObj);
                authNList.push(keyObj.getId());
            }
        }
	
        let serviceList = [];
        if (app.appConfig.identityHub != null) {
            serviceList.push(new Service(app.appConfig.identityHub.id, publicKeyList[0].getId(), app.appConfig.identityHub.url));
        }

        app.log.info(`finish service`);
        //GET ServiceKey
        //GET PublicKey
        let doc = new DIDDocument(metaDID);
        doc.setPublicKey(publicKeyList);
        doc.setAuthentication(authNList);
        doc.setService(serviceList);
        app.log.info(`finish making Doc`);
        let isCached = app.cache.set( metaid, doc );

        app.log.info(`finish caching`);
        let endTime = new Date().getTime();
        app.log.info(`End - ${endTime - startTime}ms`);
        res.json(
            {redirect: null, 
            didDocument:doc, 
            resolverMetadata:getResolverMetadata(app, retrieved, endTime - startTime,false),
            methodMetadata: methodMetadata}
            );
        }catch(e){
            app.log.error(e);
            res.status(500).json({success:false,message:"Internal Error"});
        }
    });

    // DID purge Cache PURGE /identifier/:metaDID/cache
    app.purge(prefixURI+'/identifiers/:meta_did', async function (req, res){
        let metaDID = req.params.meta_did.toLowerCase();
       
        let regex = new RegExp(`did:${app.appConfig.method}:(?:(testnet|mainnet|enterprise):)?([0-9a-f]{64})`,'i');
        let matcher = regex.exec(metaDID);
        if (matcher == null) {
            res.status(400).json({success:false, message:'invalid meta did'});
        }

        let net = 'mainnet';
        if (matcher[1]){
            net = matcher[1].toLowerCase();
            if(matcher[1] === 'mainnet'){
               metaDID = `did:${app.appConfig.method}:${matcher[2]}`;
               app.log.info('coverted DID:', metaDID);
            }
        }
        
        app.log.info(`net is ${net} `);

        if (app.appConfig.network !== net) {
            app.log.info(`not found in ${app.network} `);
            res.status(404).json({success:false, message:`This server is DID resolver for ${app.appConfig.network}`});
            return;
        }
        let metaid = '0x'+matcher[2];
        let cachedCounts = app.cache.del(metaid);
        
        if ( cachedCounts == 0 ){
            res.status(202).json({success:true, message:`Not found DID data(${metaDID}) in cache.`});
            return;
        }
        app.log.info(`Cache purging of '${metaDID}' has been completed`);
        res.status(200).json({success:true, message:`Cache purging of '${metaDID}' has been completed`});
        return;
    });
}

function getResolverMetadata (app, retrieved, duration, isCached,ttl ){
    return {
        driverId:app.appConfig.driverId,
        "driver":"HttpDriver",
        retrieved:retrieved, //.toUTCString()
        duration:`${duration} ms`,
        cached:isCached,
        ttl:`${ttl} ms`
    };
}
