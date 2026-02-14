import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(
        JSON.parse(featuredProducts).filter((p) => p.quantity > 0)
      );
    }

    featuredProducts = await Product.find({
      isFeatured: true,
      quantity: { $gt: 0 },
    }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, images, category, quantity } = req.body;
    let uploadedImages = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const image of images) {
        const cloudinaryResponse = await cloudinary.uploader.upload(image, {
          folder: "products",
        });
        uploadedImages.push(cloudinaryResponse.secure_url);
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      images: uploadedImages,
      category,
      quantity,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        const publicId = img.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (e) {}
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!product.isFeatured && product.quantity === 0)
      return res
        .status(400)
        .json({ message: "Quantity needs to be greater than 0" });

    product.isFeatured = !product.isFeatured;
    const updated = await product.save();
    await updateFeaturedProductsCache();
    res.json(updated);
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, images, category, quantity, isFeatured } =
      req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (quantity !== undefined) product.quantity = quantity;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;

    if (Array.isArray(images) && images.length > 0) {
      let uploadedImages = [];
      if (images[0].startsWith("data:")) {
        for (const img of images) {
          const cloudinaryResponse = await cloudinary.uploader.upload(img, {
            folder: "products",
          });
          uploadedImages.push(cloudinaryResponse.secure_url);
        }
      } else {
        uploadedImages = images;
      }
      product.images = uploadedImages;
    }

    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.json(updatedProduct);
  } catch (error) {
    console.log("Error in editProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featured = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featured));
  } catch (error) {
    console.log("Error updating cache", error.message);
  }
}
