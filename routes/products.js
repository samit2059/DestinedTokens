const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser')
const Product = require("../models/Product");
const checkAdmin = require('../middleware/checkAdmin');
const CheckSuperAdmin = require('../middleware/CheckSuperAdmin');
const { body, validationResult } = require('express-validator');
const rateLimit = require('../middleware/rateLimit');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middleware to allow Admin or SuperAdmin
const authorizeRoles = (req, res, next) => {
    const role = req.user.userType;

    if (role === 'admin' || role === 'superadmin') {
        next();
    }
    else {
        return res.status(403).json({ error: "Access Denied. Required Admin or superAdmin !" });
    }
}


//Route 0: Get all the products in Public removing the middleware
router.get('/allproducts', async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('user', 'name');
        res.json(products);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 1: Get all the products using: GET "/api/products/fetchallproducts". login required
router.get('/fetchallproducts', fetchuser, async (req, res) => {
    try {
        const products = await Product.find({ user: req.user.id })
        if (products.length === 0) {
            return res.status(200).json({ message: "No products found for this user." });
        }

        res.json(products);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})


//Route 1.1: Get all the products using: GET "/api/products/Adminallproducts". login required
router.get('/Adminallproducts', CheckSuperAdmin, async (req, res) => {
    try {
        const products = await Product.find({})
            .populate('user', 'name');
        if (products.length === 0) {
            return res.status(200).json({ message: "No products found for this user." });
        }

        res.json(products);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 2: add new the products using: POST "/api/products/addproduct". login required
router.post('/addproduct', fetchuser, rateLimit, upload.single('image'), [
    body('name', 'Enter name of product').isLength({ min: 3 }),
    body('description', 'Description mustbe atleast 5 characters').isLength({ min: 5 }),
    body('price', 'Price must be a number').isNumeric(),
    body('No_ofItems', 'enter no of products in stock').isNumeric()
    // body('image', 'Image must be valid'),
], async (req, res) => {
    try {

        const { name, description, price, No_ofItems } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // for file request
        if (!req.file) {
            return res.status(400).json({ error: "please upload an Image !!!" });
        }
        const product = new Product({
            name, description, price, No_ofItems, user: req.user.id
        });
        const imagePath = req.file.path;
        console.log(imagePath);
        product.image = imagePath;
        const savedProduct = await product.save()
        res.json(savedProduct);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Route 3: update an existing products using: PUT "/api/products/addproduct". login required
router.put('/updateproduct/:id', fetchuser, upload.single('image'), async (req, res) => {
    const { name, description, price, No_ofItems } = req.body;
    try {
        // create a newProduct object
        const newProduct = {};
        if (name) { newProduct.name = name }
        if (description) { newProduct.description = description }
        if (price) { newProduct.price = price };
        if (No_ofItems) { newProduct.No_ofItems = No_ofItems };

        // Handle image update
        if (req.file) {
            newProduct.image = req.file.path;
        } else if (req.body.image) {
            // If image is sent as string (e.g. existing URL not changed, or manual URL)
            newProduct.image = req.body.image;
        }

        // find the product to be updated and update it
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send("Not Found")
        }
        if (product.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        product = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true });
        res.json({ product })
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

//Route 3: update an existing products using: PUT "/api/products/admin/updateproduct/:id". login required
router.put('/admin/updateproduct/:id', [checkAdmin, upload.single('image')], async (req, res) => {
    const { name, description, price, No_ofItems } = req.body;
    try {
        // create a newProduct object
        const newProduct = {};
        if (name) { newProduct.name = name }
        if (description) { newProduct.description = description }
        if (price) { newProduct.price = price };
        // if (image) { newProduct.image = image };
        if (No_ofItems) { newProduct.No_ofItems = No_ofItems };
        // find the product to be updated and update it
        if (req.file) {
            newProduct.image = req.file.path;
        }
        else if (typeof req.body.image === 'string' && req.body.image !== "") {
            newProduct.image = req.body.image;
        }
        let product = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, // Apply the updates from newProduct
            { new: true }); // Return the updated document instead of the original);
        if (!product) {
            return res.status(404).send("Not Found")
        }
        // product = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true });
        res.json({ "success": "Product has been Updated by Admin", product: product })
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

//Route 4: DELETE an existing products using: DELETE "/api/products/deleteproduct". login required
router.delete('/deleteproduct/:id', fetchuser, async (req, res) => {
    // const { name, description, price } = req.body;
    try {

        // find the product to be deleted and delete it
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send("Not Found")
        }
        // Allow deletion only if user owns this product
        if (product.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        product = await Product.findByIdAndDelete(req.params.id);
        res.json({ "success ": "Product has been deleted", product: product })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})
// Admin Route to delete any product by ID
router.delete('/admin/deleteproduct/:id', checkAdmin, async (req, res) => {
    try {
        let product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).send("Not Found Product");
        }
        res.json({ "success": "Product has been deleted by Admin", product: product });
    }
    catch (error) {
        console.error(error.message, "Error in/admin/deleteproduct");
        res.status(500).send("Internal Server Error");
    }
});


//Route 3: update an existing products using: PUT "/api/products/superAdmin/updateproduct/:id". login required
router.put('/superAdmin/updateproduct/:id', [CheckSuperAdmin, upload.single('image')], async (req, res) => {
    const { name, description, price, No_ofItems } = req.body;
    try {
        // create a newProduct object
        const newProduct = {};
        if (name) { newProduct.name = name }
        if (description) { newProduct.description = description }
        if (price) { newProduct.price = price };
        // if (image) { newProduct.image = image };
        if (No_ofItems) { newProduct.No_ofItems = No_ofItems };
        // find the product to be updated and update it
        if (req.file) {
            newProduct.image = req.file.path;
        }
        else if (typeof req.body.image === 'string' && req.body.image !== "") {
            newProduct.image = req.body.image;
        }
        let product = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, // Apply the updates from newProduct
            { new: true }); // Return the updated document instead of the original);
        if (!product) {
            return res.status(404).send("Not Found")
        }
        // product = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true });
        res.json({ "success": "Product has been Updated by Super - Admin", product: product })
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Super-Admin Route to delete any product by ID
router.delete('/superAdmin/deleteproduct/:id', CheckSuperAdmin, async (req, res) => {
    try {
        let product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).send("Not Found Product");
        }
        res.json({ "success": "Product has been deleted by Super Admin", product: product });
    }
    catch (error) {
        console.error(error.message, "Error in/SuperAdmin/deleteproduct");
        res.status(500).send("Internal Server Error");
    }
});
module.exports = router 