const ServiceKeyABI = [ { "name": "removeKeyDelegated", "type": "function", "inputs": [ { "name": "associatedAddress", "type": "address" }, { "name": "key", "type": "address" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "timestamp", "type": "uint256" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "signatureTimeout", "type": "function", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "removeKeysDelegated", "type": "function", "inputs": [ { "name": "associatedAddress", "type": "address" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "timestamp", "type": "uint256" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "removeKey", "type": "function", "inputs": [ { "name": "key", "type": "address" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "isKeyFor", "type": "function", "inputs": [ { "name": "key", "type": "address" }, { "name": "ein", "type": "uint256" } ], "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "isSigned", "type": "function", "inputs": [ { "name": "_address", "type": "address" }, { "name": "messageHash", "type": "bytes32" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "constant": true, "stateMutability": "pure" }, { "name": "addKey", "type": "function", "inputs": [ { "name": "key", "type": "address" }, { "name": "symbol", "type": "string" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "addKeyDelegated", "type": "function", "inputs": [ { "name": "associatedAddress", "type": "address" }, { "name": "key", "type": "address" }, { "name": "symbol", "type": "string" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "timestamp", "type": "uint256" } ], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "getKeys", "type": "function", "inputs": [ { "name": "ein", "type": "uint256" } ], "outputs": [ { "name": "", "type": "address[]" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "name": "removeKeys", "type": "function", "inputs": [], "outputs": [], "payable": false, "constant": false, "stateMutability": "nonpayable" }, { "name": "getSymbol", "type": "function", "inputs": [ { "name": "key", "type": "address" } ], "outputs": [ { "name": "", "type": "string" } ], "payable": false, "constant": true, "stateMutability": "view" }, { "type": "constructor", "inputs": [ { "name": "identityRegistryAddress", "type": "address" } ], "payable": false, "stateMutability": "nonpayable" }, { "name": "KeyAdded", "type": "event", "inputs": [ { "name": "key", "type": "address", "indexed": true }, { "name": "ein", "type": "uint256", "indexed": true }, { "name": "symbol", "type": "string", "indexed": false } ], "anonymous": false }, { "name": "KeyRemoved", "type": "event", "inputs": [ { "name": "key", "type": "address", "indexed": true }, { "name": "ein", "type": "uint256", "indexed": true } ], "anonymous": false } ];
const ansi = require('ansicolor').nice;
const log = require('ololog').configure
({
  time: true,
  locate: true,
  tag: true
});
class ServiceKeyResolver {
    constructor (web3, address) {
        this.address = address;
        this.abi = ServiceKeyABI;
        this.instance = new web3.eth.Contract(this.abi, this.address);
        log.info.indent (1)(`Initialized ServiceKeyResolver (${ansi.magenta(address)})`);
    }
    getAddress(){
        return this.address;
    }
    async isKeyFor(key, ein) {
        if(!this.instance || !this.instance.methods.isKeyFor) return 'error';
        return this.instance.methods.isKeyFor(key, ein).call();
    }
    async getKeys(ein) {
        if(!this.instance || !this.instance.methods.getKeys) return 'error';
        return this.instance.methods.getKeys(ein).call();
    }
    async getSymbol(key) {
        if(!this.instance || !this.instance.methods.getSymbol) return 'error';
        return this.instance.methods.getSymbol(key).call();
    }
}
export default ServiceKeyResolver;