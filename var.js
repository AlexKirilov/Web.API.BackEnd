var variables = {
    masterKey: '123',
    customerkey: '456',
    errorMsg: {
        type401: {
            invalidData: { message: 'Invalid data' },
            invalidCreds: { message: 'Email or Password invalid' },
            unauthorized: { message: 'Unauthorized. Missing Auth Hader' },
        },
        type500: {
            newUser: { message: 'Error creating new user' },
            serverError: { message: 'Server error. Contact with you administrator.' },
            notfound: { message: 'Not found any relative data' },
            remove: { message: 'Server Error! We could not delete your data' }
        }
    },
    successMsg: {
        webtype: { message: 'New Database Type was successfully created' },
        update: { message: 'Data was successfully updated' },
        created: { message: 'Data was successfully created' },
        remove: { message: 'Data was successfully deleted' },
    }
}

module.exports = variables;