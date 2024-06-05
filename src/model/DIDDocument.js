class DIDDocument {
    constructor(did){
        this['@context'] = 'https://w3id.org/did/v0.11';
        this.id = did;
        this.publicKey = [];
        this.authentication = [];
        this.service = [];

    }
    setPublicKey( keys){
        this.publicKey = keys;
    }
    setAuthentication(authentications){
        this.authentication = authentications;
    }
    setService( services){
        this.service = services;
    }
   
}
export default DIDDocument;