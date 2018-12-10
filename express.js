const express = require('express')
const boom = require('boom')
const app = express()
const port = 3000

const GOOD_JSON = JSON.stringify({ name: "Zaphod", id: "42" })
const BAD_JSON = '{ name: "Zaphod", id: "42" }'

/*
	Express currently does not support async route handler functions out-of-the-box
	so we need a little help there.

	This handler wrapper does two things:
	- handles errors thrown form async route handlers and passes them to Express
	- turns any caught error into a Boom error if it wasn't already a Boom error

	Source https://nemethgergely.com/error-handling-express-async-await/
*/
const asyncHandler = function (fn) {
	return async function (req, res, next) {
		return Promise
			.resolve(fn(req, res, next))
			.catch((err) => {
				if (!err.isBoom) {
					return next(boom.badImplementation(err))
				}
				next(err)
			})
	}
};

/*
	our JSON reader from some fictional and unreliable source,
	which randomly results in an error, or a bad JSON, or a good JSON
*/
const readJson = async function () {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const rand = Math.random()
			if (rand > 0.66) {
				resolve(GOOD_JSON)
			} else if (rand > 0.33) {
				resolve(BAD_JSON)
			} else {
				reject(boom.boomify(new Error("Data read failed"), { statusCode: 503 }))
			}
		}, 500)
	})
}


/*
	our parseJson function could be as simple as this

	const parseJson = function (json) {
		return JSON.parse(json)
	}

	but we want to be more explicit!
	so we can _rethrow_ the error including our own error message
*/
const parseJson = function (json) {
	try {
		return JSON.parse(json)
	} catch (error) {
		throw boom.boomify(new Error('API response parse error'), {
			statusCode: 503
		});
	}
}

/*
	our Express route handler, wrapped in the helper function just to
	pass errors to Express from async operations

	nothing else is here
 */
app.get('/', asyncHandler(async function (req, res) {

	const json = await readJson()
	const data = parseJson(json)

	res.send(data)

}))

/*
	Finally, the Express error handler!
	https://expressjs.com/en/guide/error-handling.html

	This middleware sits in Express between our route handlers and the HTTP layers,
	catching all errors that happen in handlers, and act accordingly

*/
app.use(function (err, req, res, next) {
	res
		.status(err.output.statusCode)
		.send(err.output.payload)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))