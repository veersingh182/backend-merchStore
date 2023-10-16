const express = require('express')
const routes = express.Router()
const db = require('../db/conn.js');
const UserModel = require('../Models/Users.js');
const PlaceOrderModel = require('../Models/PlaceOrder.js');
const CouponCodes = require('../Models/CouponCode.js');
const PaymentProofs = require('../Models/PaymentProofs.js');
const AlumniModel = require('../Models/AlumniDetails.js');
const FacultyModel = require('../Models/FacultyDetails.js');
const StudentModel = require('../Models/StudentDetails.js');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const PaymentUploads = multer({ dest: 'PaymentProofs/' });
const imageUploads = multer({ dest: 'verification/' });
const path = require('path');
const sendGmail = require('../Helper/sendEmail');
const safify = require('../Helper/SafeCode.js');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sharp = require('sharp');
const AlumniDetails = require('../Models/AlumniDetails.js');
const PlaceOrder = require('../Models/PlaceOrder.js')
const Item = require('../Models/Products.js'); // Import the Mongoose Item model

const check_scam = require("../Helper/check_scam.js");
const { exec } = require('child_process');

routes.use(bodyParser.urlencoded({ extended: true }));

routes.get("/payments/:imageName", (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, "../PaymentProofs", imageName);
    res.sendFile(imagePath);
});

routes.get("/idproof/:imageName", (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, "../verification", imageName); // Adjust the path here
    res.sendFile(imagePath);
});


routes.post("/api/items", async (req, res) => {
    try {
        const {
            id,
            images,
            name,
            ratings,
            numOfReviews,
            price,
            description,
            stock,
        } = req.body;

        // Create a new Item document using the model and the provided data
        const newItem = new Item({
            id,
            images,
            name,
            ratings,
            numOfReviews,
            price,
            description,
            stock,
        });

        // Save the new item document to the database
        const createdItem = await newItem.save();

        res.status(201).json(createdItem);
    } catch (err) {
        res.status(500).json({ error: "Error creating item" });
    }
});

