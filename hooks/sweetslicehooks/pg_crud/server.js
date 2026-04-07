/* global require, process */
const express=require('express');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/product/', require('./src/routes/product.route') );
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});