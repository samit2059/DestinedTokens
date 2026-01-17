const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const connectToMongo = require("./db");
const express = require('express');
const cors = require('cors'); // Import the cors package
connectToMongo();
const app = express()
const port = process.env.PORT;
//use cors middleware
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running')

})
// Available Routes 
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.use('/uploads', express.static('uploads'));
app.set('trust proxy', 1);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})

