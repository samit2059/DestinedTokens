// const express = require('express');
// const User = require('../models/Users')
// const router = express.Router();
// const { body , validationResult } = require('express-validator');

// Create a User using: POST "/api/auth/". Doesn't require Auth

// router.post('/', 

// router.post('/', [
//     body('name').isLength({min : 3}),
//     body('email').isEmail(),
//     body('password').isLength({min : 5}),
// ], (req, res) =>{
//     console.log(req.body);  
//     const user = User(req.body);
//     user.save();
//     const errors = validationResult(req);
//     if(!errors.isEmpty()){
//         return res.status(400).json({errors : errors.array()});
//     }   
// }) 
// module.exports = router
const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/Users')
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const checkSuperAdmin = require('../middleware/CheckSuperAdmin')
const fetchuser = require('../middleware/fetchuser')
const { JWT_SECRET } = require('../config');
// const { signup_limit } = require('../middleware/accountLimit')
const signup_limit = require('../middleware/accountLimit')
//Route 1: Create a User using: POST "/api/auth/". Doesn't require Auth No login required
// router.post('/', (req, res) => {
router.post('/createuser', [
    body('name', 'Name must be at least 3 characters long').isLength({ min: 3 }),
    body('email', 'Invalid email').isEmail(),
    body('password', 'Password must be at least 5 characters long').isLength({ min: 5 }),
    body('userType', "Invalid Type").isIn(['admin', 'user', 'superadmin']).notEmpty(),
], async (req, res) => {
    let success = false;
    //If there are errors, return bad request and the errors
    // const user = User(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        success = false;
    }
    try {


        // Check whether the user with this email exists already
        let user = await User.findOne({ email: req.body.email });
        // console.log(user);
        if (user) {
            return res.status(400).json({ error: 'Sorry a user with this email already exists' });
            success = false;
        }
        if (!req.body.email.endsWith('@gmail.com')) {
            return res.status(400).json({
                message: "Access restriction, Only Gmail accounts are allowed"
            });
        }
        // create a new user
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
            userType: req.body.userType,
        });
        // .then(user => res.json(user))
        // .catch(err => {console.log(err)
        // res.json({error:'Please enter a unique value',message: err.message})});
        // eslint-disable-next-line no-undef
        // res.json({ message: 'User registered successfully!' });
        // res.send(req.body);
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        return res.json({ success, authtoken });
        // console.log(jwtData);
        // res.json({"success": true, user });
    } catch (error) {// to catch any error that occurs during the process
        console.error(error.message);
        res.status(500).send("some error occured");
    }
});
//Route 2: Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
    body('email', 'Invalid email').isEmail(),
    body('password', 'Password can`t be blanked ').exists(),
], async (req, res) => {
    let success = false;
    //If there are errors, return bad request and the errors
    // const user = User(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const passwordRegex = /^[a-zA-Z0-9@#$+-]{8,}$/;
    try {
        console.log("Login attempt for:", req.body.email); // Check if data reaches backend
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character "
            })
        }
        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({
                message: "Access restriction, Only Gmail accounts are allowed"
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: `Please try to login with correct credentials` });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            success = false;
            return res.status(400).json({ error: `Please try to login with correct credentials` });
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken, userType: user.userType });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error occured");
    }
});

//Route 3: get a User detailed using: PUT "/api/auth/getuser". login required
router.get('/getuser', fetchuser, async (req, res) => {
    try {
        let userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        // Check if user was found before sending
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error occured");
    }
});

// Route 4: get Data of all Users and their details as well :GET "/api/auth/getallUser" (For Admin Only)
router.get('/getallUser', fetchuser, async (req, res) => {
    try {

        const currentUser = await User.findById(req.user.id);

        if (currentUser.userType === 'user') {
            return res.status(403).json({ message: "Access Denied: You must be admin" });
        }


        const allUsers = await User.find({ userType: 'user' }).select("-password");

        if (allUsers.length === 0) {
            return res.status(404).json({ message: "No user currently available in database" });
        }
        res.json(allUsers);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).send("Internal Server Error");
    }
})

// Route 5: get Data of all Admins & users and their details as well :GET "/api/auth/getAdminUser" (For Super Admin Only)
router.get('/getAdminUser', fetchuser, async (req, res) => {
    try {

        const currentUser = await User.findById(req.user.id);

        if (currentUser.userType === 'user') {
            return res.status(403).json({ message: "Access Denied: You must be super admin and Admin" });
        }


        let allUsers = await User.find({ userType: 'user' }).select("-password");

        if (currentUser.userType === "superadmin") {
            const adminList = await User.find({ userType: 'admin' }).select("-password");
            const superadminList = await User.find({ userType: 'superadmin' }).select("-password");

            allUsers = [...allUsers, ...adminList, ...superadminList];
        }

        if (allUsers.length === 0) {
            return res.status(404).json({ message: "No user currently available in database SuperAdmin" });
        }

        // 4. Verification: If they aren't even an admin, block access
        // if (currentUser.userType !== "superadmin" || currentUser.userType !== "admin") {
        //     return res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
        // }
        res.json(allUsers);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
