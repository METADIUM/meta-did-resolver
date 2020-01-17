class PublicKey {
    constructor (did, keyId, address, pubKey) {
       
        this.id = did+'#'+keyId+'#'+ address.slice(2).toLowerCase();
        this.type  = 'EcdsaSecp256k1VerificationKey2019'; //'Secp256k1VerificationKey2018';
        this.controller = did;
        if(address != null)  this.publicKeyHash =  address.slice(2).toLowerCase();
        if(pubKey != null)  this.publicKeyHex = pubKey.slice(2).toLowerCase();
    }
    getId(){
        return this.id;
    }
    setPublicKey(pubKey){
        delete this.publicKeyHash;
        this.publicKeyHex =  '04'+pubKey.slice(2).toLowerCase();
    }
    setPublicKeyJwk(jwk){
        this.publicKeyJwk =  jwk;
    }
}
export default PublicKey;