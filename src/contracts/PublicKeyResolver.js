const PublicKeyResolverABI = [ { "name": "removePublicKeyDelegated", "type": "function", "inputs": [ { "name": "associatedAddress", "type": "address" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "timestamp", "type": "uint256" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "addPublicKeyDelegated", "type": "function", "inputs": [ { "name": "associatedAddress", "type": "address" }, { "name": "publicKey", "type": "bytes" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "timestamp", "type": "uint256" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "addPublicKey", "type": "function", "inputs": [ { "name": "publicKey", "type": "bytes" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "signatureTimeout", "type": "function", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "getPublicKey", "type": "function", "inputs": [ { "name": "addr", "type": "address" } ], "outputs": [ { "name": "", "type": "bytes" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "isSigned", "type": "function", "inputs": [ { "name": "_address", "type": "address" }, { "name": "messageHash", "type": "bytes32" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "constant": true, "stateMutability": "pure" }, { "name": "removePublicKey", "type": "function", "inputs": [], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "NAME", "type": "function", "inputs": [], "outputs": [ { "name": "", "type": "string" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "calculateAddress", "type": "function", "inputs": [ { "name": "publicKey", "type": "bytes" } ], "outputs": [ { "name": "addr", "type": "address" } ], "payable": false, "constant": true, "stateMutability": "pure" }, { "type": "constructor", "inputs": [ { "name": "identityRegistryAddress", "type": "address" } ], "payable": false, "stateMutability": "nonpayable" }, { "name": "PublicKeyAdded", "type": "event", "inputs": [ { "name": "addr", "type": "address", "indexed": true }, { "name": "ein", "type": "uint256", "indexed": true }, { "name": "publicKey", "type": "bytes", "indexed": false }, { "name": "delegated", "type": "bool", "indexed": false } ], "anonymous": false }, { "name": "PublicKeyRemoved", "type": "event", "inputs": [ { "name": "addr", "type": "address", "indexed": true }, { "name": "ein", "type": "uint256", "indexed": true }, { "name": "delegated", "type": "bool", "indexed": false } ], "anonymous": false } ];
const ansi = require('ansicolor').nice;
const log = require('ololog').configure
({
  time: true,
  locate: true,
  tag: true
});
class PublicKeyResolver {
    constructor (web3, address) {
        this.address = address;
        this.abi = PublicKeyResolverABI;
        this.instance = new web3.eth.Contract(this.abi, this.address);
        log.info.indent (1)(`Initialized PublicKeyResolver (${ansi.magenta(address)})`);
    }
    getAddress(){
        return this.address;
    }
    getPublicKey(key) {
        if(!this.instance || !this.instance.methods.getPublicKey) return 'error';
        return this.instance.methods.getPublicKey(key).call().then();
    }
}
export default PublicKeyResolver;