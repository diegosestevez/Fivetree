const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Handles uncaught exception type errors.
process.on('uncaughtException', err => {
  console.log(err.name, err.message)
  console.log('UNCAUGHT EXCEPTION! Shutting app down.')
  process.exit(1)
})

dotenv.config({path: './config.env'});
const app = require('./app');

//connects to our MongoDB Atlus cluster
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//mongoose driver connection
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  console.log('DB connection successful!')
})

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`running on port ${port}...`);
});

//process.on eventlistener can handle all unhandledRejection errors like mongoDB connection errors
process.on('unhandledRejection', err => {
  console.log(err.name, err.message)
  console.log('UNHANDLED REJECTION! Shutting app down.')
  server.close(() => {
    process.exit(1)
  })
})
