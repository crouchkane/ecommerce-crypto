const productService = require('../services/productService');
const logger = require('../utils/logger');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        category: req.query.category,
        search: req.query.search,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await productService.getAllProducts(page, limit, filters);
      res.json(result);
    } catch (error) {
      logger.error('Get all products controller error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Product ID required' });
      }

      const product = await productService.getProductById(id);
      res.json(product);
    } catch (error) {
      logger.error('Get product by ID controller error:', error);
      res.status(error.message === 'Product not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async createProduct(req, res, next) {
    try {
      const { name, description, price, category, image_url, stock } = req.body;

      if (!name || !price || !category || stock === undefined) {
        return res.status(400).json({ error: 'Required fields: name, price, category, stock' });
      }

      if (price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      if (stock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
      }

      const product = await productService.createProduct({
        name,
        description,
        price,
        category,
        image_url,
        stock,
      });

      res.status(201).json(product);
    } catch (error) {
      logger.error('Create product controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Product ID required' });
      }

      if (updates.price !== undefined && updates.price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      if (updates.stock !== undefined && updates.stock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
      }

      const product = await productService.updateProduct(id, updates);
      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      logger.error('Update product controller error:', error);
      res.status(error.message === 'Product not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Product ID required' });
      }

      const result = await productService.deleteProduct(id);
      res.json(result);
    } catch (error) {
      logger.error('Delete product controller error:', error);
      res.status(error.message === 'Product not found' ? 404 : 500).json({ error: error.message });
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      res.json({ categories });
    } catch (error) {
      logger.error('Get categories controller error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();
