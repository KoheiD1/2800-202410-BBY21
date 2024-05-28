const Joi = require('joi');

const schema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.base': 'Username must be a string',
            'string.alphanum': 'Username must only contain alpha-numeric characters',
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username must be at most 30 characters long'
        }),
    email: Joi.string()
        .email({tlds: {allow: false}})
        .required()
        .messages({
            'string.base': 'Email must be a string',
            'string.empty': 'Email is required',
            'string.email': 'Email must be a valid email',
            'string.domain': 'Email must be a valid email'
        }),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{10,30}$'))
        .required()
        .messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password is required',
            'string.pattern.base': 'Password must be between 10 and 30 characters long and contain only alpha-numeric characters'
        })
});

exports.schema = schema;