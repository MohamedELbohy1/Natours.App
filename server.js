const mongoose=require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});

const app = require('./app');
const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

//mongoose.connect(process.env.DATABASE_LOCAL,{
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(()=> console.log('DB connestions Successful'));


//console.log(process.env);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on Port ${port}`);
});

