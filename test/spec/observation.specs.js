/* globals describe it beforeEach */

import assert from 'assert'
import { isFunction } from 'lodash'

import request from 'src/request'
import { key, invalidate } from 'src/cache'
import MemoryStore from 'src/memory'

const mock = { "transactionRefNumber": "MC11111117189047751M", "serverDate": "30 Apr 2023, 6:24 PM", "pollingToken": "                                ", "pollingStart": false, "pollingStatus": null, "onHold": false, "rsaStatus": null, "challenge": null, "formattedTransactionRefNumber": "189047751M", "statusCode": "0", "statusDescription": "Successful", "additionalStatusDescription": null, "additionalStatus": null, "fromAccountBalance": "0.00", "toAccountBalance": null, "recipientAccountBalance": null, "sendRcvId": null, "s2w": null, "merchantAppId": null, "merchantUrl": null, "bakongReferenceNo": null, "bakongPaymentDetails": null, "remittanceReferenceNo": null, "remittancePaymentDetails": null, "externalRefNo": null, "tempTransactionId": null, "transactionDigest": null, "paymentRefNo": null }
const mock3 = { "statusFailed": "M000", "code": "200", "Failedd": "rejected", "statusCode": "M000", "statusDescription": "Successful", "payload": { "transactionId": "MC11111117189047272M", "RequestDt": "20230430", "RequestTime": "134413", "PAN": "0000007000117753", "ApplID": "MYA", "CustId": "000400754", "HardwareId": "", "CustName": "CIK AHMAD IMAN", "PhoneNum": "010-9011231", "TokenNum": "00000070001177530038918510462940", "ApprovalStatus": "00", "PayeeName": "21ST CENTURY PRODUCTS SDN BHD", "Amt": "+000000000050000", "FrAcctId": "5061000005030000", "ToAcctId": "0000000000000000", "PayeeType": "N", "PayeeCode": "414", "BillingAcct": "123345", "BillReferenceNo": "", "EffectiveDate": "000000", "CurCodeValue": "MYR", "FromAcctBal": "+000000052465065", "SeqNo": "+0000000", "SerCharge": "", "ValuDate": "", "AprrovalCode": "000000", "RechargeCode": "", "SerialNo": "", "LoginName": "", "Password": "", "MMERefNo": "", "ToAcctCurCodeValue": "", "ToAcctBal": "", "ReversalInd": "", "GSTAmt": "", "TotalAmt": "", "WUPointEarned": "", "WUTransactionID": "", "WUMoneyControlDate": "", "WUMTCN": "", "WUReturnDateTime": "", "FILLER": "" }, "additionalStatusDescription": null, "asnbTransferReceipt": { "fundPrice": null, "unitAllocated": null, "saleChargePercentage": null, "saleChargeRm": null, "sstAmount": "0.00" }, "bakongReferenceNo": null, "remittanceReferenceNo": null, "mbbRefNo": null, "consentId": null, "dateTime": "30 Apr 2023, 1:44 PM", "pinBlock": null, "maeCustRisk": null, "transactionReferenceNumber": "MC11111117189047273M", "certificateNumber": null, "newAccBal": null, "isDuplicate": false, "cardStpCustInqRes": null, "serverDate": "30 Apr 2023", "wallet": { "name": "Joint Personal Current Account", "code": "04", "type": "D", "group": "04D", "number": "5061000005030000000", "certs": null, "balance": "524650.65", "currentBalance": "524650.65", "oneDayFloat": null, "twoDayFloat": null, "lateClearing": null, "regNumber": null, "loanType": null, "value": 524650.65, "primary": true, "supplementaryAvailable": false, "unitsInGrams": null, "currencyCode": null, "statusCode": null, "statusMessage": null, "currencyCodes": null, "accountType": null, "cardType": null, "formattedNumber": null }, "formattedTransactionRefNumber": "189047272M" }
describe('Observation', () => {
    // const debug = () => { }
    const debug = (...args) => { console.log(...args) }
    let config
    let req
    let res
    // let expires
    let store
    const methods = ['post', 'patch', 'put', 'delete']

    const cacheDictionary = {
        "https://uat-maya.maybank.com.my/2fa/v2/secure2u/signTransaction": [
            "https://uat-maya.maybank.com.my/banking/v1/summary/getBalance"
        ],
        "https://httpbin.org/": [
            'https://uat-maya.maybank.com.my/goal/v1/goal/exists',
            "https://uat-maya.maybank.com.my/goal/v1/goal"
        ],
        "https://uat-maya.maybank.com.my/banking/v1/summary?type=F&checkMae=true": [
            "https://uat-maya.maybank.com.my/banking/v1/summary?type=A&checkMae=true",
            'https://uat-maya.maybank.com.my/goal/v1/goal/exists',
            "https://uat-maya.maybank.com.my/goal/v1/goal"
        ]
    }
    const included = {
        "https://uat-maya.maybank.com.my/banking/v1/summary?type=C&checkMae=true": true,
        "https://httpbin.org/": true,
    }

    beforeEach(() => {
        // expires = Date.now()
        store = new MemoryStore()

        config = {
            host: "http://blabla.com",
            key: key('test'),
            store,
            debug,
            document: {
                included,
                cacheDictionary
            },
            invalidate: invalidate(),
            exclude: {
                query: false,
                methods
            }
        }

        const proxyHandler = {
            get(target, prop, receiver) {
                if (typeof target[prop] === "object" && target[prop] !== null) {
                    // console.log("dyno ;)", target[prop], "proxyHanlerrrrrrrr me ;)");
                    return setupHostProxy(target.host, target[prop]); // new Proxy(target[prop], proxyHandler);
                }
                //   console.log('lol', prop)
                const result = target.host !== null && prop.replace(target.host, '') || prop;
                //   console.log(result, 'opppppslol', target[result], target)
                return target[result]
            }
        };

        const setupHostProxy = (host, data) => {
            return new Proxy({
                ...data,
                host
            }, proxyHandler);
        };

        // const proxyHandler = {
        //     get(target, prop, receiver) {
        //         console.log('lol', prop)
        //         const result = prop.replace(target.host, '');
        //         console.log(result, 'opppppslol', target[result])
        //         return target[result]
        //     }
        // };

        // if (config.host) {
        //     const included = new Proxy({
        //         ...config.document.included,
        //         host: config.host
        //     }, proxyHandler);
        //     config.document.included = included;

        //     const cacheDictionary = new Proxy({
        //         ...config.document.cacheDictionary,
        //         host: config.host
        //     }, proxyHandler);
        //     config.document.cacheDictionary = cacheDictionary;
        // }
        config.document = setupHostProxy(config.host, config.document);

        const watch = setupHostProxy(config.host, {});
        config.watch = new MemoryStore();

        req = {
            url: 'http://blabla.comhttps://httpbin.org/',
            method: 'GET'
        }

        config.uuid = config.key(req)

        config.watch.setItem(req.url, req.method);

        res = { data: { youhou: true, "Status": "SECURE2U_PULL" }, request: { fake: true }, config }
    })

    const escapeRegExpMatch = function (s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    const isExactMatch = (str, match) => {
        return new RegExp(`\\b${escapeRegExpMatch(match)}\\b`).test(str)
    }

    it('Should validate regEX', () => {

        const invalidationRules = ["SECURE2U_PULL", "rejected", "Declined", "M201", "Failed"];

        const responseResult = JSON.stringify(mock3);
        let found = false
        console.log(responseResult)
        for (let i = 0; i < invalidationRules.length; i++) {
            const regex = new RegExp(`/${invalidationRules[i]}/g`);

            console.log(invalidationRules[i], 'regEX', isExactMatch(responseResult, invalidationRules[i]), responseResult.match(`/\bFailed\b/gi`));
            found = responseResult.match(`/\b${invalidationRules[i]}\b/gi`);

            // found = responseResult.match(`/${invalidationRules[i]}/g`);
            if (found) break;
        }

        assert.ok(found == true)
    })

    // it('Should invalidate the url ;)', async () => {
    //     const { document, watch } = config;
    //     const needObservation = document.cacheDictionary[req.url];
    //     debug('observation filter from browwww3333',
    //         // "http://blabla.comhttps://httpbin.org/".replace(config.host, ''),
    //         document.included[req.url],
    //         req.url,
    //         // document.cacheDictionary[req.url],
    //         await watch.getItem(req.url)
    //         // needObservation
    //     )
    //     let found = false;
    //     if (needObservation !== undefined) {
    //         debug('observation filter from library needObservation', needObservation)

    //         const invalidationRules = ["SECURE2U_PULL", "rejected", "Declined", "M201"];
    //         const responseResult = JSON.stringify(mock);
    //         for (let i = 0; i < invalidationRules.length; i++) {
    //             found = responseResult.includes(invalidationRules[i]);
    //             debug('observation filter from library found', found, invalidationRules[i]);
    //             if (found) break;
    //             // break;
    //         }
    //         if (found) {
    //             needObservation.forEach(async element => {
    //                 await config?.watch?.setItem(element, true);
    //             });
    //         }
    //     }
    //     debug('observation filter from library watch', config.watch);
    //     assert.ok(found === false)
    // })

    // it('Should notify an exclusion for http head method', async () => {
    //     req.method = 'HEAD'

    //     const result = await request(config, req)

    //     testExclusion(result)
    // })

    // it('Should notify an exclusion and clear cache for http methods present in config.exclude.methods list', async () => {
    //     req.method = 'POST'

    //     await store.setItem('https://httpbin.org/', res)

    //     const result = await request(config, req)

    //     testExclusion(result)

    //     const length = await store.length()

    //     assert.strictEqual(length, 0)
    // })

    // it('Should clear based on new invalidate function', async () => {
    //     config.invalidate = async (cfg, req) => {
    //         const method = req.method.toLowerCase()
    //         const prefix = 'deleteme'
    //         if (method === 'get') return
    //         await cfg.store.iterate(async (_, key) => {
    //             if (key.startsWith(prefix)) {
    //                 await config.store.removeItem(key)
    //             }
    //         })
    //     }
    //     req.method = 'POST'
    //     await store.setItem('deleteme', res)
    //     await store.setItem('url', res)

    //     await request(config, req)

    //     const length = await store.length()

    //     assert.strictEqual(length, 1)
    // })

    // Helpers
    function testExclusion({ next, config }) {
        assert.ok(isFunction(next))
        assert.ok(config.excludeFromCache)
    }
})
