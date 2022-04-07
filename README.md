# Test App
This application tests Ionic Secure Storage Key/Value.

`home.page.ts` will create a data store with an encryption key of `secret`
The button `Test Failure` will create the data store but try to use the encrpytion key of `wrongsecret`
The store is created but when the `get` call is made it silently fails its promise rather than rejecting with an error.