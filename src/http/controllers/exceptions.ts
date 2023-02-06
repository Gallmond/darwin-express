
export class BaseError extends Error{
    constructor(
        public message = 'Something went wrong',
        public name = 'BaseError',
        public code = 500,
    ){
        super(message)
    }

    get json(){
        return {
            name: this.name,
            message: this.message,
            code: this.code
        }
    }
}

export class HTTP422UnprocessableEntity extends BaseError {
    constructor(
        public message = 'Invalid Request',
        public name = 'HTTP422UnprocessableEntity',
        public code = 422,
    ){
        super(message)
    }
}

export class HTTP401Unauthorized extends BaseError{
    constructor(
        public message = 'Not authorized',
        public name = 'HTTP401Unauthorized',
        public code = 401,
    ){
        super(message)
    }
}