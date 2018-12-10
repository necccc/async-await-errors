const Hapi = require('hapi')
const boom = require('boom')
const port = 3000

const GOOD_JSON = JSON.stringify({ name: "Zaphod", id: "42" })
const BAD_JSON = '{ name: "Zaphod", id: "42" }'

const server = Hapi.server({
    port,
    host: 'localhost'
});

const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
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
	our Hapi route handler
	just doing some work, or throwing errors

	Hapi can handle errors thrown from its async route handlers

	nothing else is here
 */
server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {

		const json = await readJson();
		const data = parseJson(json)

        return data
    }
});


init();