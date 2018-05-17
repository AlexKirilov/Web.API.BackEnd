var variables = {
    masterKey: '123',
    errorMsg: {
        type401: {
            invalidData: { message: 'Invalid data' },
            invalidCreds: { message: 'Email or Password invalid' },
            unauthorized: { message: 'Unauthorized. Missing Auth Hader' },
        },
        type500: {
            newUser: { message: 'Error creating new user' },
            serverError: { message: 'Server error. Contact with you administrator.' } 
        }
    },
    successMsg: {
        webtype: { message: 'New Database Type was successfully created' }
    }
}

module.exports = variables;