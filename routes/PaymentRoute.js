const express = require("express");

const PlaceOrderModel = require("../Models/PlaceOrder.js");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require("stripe")(STRIPE_SECRET_KEY);
const routes = express.Router();

const getPublicKey = (req, res) => {
    res.status(200).json({
        success: true,
        STRIPE_PUBLISHABLE_KEY,
    });
};

const calculateOrderAmount = async (orderId) => {
    try {
        const order = await PlaceOrderModel.findOne({ _id: orderId });

        return order.orderDetails.total;
    } catch (err) {
        console.log(err);
        return -1;
    }
};

routes.get("/getPaymentKey", getPublicKey);

routes.post("/create-payment-intent", async (req, res) => {
    const { orderId } = req.body;
    const orderAmount = await calculateOrderAmount(orderId);
    if (orderAmount === -1) {
        res.status(500).json({
            message: "error in featcing orderAmount from mongodb",
        });
    }
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: orderAmount * 100,
        currency: "inr",
        automatic_payment_methods: {
            enabled: true,
        },
    });

    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

module.exports = routes;
