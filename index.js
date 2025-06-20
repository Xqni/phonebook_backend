require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(cors())
app.use(express.json())


// Define a custom token for request body
morgan.token('body', (req) => {
    return req.method === 'POST' ? JSON.stringify(req.body) : '';
})

// Use morgan with the custom token
app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

app.get('/', (request, response) => {
    response.send('<h1>If you see this, I messed up!</h1>')
})

app.get('/info', (request, response) => {
    const startTime = Date()
    Person.find({}).then(result => {
        const people = result
        response.send(`<div>Phonebook currently has info about ${people.length} people</div>
            <p>${startTime}</p>`)
    })
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(result => {
        response.json(result)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })

        .catch(error => next(error))
})

app.post('/api/persons', async (request, response, next) => {
    const body = request.body

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    try {
        await person.validateSync()
    } catch (error) {
        next(error)
    }

    person
        .save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            const number = request.body.number
            person.number = number
            person.save().then(savedPerson => {
                response.json(savedPerson)
            })
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

// Error handler middleware 
const errorHandler = (error, request, response, next) => {
    console.error(error.message)


    // if the person we are searching for doesnt exist
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') { // if the person is not what we defined it to be
        const messages = Object.values(error.errors).map(err => err.message) // extracts all the custom errors
        return response.status(400).send({ error: messages.join(', ') }) // sends the custom message
    }

    next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})