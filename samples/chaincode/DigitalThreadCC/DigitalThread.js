
'use strict'
const shim = require('fabric-shim')
const util = require('util')

// ===============================================
// Chaincode name:[DigitalThread.js]
// Asset key:[digitalTwin]
// Asset values:[id,history,dataAssociated,sharedWith]
// ===============================================

let Chaincode = class {
    async Init(stub) {
        let ret = stub.getFunctionAndParameters()
        console.info(ret)
        console.info('=========== Instantiated Chaincode ===========')
        return shim.success()
    }

    async Invoke(stub) {
        console.info('Transaction ID: ' + stub.getTxID())
        console.info(util.format('Args: %j', stub.getArgs()))

        let ret = stub.getFunctionAndParameters()
        console.info(ret)

        let method = this[ret.fcn]
        try {
            if (!method) {
                console.log('no function of name:' + ret.fcn + ' found')
                throw new Error('Received unknown function ' + ret.fcn + ' invocation')
            }
        
            let payload = await method(stub, ret.params, this)
            return shim.success(payload)
        } catch (err) {
            console.log(err)
            return shim.error(err)
        }
    }

    // ===============================================
    // Insert Asset - insert Asset to chaincode state
    // ===============================================

    async insertDeviceLot(stub, args, thisClass) {
        if(args.length != 1){
            throw new Error('Incorrect number of arguments. Expecting 1.')
        }
        let inputData = JSON.parse(args[0])
        let id = inputData['id']
        let digitalTwin = inputData['digitalTwin']
        let history = inputData['history']
        let dataAssociated = inputData['dataAssociated']
        let sharedWith = inputData['sharedWith']
        let manufacturer = inputData['manufacturer']

        let assetState = await stub.getState(id)
        if (assetState.toString()) {
            throw new Error('This asset already exists: ' + id)
        }
        let asset = {}
        asset.docType = "Digital Twin of Medical Devices"
        asset.digitalTwin = digitalTwin
        asset.id = id
        asset.history = history
        asset.dataAssociated = dataAssociated
        asset.sharedWith = sharedWith
        asset.manufacturer = manufacturer
        asset.currentOwner = manufacturer
        asset.currentPackageCount = 100
        asset.packageTwin = digitalTwin

        await stub.putState(id, Buffer.from(JSON.stringify(asset)))
    }

    async getDeviceDetails(stub, args, thisClass) {
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments. Expecting name of the asset to query')
        }
        let inputData = JSON.parse(args[0])
        let key = inputData['key']
        if (!key) {
            throw new Error(' Asset key must not be empty')
        }

        let assetAsBytes = await stub.getState(key)
        if (!assetAsBytes.toString()) {
            let jsonResp = {}
            jsonResp.Error = 'Asset does not exist: ' + key
            throw new Error(JSON.stringify(jsonResp))
        }

        console.info('=======================================')
        console.log(assetAsBytes.toString())
        console.info('=======================================')
        return assetAsBytes
    }
  
    async updateDeviceOrderId(stub, args, thisClass) {
        if (args.length < 1) {
			throw new Error('Incorrect number of arguments. Expecting key and new value.')
        }
        let inputData = JSON.parse(args[0])
        let key = inputData['id']
        let assetAsBytes = await stub.getState(key)
		if (!assetAsBytes || !assetAsBytes.toString()) {
			throw new Error('Asset does not exist')
		}
		let asset = {}
		try {
			asset = JSON.parse(assetAsBytes.toString())
		} catch (err) {
			let jsonResp = {}
			jsonResp.error = 'Failed to decode JSON of: ' + key
			throw new Error(jsonResp)
		}
        console.info(asset)
        if(inputData['digitalTwin'] && inputData['digitalTwin'] != ''){
            asset.digitalTwin = inputData['digitalTwin']
            asset.packageTwin = inputData['digitalTwin']
        }
        if(inputData['dataAssociated'] && inputData['dataAssociated'] != ''){
            asset.dataAssociated = inputData['dataAssociated']
        }
        if(inputData['history'] && inputData['history'] != ''){
            asset.history = inputData['history']
        }
        if(inputData['currentOwner'] && inputData['currentOwner'] != ''){
            asset.currentOwner = inputData['currentOwner']
        }
        if(inputData['currentPackageCount'] && inputData['currentPackageCount'] != ''){
            asset.currentPackageCount = inputData['currentPackageCount']
        }
        let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
    }

    // ===============================================
    // getHistoryForAsset - gets all previous transactions for asset
    // ===============================================
    async getHistoryForAsset(stub, args, thisClass) {
        if (args.length < 1) {
        throw new Error('Incorrect number of arguments. Expecting 1')
        }
        let key = args[0]
        console.info('- start getHistoryForAsset: %s', key)
    
        let resultsIterator = await stub.getHistoryForKey(key)
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, true)
    
        return Buffer.from(JSON.stringify(results))
    }

    
    async getAssetByKeyRange(stub, args, thisClass) {
        if (args.length < 2) {
            throw new Error('Incorrect number of arguments. Expecting 2')
        }

        let startKey = args[0]
        let endKey = args[1]

        let resultsIterator = await stub.getStateByRange(startKey, endKey)
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)

        return Buffer.from(JSON.stringify(results))
    }
    // ===============================================
    // getAllResults - packs the results to JSON array
    // ===============================================
    async getAllResults(iterator, isHistory) {
        let allResults = []
        while (true) {
        let res = await iterator.next()

        if (res.value && res.value.value.toString()) {
            let jsonRes = {}
            console.log(res.value.value.toString('utf8'))
            if (isHistory && isHistory === true) {
                jsonRes.TxId = res.value.tx_id
                jsonRes.Timestamp = res.value.timestamp
                jsonRes.IsDelete = res.value.is_delete.toString()
                try {
                    jsonRes.Value = JSON.parse(res.value.value.toString('utf8'))
                } catch (err) {
                    console.log(err)
                    jsonRes.Value = res.value.value.toString('utf8')
                }
            } else {
                jsonRes.Key = res.value.key
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'))
                } catch (err) {
                    console.log(err)
                    jsonRes.Record = res.value.value.toString('utf8')
                }
            }
            allResults.push(jsonRes)
        }
        if (res.done) {
            console.log('end of data')
            await iterator.close()
            console.info(allResults)
            return allResults
            }
        }
    }
  
    // ===============================================
    //  Ad hoc rich query
    // ===============================================
    async queryAssets(stub, args, thisClass) {
        if (args.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting queryString')
        }
        let queryString = args[0]
        if (!queryString) {
            throw new Error('queryString must not be empty')
        }
        let method = thisClass['getQueryResultForQueryString']
        let queryResults = await method(stub, queryString, thisClass)
        return queryResults
    }
  
    // =========================================================================================
    // getQueryResultForQueryString executes the passed in query string.
    // Result set is built and returned as a byte array containing the JSON results.
    // =========================================================================================
    async getQueryResultForQueryString(stub, queryString, thisClass) {
        console.info('- getQueryResultForQueryString queryString:' + queryString)
        let resultsIterator = await stub.getQueryResult(queryString)
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }

    async getDeviceByDigitalTwin(stub, args, thisClass) {
        let inputData = JSON.parse(args[0])
        let digitalTwin = inputData['digitalTwin']
        let queryString = {
            "selector": {
                "digitalTwin": digitalTwin
            },
            "use_index": ["_design/digitalTwinIndexDoc", "digitalTwinIndex"]
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }

    async getOrderByItemDetails(stub, args, thisClass){
        let inputData = JSON.parse(args[0])
        let item_number = inputData['item_number']
        let currentOwner = inputData['currentOwner']
        var queryString = {
            "selector":{
                "currentOwner": currentOwner,
                "dataAssociated":{
                    "package_details":{
                        "item_number": item_number
                    }
            }}
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }
  
}
shim.start(new Chaincode())