routes.post("/rate-delivery", async (req, res) => {
    try {
        const { orderId, rating } = req.body;

        // Find the place order by orderId
        const placeOrder = await PlaceOrder.findOne({ orderId: orderId });

        if (!placeOrder) {
            return res.status(404).json({ error: "Place order not found" });
        }

        // Update the rating in the place order and save it
        placeOrder.rating = parseInt(rating);
        await placeOrder.save();

        return res.json({ message: "Rating saved successfully" });
    } catch (error) {
        console.error("Error saving rating:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

routes.post("/get-user", async (req, res) => {
    try {
        const email = req.body.email;
        const user = await UserModel.findOne({ email: email });
        if (user) {
            const type = user.type;
            var details;
            var isdetails = false;
            if (type === "alumni") {
                details = await AlumniModel.findOne({ email: email });
                if (details) {
                    isdetails = true;
                }
            } else if (type === "student") {
                details = await StudentModel.findOne({ email: email });
                if (details) {
                    isdetails = true;
                }
            } else {
                details = await FacultyModel.findOne({ email: email });
                if (details) {
                    isdetails = true;
                }
            }
            if (user.isgoogle) {
                return res.json({
                    isSuccess: true,
                    msg: "google",
                    isdetails: isdetails,
                    userId: user.token,
                });
            } else {
                return res.json({
                    isSuccess: true,
                    msg: "",
                    isdetails: isdetails,
                    userId: user.token,
                });
            }
        } else {
            return res.json({ isSuccess: false });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/user-register", async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        var user = await UserModel.findOne({ email: email });
        if (!user) {
            const password = req.body.password.trim();
            const firstName = req.body.fname.trim();
            const lastName = req.body.lname.trim();
            const isgoogle = req.body.isgoogle;
            const photoUrl = req.body.photoUrl;
            const hasp = await bcrypt.hash(password, 12);
            const urlSafeHashedPassword = safify(hasp);
            var token = await bcrypt.hash(email, 5);
            token = safify(token);
            user = new UserModel({
                email: email,
                password: urlSafeHashedPassword,
                fname: firstName,
                lname: lastName,
                isgoogle: isgoogle,
                token: token,
                photoUrl: photoUrl,
            });
            const result = await user.save();
            user = await UserModel.findOne({ email: email });
            return res.json({
                msg: "User Registered Successfully!",
                isSuccess: true,
                userId: user.token,
                color: "green",
            });
        } else {
            return res.json({
                msg: "user already exists!",
                isSuccess: false,
                color: "red",
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/user-login", async (req, res) => {
    try {
        var user = await UserModel.findOne({
            email: req.body.email.trim().toLowerCase(),
        });
        if (user) {
            const ismatch = await bcrypt.compare(
                req.body.password.trim(),
                user.password.replace(/_/g, "/").replace(/-/g, "+")
            );
            if (ismatch) {
                res.json({
                    msg: "Login Success!!",
                    isSuccess: true,
                    userId: user.token,
                    color: "green",
                });
            } else {
                res.json({
                    msg: "Wrong Password!",
                    isSuccess: false,
                    color: "red",
                });
            }
        } else {
            res.json({
                msg: "No User With That Mail!!",
                isSuccess: false,
                color: "red",
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/verify-login", async (req, res) => {
    try {
        var userId = req.body.userId;
        var email = req.body.email;
        var user;
        if (userId) {
            userId = userId.trim();
            user = await UserModel.findOne({ token: userId });
        } else if (email) {
            email = email.trim();
            user = await UserModel.findOne({ email: email });
        }
        if (user) {
            return res.json({
                msg: "Found User!",
                isSuccess: true,
                userId: user.token,
                color: "green",
            });
        } else {
            return res.json({
                msg: "User not Saved!",
                isSuccess: false,
                color: "red",
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/alumni-updates", async (req, res) => {
    try {
        var user = await UserModel.findOne({ token: req.body.token });
        if (!user) {
            return res.json({
                msg: "Unknown User Id!",
                isSuccess: false,
                color: "red",
            });
        } else {
            var details = await AlumniDetails.findOne({ token: token });
            const token = user.token;
            const email = user.email;
            const program = req.body.program;
            const school = req.body.school;
            const yearofjoin = req.body.yearofjoin;
            const gradyear = req.body.gradyear;
            const courses = req.body.courses;
            const enrollnumber = req.body.enrollnumber;
            if (!details) {
                details = new MentorDetailsModel({
                    token: token,
                    email: email,
                    program: program,
                    school: school,
                    yearofjoin: yearofjoin,
                    gradyear: gradyear,
                    courses: courses,
                    enrollnumber: enrollnumber,
                });
                const result = await details.save();
                return res.json({
                    msg: "Details saved Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            } else {
                details.enrollnumber = enrollnumber;
                details.courses = courses;
                details.gradyear = gradyear;
                details.yearofjoin = yearofjoin;
                details.school = school;
                details.program = program;
                const result = await details.save();
                return res.json({
                    msg: "Details updated Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/student-updates", async (req, res) => {
    try {
        var user = await UserModel.findOne({ token: req.body.token });
        if (!user) {
            return res.json({
                msg: "Unknown User Id!",
                isSuccess: false,
                color: "red",
            });
        } else {
            var details = await AlumniDetails.findOne({ token: token });
            const token = user.token;
            const email = user.email;
            const program = req.body.program;
            const school = req.body.school;
            const expectedgradyear = req.body.expectedgradyear;
            const gradyear = req.body.gradyear;
            const courses = req.body.courses;
            const enrollnumber = req.body.enrollnumber;
            if (!details) {
                details = new MentorDetailsModel({
                    token: token,
                    email: email,
                    program: program,
                    school: school,
                    yearofjoin: yearofjoin,
                    expectedgradyear: expectedgradyear,
                    courses: courses,
                    enrollnumber: enrollnumber,
                });
                const result = await details.save();
                return res.json({
                    msg: "Details saved Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            } else {
                details.enrollnumber = enrollnumber;
                details.courses = courses;
                details.expectedgradyear = expectedgradyear;
                details.yearofjoin = yearofjoin;
                details.school = school;
                details.program = program;
                const result = await details.save();
                return res.json({
                    msg: "Details updated Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/faculty-updates", async (req, res) => {
    try {
        var user = await UserModel.findOne({ token: req.body.token });
        if (!user) {
            return res.json({
                msg: "Unknown User Id!",
                isSuccess: false,
                color: "red",
            });
        } else {
            var details = await AlumniDetails.findOne({ token: token });
            const token = user.token;
            const email = user.email;
            const school = req.body.school;
            const yearofjoin = req.body.yearofjoin;
            if (!details) {
                details = new MentorDetailsModel({
                    token: token,
                    email: email,
                    school: school,
                    yearofjoin: yearofjoin,
                });
                const result = await details.save();
                return res.json({
                    msg: "Details saved Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            } else {
                details.yearofjoin = yearofjoin;
                details.school = school;
                const result = await details.save();
                return res.json({
                    msg: "Details updated Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/forgot-pass", async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        var link;
        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return res.json({
                msg: "Unknown mail Id!",
                isSuccess: false,
                color: "red",
            });
        } else {
            const secret = process.env.JWT_SECRET + user.password;
            const token = jwt.sign(
                { email: user.email, token: user.token },
                secret,
                { expiresIn: "120m" }
            );
            link = `https://AlumniPortal.vmplay.ml/ResetPassword/${user._id}/${token}`;
        }
        // const mailOptions = {
        //     from: process.env.GMAIL_USER,
        //     to: email,
        //     subject: "Email Verification",
        //     text: `Your verification link : ${link}\n\nOnly valid for 2 Hours.`,
        // };
        try {
            sendGmail(email, "Email Verification", `Your verification link : ${link}\n\nOnly valid for 2 Hours.`)
            return res.json({
                msg: "Mail Sent",
                isSuccess: true,
                color: "green",
            });
        } catch (error) {
            return res.json({
                msg: "Error Ocurred",
                isSuccess: false,
                color: "red",
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Error Ocurred",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/reset-pass", async (req, res) => {
    try {
        const id = req.body.id;
        const link = req.body.link;
        const password = req.body.password;
        const user = await UserModel.findOne({ _id: id });
        if (!user) {
            return res.json({
                msg: "Unknown token Id!",
                isSuccess: false,
                color: "red",
            });
        } else {
            const secret = process.env.JWT_SECRET + user.password;
            try {
                const verify = jwt.verify(link, secret);
                const hasp = await bcrypt.hash(password, 12);
                const urlSafeHashedPassword = safify(hasp);
                user.password = urlSafeHashedPassword;
                await user.save();
                return res.json({
                    msg: "Password updated Successfully!",
                    isSuccess: true,
                    color: "green",
                });
            } catch (error) {
                return res.json({
                    msg: "Not verified json!",
                    isSuccess: false,
                    color: "red",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Error Ocurred",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/update-info", async (req, res) => {
    try {
        const token = req.body.token;
        const user = await UserModel.findOne({ token: token });
        if (!user) {
            return res.json({
                msg: "User not found",
                isSuccess: false,
                color: "red",
            });
        } else {
            user.fname = req.body.fname;
            user.lname = req.body.lname;
            user.location = req.body.location;
            await user.save();
            return res.json({
                msg: "Info Updated!",
                isSuccess: true,
                color: "green",
            });
        }
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Occured",
            isSuccess: false,
            color: "red",
        });
    }
});

const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'verification/'); // Specify the destination folder for profile verification images
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "profile-" + uniqueSuffix + extension);
    },
});

// Create a storage configuration for payment verification images
const paymentImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'PaymentProofs/'); // Specify the destination folder for payment verification images
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "payment-" + uniqueSuffix + extension);
    },
});

// Use the multer configurations
const profileImageUploads = multer({ storage: profileImageStorage });
const paymentImageUploads = multer({ storage: paymentImageStorage });

routes.post("/order-placed", profileImageUploads.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                msg: "No image provided",
                color: "red",
                isSuccess: false,
            });
        }
        const file = req.file;
        const path = file.path;
        const Email = req.body.Email;
        const FullName = req.body.FullName;
        const Address = req.body.Address;
        const PNumber = req.body.PNumber;
        const orderDetails = JSON.parse(req.body.orderDetails);
        const Check = await check_scam(orderDetails);

        if (Check.error) {
            console.log(Check.error);
            return res.status(500).json({
                isSuccess: false,
                scam: false,
                msg: "internal server error",
            });
        }
        if (Check.scam === true) {
            return res.status(401).json({
                isSuccess: false,
                scam: true,
                msg: "cart value not matched with db values",
            });
        }

        const user = new PlaceOrderModel({
            Email: Email,
            FullName: FullName,
            Address: Address,
            PNumber: PNumber,
            IDProof: path,
            orderDetails: orderDetails,
        });
        const userdb = await user.save();
        return res.json({
            orderId: userdb._id,
            scam: false,
            msg: "Profile verification image saved successfully",
            color: "green",
            isSuccess: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Some Error Occurred!",
            isSuccess: false,
            scam: false,
            color: "red",
            error,
        });
    }
});

routes.post('/save-user-payment-proof', paymentImageUploads.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ msg: 'No image provided', color: 'red', isSuccess: false });
        }
        const file = req.file;
        const path = file.path;
        const orderId = req.body.orderId;
        var transId = req.body.transId;
        if (!transId) {
            transId = '$';
        }
        const user = new PaymentProofs({
            orderId: orderId,
            transId: transId,
            paymentProof: path,
        });
        await user.save();
        return res.json({ msg: 'Payment verification image saved successfully', color: 'green', isSuccess: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Some Error Occurred!", isSuccess: false, color: "red" });

    }
});


routes.post("/get-order-details", async (req, res) => {
    try {
        const id = req.body.id;
        const user = await PlaceOrderModel.findOne({ _id: id });
        if (!user) {
            return res.json({
                msg: "No order available with that id",
                color: "red",
                isSuccess: false,
            });
        } else {
            return res.json({
                data: {
                    FullName: user.FullName,
                    Email: user.Email,
                    PNumber: user.PNumber,
                    isPayment: user.isPayment,
                    transactionId: user.transactionId,
                    orderDetails: user.orderDetails,
                },
                color: "green",
                isSuccess: true,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/add-coupon", async (req, res) => {
    try {
        const code = req.body.code;
        var amount = req.body.amount;
        var description = req.body.description;
        const discountType = req.body.discountType;
        const discountAmount = req.body.discountAmount;
        if (!amount) {
            amount = 50;
        }
        if (!description) {
            description = ""
        }
        const coupon = new CouponCodes({
            Code: code,
            Amount: amount,
            Description: description,
            discountType: discountType,
            discountAmount: discountAmount
        })
        await coupon.save();
        return res.json({
            msg: "Coupon saved successfully",
            isSuccess: true,
            color: "green",
        });
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/delete-coupon", async (req, res) => {
    try {
        const password = req.body.password;
        var coupon = req.body.coupon;
        const mypassword = process.env.PASSWORD
        if (password !== mypassword) {
            return res.json({
                msg: "Incorrect Password",
                color: "red",
                isSuccess: false,
            });
        }
        const is_c = await CouponCodes.findOne({ Code: coupon })
        if (!is_c) {
            return res.json({
                msg: "Coupon Not Found",
                color: "red",
                isSuccess: false,
            });
        }
        const is_cc = await CouponCodes.deleteOne({ Code: coupon })
        return res.json({
            msg: "Coupon code deleted",
            color: "green",
            isSuccess: true,
        });
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/delete-order", async (req, res) => {
    try {
        const password = req.body.password;
        var OrderId = req.body.OrderId;
        const mypassword = process.env.PASSWORD
        if (password !== mypassword) {
            return res.json({
                msg: "Incorrect Password",
                color: "red",
                isSuccess: false,
            });
        }
        const is_c = await PlaceOrderModel.findOne({ _id: OrderId })
        if (!is_c) {
            return res.json({
                msg: "Order Not Found",
                color: "red",
                isSuccess: false,
            });
        }
        const is_cc = await PlaceOrderModel.deleteOne({ _id: OrderId })
        const is_ccc = await PaymentProofs.deleteOne({ orderId: OrderId })
        return res.json({
            msg: "Order deleted",
            color: "green",
            isSuccess: true,
        });
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});


routes.post("/verify-coupon", async (req, res) => {
    try {
        const code = req.body.code;
        const coupon = await CouponCodes.findOne({ Code: code })
        if (!coupon) {
            return res.json({
                msg: "Invalid coupon code",
                valid: false,
                isSuccess: true,
                color: "green",
            })
        }
        else {
            if (coupon.Amount === 0) {
                return res.json({
                    msg: "Code Expired",
                    valid: false,
                    isSuccess: true,
                    color: "green",
                })
            }
            else {
                return res.json({
                    msg: "Code applied successfully",
                    data: coupon,
                    valid: true,
                    isSuccess: true,
                    color: "green",
                })
            }
        }

    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/get-coupons", async (req, res) => {
    const verf = req.body.code;
    if (verf !== "CONNECTDOT2023") {
        return res.json({
            msg: "Unable to load Coupons",
            isSuccess: false,
            color: "red",
        });
    }
    try {
        const coupons = await CouponCodes.find({})
        return res.json({
            coupons: coupons,
            isSuccess: true,
            color: "green",
        })
    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});

routes.post("/dec-coupon-amount", async (req, res) => {
    try {
        const code = req.body.code;
        const coupon = await CouponCodes.findOne({ Code: code })
        if (!coupon) {
            return res.json({
                msg: "Invalid coupon code",
                valid: false,
                isSuccess: true,
                color: "red",
            })
        }
        else {
            if (coupon.Amount === 0) {
                return res.json({
                    msg: "Code Expired",
                    valid: false,
                    isSuccess: true,
                    color: "red",
                })
            }
            else {
                coupon.Amount = coupon.Amount - 1;
                await coupon.save();
                return res.json({
                    msg: "Amount decreased",
                    valid: true,
                    isSuccess: true,
                    color: "red",
                })
            }
        }

    } catch (error) {
        console.log(error);
        return res.json({
            msg: "Some Error Ocurred!",
            isSuccess: false,
            color: "red",
        });
    }
});


routes.post('/send-feedback', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const content = req.body.content;
    try {
        const result = await sendGmail("theconnectdotco@gmail.com", "New Feedback from " + name, `Feedback from : ${email}\n\n${content}`)
        if (result && result.status === 200) {
            return res.json({
                msg: "Mail Sent",
                isSuccess: true,
                color: "green",
            });
        } else {
            return res.json({
                msg: "Error sending email",
                isSuccess: false,
                color: "red",
            });
        }
    } catch (error) {
        return res.json({
            msg: "Error sending email",
            isSuccess: false,
            color: "red",
        });
    }


})
routes.post('/mark-payment', async (req, res) => {
    try {
        const transId = req.body.transId;
        const id = req.body.id;
        const user = await PlaceOrderModel.findOne({ _id: id });
        if (!user) {
            return res.json({
                msg: "No order available with that id",
                color: "red",
                isSuccess: false,
            });
        }
        else {
            user.transactionId = transId;
            user.isPayment = true;
            await user.save();
            return res.json({
                msg: "Updated successfully",
                color: "green",
                isSuccess: true,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Some Error Ocurred!", isSuccess: false, color: "red" });

    }
});

routes.post('/get-all-order-details', async (req, res) => {
    try {
        const password = req.body.password
        const mypassword = process.env.PASSWORD
        if (password !== mypassword) {
            return res.json({
                msg: "Incorrect Password",
                color: "red",
                isSuccess: false,
            });
        }
        else {
            const user_details = await PlaceOrder.find({})
            var data = []
            for (let index = 0; index < user_details.length; index++) {
                const element = user_details[index];
                if (element.isPayment) {
                    const verification = await PaymentProofs.findOne({ orderId: element._id });
                    var user = {
                        "Name": element?.FullName,
                        "Email": element?.Email,
                        "Address": element?.Address,
                        "Pnumber": element?.PNumber,
                        "IDProof": element?.IDProof,
                        "PaymentProof": verification?.paymentProof,
                        "transactionId": element?.transactionId,
                        "OrderDetails": element?.orderDetails
                    }
                    data.push(user)
                }
            }
            return res.json({
                msg: "Data fetched successfully",
                color: "green",
                isSuccess: true,
                data: data
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Some Error Ocurred!", isSuccess: false, color: "red" });

    }
})

module.exports = routes;
