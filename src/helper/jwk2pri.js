var didAuth = require('@decentralized-identity/did-auth-jose');
const ecKey = require('ec-key');
const crypto = require('crypto');


function privateKeyToJWK(privateKeyHex, kid) {
    const privateKey = new Buffer(privateKeyHex, 'hex');
    var ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);

    var key = new ecKey({
        privateKey: ecdh.getPrivateKey(),
        publicKey: ecdh.getPublicKey(),
        curve: 'secp256k1'
      });

    var jwk = Object.assign(key.toJSON(), {
        kid: kid,
        alg: 'ES256K',
        key_ops: ['Sign', 'Verify']
    });

    return didAuth.EcPrivateKey.wrapJwk(kid, jwk);
}

function jwkToPrivateKey(jwk) {
    const key = new ecKey(jwk);
    var ecdhkey = key.createECDH("seck256k1");
    return ecdhkey.getPrivateKey().toString('hex');

}

const privateKeyHex = '01b149603ca8f537bbb4e45d22e77df9054e50d826bb5f0a34e9ce460432b596';
console.log('PrivateKeyHex : '+privateKeyHex);
var jwk = privateKeyToJWK(privateKeyHex, 'did:meta:testnet:0000000000000000000000000000000000000000000000000000000000000004#MetaManagementKey#961c20596e7ec441723fbb168461f4b51371d8aa');
console.log('====== JWK ======');
console.log(jwk);
console.log('====== JWK ======');
var key = jwkToPrivateKey(jwk);
console.log('OutoutPrivateKeyHex : '+key);


