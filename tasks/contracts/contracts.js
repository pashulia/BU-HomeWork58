const { log } = require('console');
const ethers = require('ethers');
const fs = require('fs');
const solc = require('solc');

function myCompiler(solc, fileName, contractName, contractCode) {
    // настраиваем структуру input для компилятора
    let input = {
        language: 'Solidity',
        sources: {
            [fileName]: {
                content: contractCode
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    let output = JSON.parse(solc.compile(JSON.stringify(input)));
    let ABI = output.contracts[fileName][contractName].abi;
    let bytecode = output.contracts[fileName][contractName].evm.bytecode.object;

    fs.writeFileSync(__dirname + '/' + contractName + '.abi', JSON.stringify(ABI));
    fs.writeFileSync(__dirname + '/' + contractName + '.bin', bytecode);

    return output.contracts[fileName][contractName];   
}

async function main() {
    let endPointLocal = 'http://127.0.0.1:7545';
    const provider = new ethers.providers.JsonRpcProvider(endPointLocal);
    const list = await provider.listAccounts();
    const signer = provider.getSigner(list[0]);

    const fName = 'Caller.sol';
    const cName = 'Caller';
    const cCode = fs.readFileSync(__dirname + '/' + fName, 'utf-8');
    
    let callerFactory = ethers.ContractFactory.fromSolidity(myCompiler(solc, fName, cName, cCode));
    callerFactory = callerFactory.connect(signer);

    const fiName = 'Respondent.sol';
    const coName = 'Respondent';
    const coCode = fs.readFileSync(__dirname + '/' + fiName, 'utf-8');
    
    let respondentFactory = ethers.ContractFactory.fromSolidity(myCompiler(solc, fiName, coName, coCode));
    respondentFactory = respondentFactory.connect(signer);

    let caller = await callerFactory.deploy();
    await caller.deployed();

    let respondent = await respondentFactory.deploy();
    await respondent.deployed();

    console.log(respondent);
    
    let callerABI = fs.readFileSync(__dirname + '/' + "Caller.abi", "utf-8");
    let callerInteface = new ethers.utils.Interface(callerABI);
    console.log(callerInteface);

    let respondentABI = fs.readFileSync(__dirname + '/' + "Respondent.abi", "utf-8");
    let respondentInteface = new ethers.utils.Interface(respondentABI);
    console.log(respondentInteface);

    let topics = respondentInteface.encodeFilterTopics("eventCall", []);

    let filter = {
        address: respondent.address,
        topics: topics
    };

    provider.on(filter, log => {
        console.log("=== EVENT START ===");
        console.log(log);
        console.log("=== EVENT END ===");
        console.log(respondentInteface.decodeEventLog("eventCall", log.data, log.topics));
    });

    let payload = respondentInteface.encodeFunctionData("target", [
        100, 
        respondent.address, 
        "hi"
    ]);

    let tx = await caller.call(respondent.address, payload);
    await tx.wait();
}

main();