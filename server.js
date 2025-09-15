const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');
// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD,
// );
console.log('DATABASE:', process.env.DATABASE);

//mongoose.connect(process.env.DATABASE_LOCAL,{
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB Connected Successfully ✅');
  })
  .catch((err) => {
    console.log(`There was an error: ${err}`);
    process.exit(1);
  });

//console.log(process.env);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on Port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.log(`uncaughtException error: ${err.name}|${err.message}`);
  server.close(() => {
    console.log('Shutting Down The Server🔥....');
    process.exit(1);
  });
});
