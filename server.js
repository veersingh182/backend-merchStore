const express = require('express')
const app = express()
const Routes = require('./routes/Routes.js')
const PaymentRoutes = require("./routes/PaymentRoute.js");
require("dotenv").config();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', Routes);
app.use('/payment', PaymentRoutes);

const PORT = process.env.PORT || 5200;

const server = app.listen(PORT, () => {
    console.log('Server started on ', PORT);
})
