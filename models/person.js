require('dotenv').config()
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)


const url = process.env.MONGODB_URI

console.log('connecting to', url)
mongoose.connect(url)

  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: [3, 'Name should be 3 characters long!'],
    required: true
  },
  number: {
    type: String,
    minLength: 8,
    validate: {
      validator: function (v) {
        return /\d{2,3}-\d{5,6}/.test(v)
      },
      message: 'Invalid phone number format!'
    },
    required: true
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})


module.exports = mongoose.model('Person', personSchema)