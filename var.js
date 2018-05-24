var variables = {
    masterKey: '123',
    customerkey: '456',
    errorMsg: {
        badrequest: { message: 'Bad Request!' },
        serverError: { message: 'Internal Server error. Contact with your administrator.' },
        exists: { message: 'Data already exists!'},
        invalidData: { message: 'Invalid data!' },
        unauthorized: { message: 'Unauthorized.' },
        notmodified: { message: 'Data was not Modified!' },
        notfound: { message: 'Not found any relative data!' },
        update: { message: 'There was an error! We couldn`t update your data.' },
        created: { message: 'There was an error! We couldn`t created your data.' },
        remove: { message: 'There was an error! We couldn`t delete your data.' }
    },
    successMsg: {
        update: { message: 'Data was successfully updated.' },
        created: { message: 'Data was successfully created.' },
        remove: { message: 'Data was successfully deleted.' },
    }
}

module.exports = variables;
/*
200 OK
202 Accepted
204 No Content

304 Not Modified

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found

500 Internal Server Error
501 Not Implemented

511 Network Authentication Required
*/