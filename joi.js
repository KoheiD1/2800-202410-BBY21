const Joi = require('joi');

const {schema} = require('./joi-schema');

const form = document.getElementById('form_user');

form.addEventListener('submit', (event) => {
    var formData = new FormData(form);
    var formDataObj = Object.fromEntries(formData.entries());

    var result = schema.validate(formDataObj, {abortEarly: false});

    for (var i = 0; i < form.elements.length; i++) {
        form.elements[i].classList.remove('is-invalid');
        form.elements[i].classList.add('is-valid');
    }

    if (result.error) {
        event.preventDefault();
        event.stopPropagation();

        for (var i = 0; i < result.error.details.length; i++) {
            var msg_div = document.getElementsByClassName(`${result.error.details[i].path[0]}-msg`)[0]
            msg_div.innerHTML = result.error.details[i].message;
            var input = form.elements[`${result.error.details[i].path[0]}`]
            input.classList.add('is-invalid');
        }
    }
    else {
        form.classList.add('was-validated');
    }
});