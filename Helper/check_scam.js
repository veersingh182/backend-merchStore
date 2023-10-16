const Items = require("../products/Products");

const CouponCodes = require('../Models/CouponCode.js');

const check_scam = async ({ shipping, subTotal, total, tax, coupon, cartItems }) => {

    try {
        let checkTotal = 0;

        cartItems.map((ele) => {
            checkTotal += (Items[ele.id] * ele.quantity);
            if (ele.addon) {
                checkTotal += 50 * ele.quantity
            }
        })
        if (checkTotal <= 2000) {
            checkTotal += 70;
        }
        checkTotal += 0.05 * checkTotal;

        if (coupon !== "") {
            const couponInfo = await CouponCodes.findOne({ Code: coupon });
            if (couponInfo.discountType === "Percentage") {
                const disc = Math.floor((checkTotal * couponInfo.discountAmount) / 100)
                checkTotal = checkTotal - disc
            } else {
                checkTotal -= (couponInfo.discountAmount);
            }
        }
        if (total > checkTotal - 10 && total < checkTotal + 10) {
            return {
                success: true,
                scam: false,
            };
        }
        else return { success: true, scam: true };

    } catch (err) {
        return { success: false, error: err };
    }
}

module.exports = check_scam;