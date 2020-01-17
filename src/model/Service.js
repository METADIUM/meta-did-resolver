class Service {
    constructor (metadid,pubKey,url) {
        this.id = metadid;
        this.publicKey=pubKey;
        this.type  = 'identityHub';
        this.serviceEndpoint = url;
    }
}
export default Service;