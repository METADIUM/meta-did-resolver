import DIDDocument from '../model/DIDDocument.js';
import PublicKey from '../model/PublicKey.js';
import Service from '../model/Service.js';

export default function(app)
{
    const prefixURI ='/1.0';
    const methodMetadata = {
        network:app.appConfig.network,
        registryAddress:app.appConfig.addresses.identityRegistry
    };
    const NETWORK_MANNET="mainnet";
    const method = app.appConfig.method.toLowerCase()||'meta';
    const network_pattern = (['mainnet','testnet'].includes(app.appConfig.network.toLowerCase()))? '' : `|${app.appConfig.network.toLowerCase()}`;
    const did_pattern = `did:${method}:(?:(testnet|mainnet${network_pattern}):)?([0-9a-f]{64})`;
    
    app.log.info(`DID method is ${method} `);
    app.log.info(`DID Network is ${app.appConfig.network.toLowerCase()} `);
    app.log.info(`DID Pattern is ${did_pattern} `);

    // DID Discovery  GET /identifier/:DID
    app.get(prefixURI+'/identifiers/:did', async function (req, res){
        const { headers } = req;
        const nocache = headers['no-cache'] || false;  
        let retrieved = new Date();
        let startTime = new Date().getTime();
        let metaDID = req.params.did.toLowerCase();
        app.log.debug(`GET DID: ${metaDID}, no-cache: ${nocache}`);

        let did_regex = new RegExp(did_pattern,'i');
        let matcher = did_regex.exec(metaDID);
        if (matcher == null) {
            res.status(400).json({success:false, message: `invalid ${method} did`});
            return;
        }

        let net = NETWORK_MANNET;
        if (matcher[1]){
            net = matcher[1].toLowerCase();
            if(matcher[1] === NETWORK_MANNET){
               metaDID = `did:${method}:${matcher[2]}`;
               app.log.debug('converted DID:', metaDID);
            }
        }
        
        if (app.appConfig.network !== net) {
            app.log.debug(`not found in ${app.appConfig.network} `);
            res.status(404).json({success:false, message:`This server is DID resolver for ${app.appConfig.network}`});
            return;
        }
        let metaid = '0x'+matcher[2];
        // if nocache is false, use cache
        if(nocache === false){
            let cachedDoc = app.cache.get( metaid );
            if ( cachedDoc != undefined ){
                app.log.debug(`find in cache `);
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
            let identityExists = await app.contracts.identitiyRegistry.identityExists(metaid);
            if (identityExists === null ){
                res.status(500).json({success:false, message:"Contract Connection Error"});
                return;
            }
            if (!identityExists){
                res.status(404).json({success:false, message:"not found"});
                return; 
            }
            let identity = await app.contracts.identitiyRegistry.getIdentity(metaid);
            if( typeof identity.associatedAddresses === 'object' && Array.isArray(identity.associatedAddresses) && identity.associatedAddresses.length === 0 ){
                res.status(404).json({success:false, message: `deleted ${method} id`});
            return;
            }

            let pubKeyContract = [];
            let svcKeyContract = [];
            for (let idx in identity.resolvers) {
                let addr = identity.resolvers[idx];
                let publicKeyContract = app.contracts.publicKeyResolvers.find(function (contract){
                    return addr.toLowerCase() == contract.getAddress().toLowerCase();
                });

                if (publicKeyContract != null){
                    pubKeyContract.push(publicKeyContract);
                }else{
                    let serviceKeyContract = app.contracts.serviceKeyResolvers.find(function (contract){
                        return addr.toLowerCase() == contract.getAddress().toLowerCase();
                    });
                    if (serviceKeyContract != null){
                        svcKeyContract.push(serviceKeyContract);
                    }
                }
            }

            let publicKeyList = [];
            let authNList = [];
            for (let idx in identity.associatedAddresses) {
                let addr = identity.associatedAddresses[idx];
                let keyObj = new PublicKey(metaDID,"MetaManagementKey", addr);

                for (let idx2 in pubKeyContract) {
                    let pkrObj = pubKeyContract[idx2];
                    let pubKey = await pkrObj.getPublicKey(addr);
                    if(pubKey!= null && pubKey !=='0x') {
                        keyObj.setPublicKey(pubKey);
                        break;
                    }
                }
                publicKeyList.push(keyObj);
                authNList.push(keyObj.getId());
            }
            for (let idx in svcKeyContract){
                let skcObj = svcKeyContract[idx];
                let serviceKeyAddrList = await skcObj.getKeys(metaid);
                for (let idx2 in serviceKeyAddrList){
                    let addr = serviceKeyAddrList[idx2];
                    let symbol = await skcObj.getSymbol(addr);
                    let keyObj = new PublicKey(metaDID,symbol, addr);
                    publicKeyList.push(keyObj);
                    authNList.push(keyObj.getId());
                }
            }
        
            let serviceList = [];
            if (app.appConfig.identityHub != null){
                serviceList.push(new Service(app.appConfig.identityHub.id, publicKeyList[0].getId(), app.appConfig.identityHub.url));
            }

            //GET ServiceKey
            //GET PublicKey
            let doc = new DIDDocument(metaDID);
            doc.setPublicKey(publicKeyList);
            doc.setAuthentication(authNList);
            doc.setService(serviceList);
            let isCached = app.cache.set( metaid, doc );
            let endTime = new Date().getTime();
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

    // DID purge Cache PURGE /identifier/:did
    app.purge(prefixURI+'/identifiers/:did', async function (req, res){
        let metaDID = req.params.did.toLowerCase();
       
        let did_regex = new RegExp(did_pattern,'i');
        //let matcher = regex.exec(metaDID);
        let matcher = did_regex.exec(metaDID);
        if (matcher == null) {
            res.status(400).json({success:false, message:'invalid DID format'});
        }

        let net = 'mainnet';
        if (matcher[1]){
            net = matcher[1].toLowerCase();
            if(matcher[1] === 'mainnet'){
                metaDID = `did:${method}:${matcher[2]}`;
                app.log.debug('coverted DID:', metaDID);
            }
        }
        
        if (app.appConfig.network !== net) {
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
        ttl:(ttl !== undefined)?`${ttl} ms` :'0 ms'
    };
}
