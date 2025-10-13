const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// @desc Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// @desc Add a new product
router.post("/", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: "Failed to create product", details: err.message });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const Product = require("../models/Product");

// // Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // GET all products
// router.get("/", async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // POST new product
// router.post(
//   "/",
//   upload.fields([
//     { name: "images", maxCount: 10 },
//     { name: "variationImages", maxCount: 20 },
//   ]),
//   async (req, res) => {
//     try {
//       const { name, price, category, description, inStock, oldPrice, sizes, variations, imageUrls } = req.body;

//       const parsedVariations = variations ? JSON.parse(variations) : [];
//       const parsedImageUrls = imageUrls ? JSON.parse(imageUrls) : [];

//       const uploadedImages = req.files["images"]?.map(f => `/uploads/${f.filename}`) || [];

//       const variationFiles = req.files["variationImages"] || [];
//       let varFileIndex = 0;
//       const finalVariations = parsedVariations.map(v => {
//         if (!v.image && variationFiles[varFileIndex]) {
//           v.image = `/uploads/${variationFiles[varFileIndex].filename}`;
//           varFileIndex++;
//         }
//         return v;
//       });

//       const newProduct = new Product({
//         name,
//         price,
//         category,
//         description,
//         inStock,
//         oldPrice,
//         sizes: sizes ? sizes.split(",").map(s => s.trim()) : [],
//         images: [...uploadedImages, ...parsedImageUrls],
//         variations: finalVariations,
//       });

//       await newProduct.save();
//       res.status(201).json(newProduct);
//     } catch (err) {
//       res.status(400).json({ error: err.message });
//     }
//   }
// );

// module.exports = router;
