
'use strict'
const shim = require('fabric-shim')
const util = require('util')

// ===============================================
// Chaincode name:[returncontract.js]
// Asset key:[returnid]
// Asset values:[itemdetails,returndetails]
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
    async recordReturnOrder(stub, args, thisClass) {
        if (args.length != 1) { 
            throw new Error('Incorrect number of arguments. Expecting 3.')
        }
        let inputData = JSON.parse(args[0])
        let returnid = inputData['returnid'] 
        let assetState = await stub.getState(returnid)
        if (assetState.toString()) {
            throw new Error('This asset already exists: ' + returnid)
        }
            console.info('--- start insertAsset ---')
        let itemdetails = inputData['itemdetails'] 
        let returndetails = inputData['returndetails'] 


        if (itemdetails.length <= 0) { 
            throw new Error('Argument itemdetails must be a non-empty string') 
        }	if (returndetails.length <= 0) { 
            throw new Error('Argument returndetails must be a non-empty string') 
        }
        let asset = {}
        asset.docType = "return order"
        asset.returnid = returnid
        asset.itemdetails = itemdetails
        asset.returndetails = returndetails

        await stub.putState(returnid, Buffer.from(JSON.stringify(asset)))

    }

    // ===============================================
    // Read Asset - read an asset from chaincode state by key
    // ===============================================
    async getReturnOrderDetails(stub, args, thisClass) {
        if (args.length != 1) {
            new Error('Incorrect number of arguments. Expecting name of the asset to query')
        }
        let inputData = JSON.parse(args[0])
        let key = inputData['returnid']
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
  
    async updateReturnOrder(stub, args, thisClass) {
        if(args.length != 1){
            throw new Error('Incorrect number of arguments.')
        }
        let inputData = JSON.parse(args[0])
        let key = inputData['returnid']
        console.info('- Start updating asset - ')
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
        if(inputData['itemdetails'] && inputData['itemdetails'] != ''){
            asset.itemdetails = inputData['itemdetails']
        }
        if(inputData['returndetails'] && inputData['returndetails'] != ''){
            asset.itemdetails = inputData['itemdetails']
        }
        let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
    }

    // ===========================================================
    // Update Asset Attributes - each method updates an asset for a certain field
    // ===========================================================
    async updateAssetItemdetails(stub, args, thisClass) {
		if (args.length < 2) {
			throw new Error('Incorrect number of arguments. Expecting key and new value.')
		}
		let key = args[0]
		let newValue = args[1]
		console.info('- Start updating asset - ')
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
		asset.itemdetails = newValue
		let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
	}

	async updateAssetReturndetails(stub, args, thisClass) {
		if (args.length < 2) {
			throw new Error('Incorrect number of arguments. Expecting key and new value.')
		}
		let key = args[0]
		let newValue = args[1]
		console.info('- Start updating asset - ')
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
		asset.returndetails = newValue
		let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
	}


    // ==================================================
    // Delete Asset - remove an asset key/value pair from state
    // ==================================================
    async delete(stub, args, thisClass) {
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments. Expecting name of the asset to delete')
        }
        let keyName = args[0]
        if (!keyName) {
            throw new Error('key name must not be empty')
        }
        let valAsbytes = await stub.getState(keyName) 
        let jsonResp = {}
        if (!valAsbytes) {
            jsonResp.error = 'key does not exist: ' + name
            throw new Error(jsonResp)
        }
        let asset = {}
        try {
            asset = JSON.parse(valAsbytes.toString())
        } catch (err) {
            jsonResp = {}
            jsonResp.error = 'Failed to decode JSON of: ' + keyName
            throw new Error(jsonResp)
        }
        await stub.deleteState(keyName) 
    }
  
    // ===========================================================================================
    // Read Assets By Key Range - performs a range query based on the start and end keys provided.
    // ===========================================================================================
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

    async getRecordByBuyer(stub, args, thisClass){
        let inputData = JSON.parse(args[0])
        let buyer_id = inputData['buyer_id']
        let queryString = {
            "selector": {
                "returndetails": {
                    "buyer_data": {
                        "buyer_id": buyer_id
                    }
                }
            }
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }

    async getRecordBySeller(stub, args, thisClass){
        let inputData = JSON.parse(args[0])
        let seller_id = inputData['seller_id']
        let queryString = {
            "selector": {
                "returndetails": {
                    "seller_data": {
                        "seller_id": seller_id
                    }
                }
            }
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }

    async getRecordByDevices(stub, args, thisClass){
        let inputData = JSON.parse(args[0])
        let item_name = inputData['item_name']
        let queryString = {
            "selector": {
                "itemdetails": {
                    "item_name": item_name
                }
            }
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }
  
}
shim.start(new Chaincode())