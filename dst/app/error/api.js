"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = void 0;
class APIError extends Error {
    constructor(code, errors) {
        const message = errors.map((error) => error.message)
            .join('\n');
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.errors = errors;
        Object.setPrototypeOf(this, APIError.prototype);
    }
    toObject() {
        return {
            errors: this.errors.map((error) => {
                return Object.assign(Object.assign({}, error), { message: error.message });
            }),
            code: this.code,
            message: this.message
        };
    }
}
exports.APIError = APIError;
