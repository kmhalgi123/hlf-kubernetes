
'use strict'
const shim = require('fabric-shim')
const util = require('util')

// ===============================================
// Chaincode name:[ordercontract.js]
// Asset key:[orderid]
// Asset values:[orderdetails,itemdetails,buyerdata,shippingdata,customerPO]
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
    async insertAsset(stub, args, thisClass) {
        if (args.length != 6) { 
		throw new Error('Incorrect number of arguments. Expecting 6.')
	}
        let orderid = args[0] 
	let assetState = await stub.getState(orderid)
	if (assetState.toString()) {
		throw new Error('This asset already exists: ' + orderid)
	}
        console.info('--- start insertAsset ---')
	let orderdetails = args[1] 
	let itemdetails = args[2] 
	let buyerdata = args[3] 
	let shippingdata = args[4] 
	let customerPO = args[5] 


        	if (orderdetails.length <= 0) { 
		throw new Error('Argument orderdetails must be a non-empty string') 
	}	if (itemdetails.length <= 0) { 
		throw new Error('Argument itemdetails must be a non-empty string') 
	}	if (buyerdata.length <= 0) { 
		throw new Error('Argument buyerdata must be a non-empty string') 
	}	if (shippingdata.length <= 0) { 
		throw new Error('Argument shippingdata must be a non-empty string') 
	}	if (customerPO.length <= 0) { 
		throw new Error('Argument customerPO must be a non-empty string') 
	}
        let asset = {}
	asset.docType = "Order Asset"
	asset.orderid = orderid
	asset.orderdetails = orderdetails
	asset.itemdetails = itemdetails
	asset.buyerdata = buyerdata
	asset.shippingdata = shippingdata
	asset.customerPO = customerPO

	await stub.putState(orderid, Buffer.from(JSON.stringify(asset)))

    }

    async recordOrder(stub, args, thisClass){
        if(args.length != 1){
            throw new Error('Incorrect number of arguments. Expecting 1.')
        }
        let inputData = JSON.parse(args[0])
        let orderid = inputData['id'];
        let orderDetails = inputData['orderdetails']
        let buyerData = inputData['buyerdata']
        let itemDetails = inputData['itemdetails']
        let shippingData = inputData['shippingdata'] 
        let customerPO = ''
        let assetState = await stub.getState(orderid)
        if (assetState.toString()) {
            throw new Error('This asset already exists: ' + orderid)
        }
        let asset = {}
        asset.docType = "Order Asset"
        asset.orderid = orderid
        asset.orderdetails = orderDetails
        asset.itemdetails = itemDetails
        asset.buyerdata = buyerData
        asset.shippingdata = shippingData
        asset.customerPO = customerPO

        await stub.putState(orderid, Buffer.from(JSON.stringify(asset)))

    }

    async updateOrderDetails(stub, args, thisClass){
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments.')
        }
        let inputData = JSON.parse(args[0])
        let id = inputData['id'];
		console.info('- Start updating asset - ')
		let assetAsBytes = await stub.getState(id)
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
        if(inputData['orderdetails'] && inputData['orderdetails'] != ''){
            asset.orderdetails = inputData['orderdetails']
        }
        if(inputData['itemdetails'] && inputData['itemdetails'] != ''){
            asset.itemdetails = inputData['itemdetails']
        }
        if(inputData['buyerdata'] && inputData['buyerdata'] != ''){
            asset.buyerdata = inputData['buyerdata']
        }
        if(inputData['shippingdata'] && inputData['shippingdata'] != ''){
            asset.shippingdata = inputData['shippingdata']
        }
        if(inputData['customerPO'] && inputData['customerPO'] != ''){
            asset.customerPO = inputData['customerPO']
        }
        let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(id, assetJSONasBytes)
		console.info('- End update asset (success) -')
    }

    // ===============================================
    // Read Asset - read an asset from chaincode state by key
    // ===============================================
    async getOrderDetails(stub, args, thisClass) {
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments. Expecting name of the asset to query')
        }
        let inputData = JSON.parse(args[0])
        let key = inputData['orderid']
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
  
    // ===========================================================
    // Update Asset Attributes - each method updates an asset for a certain field
    // ===========================================================
    	async updateAssetOrderdetails(stub, args, thisClass) {
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
		asset.orderdetails = newValue
		let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
	}

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

	async updateAssetBuyerdata(stub, args, thisClass) {
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
		asset.buyerdata = newValue
		let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
	}

	async updateAssetShippingdata(stub, args, thisClass) {
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
		asset.shippingdata = newValue
		let assetJSONasBytes = Buffer.from(JSON.stringify(asset))
		await stub.putState(key, assetJSONasBytes)
		console.info('- End update asset (success) -')
	}

	async updateAssetCustomerPO(stub, args, thisClass) {
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
		asset.customerPO = newValue
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

    async getOrderByBuyerDetails(stub, args, thisClass) {
        let inputData = JSON.parse(args[0])
        let buyer_id = inputData['buyer_id']
        let queryString = {
            "selector": {
                "buyerdata": {
                    "buyer_id": buyer_id
                }
            },
            "use_index": ["_design/buyerdataIndexDoc", "buyerdataIndex"]
        }
        let resultsIterator = await stub.getQueryResult(JSON.stringify(queryString))
        let method = thisClass['getAllResults']
        let results = await method(resultsIterator, false)
        return Buffer.from(JSON.stringify(results))
    }
  
}
shim.start(new Chaincode())