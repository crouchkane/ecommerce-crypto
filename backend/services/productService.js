const pool = require('../config/database');
const logger = require('../utils/logger');

class ProductService {
  async getAllProducts(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM products WHERE is_active = true';
      const params = [];

      // Category filter
      if (filters.category) {
        query += ' AND category = $' + (params.length + 1);
        params.push(filters.category);
      }

      // Search filter
      if (filters.search) {
        query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
        params.push(`%${filters.search}%`);
      }

      // Price range filter
      if (filters.minPrice !== undefined) {
        query += ' AND price >= $' + (params.length + 1);
        params.push(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query += ' AND price <= $' + (params.length + 1);
        params.push(filters.maxPrice);
      }

      // Sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = true';
      const countParams = [];
      
      if (filters.category) {
        countQuery += ' AND category = $' + (countParams.length + 1);
        countParams.push(filters.category);
      }
      if (filters.search) {
        countQuery += ' AND (name ILIKE $' + (countParams.length + 1) + ' OR description ILIKE $' + (countParams.length + 1) + ')';
        countParams.push(`%${filters.search}%`);
      }
      if (filters.minPrice !== undefined) {
        countQuery += ' AND price >= $' + (countParams.length + 1);
        countParams.push(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        countQuery += ' AND price <= $' + (countParams.length + 1);
        countParams.push(filters.maxPrice);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return {
        products: result.rows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all products error:', error);
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = true', [productId]);

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get product by ID error:', error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      const { name, description, price, category, image_url, stock } = productData;

      const result = await pool.query(
        `INSERT INTO products (name, description, price, category, image_url, stock)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description, price, category, image_url, stock]
      );

      logger.info(`Product created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Create product error:', error);
      throw error;
    }
  }

  async updateProduct(productId, updates) {
    try {
      const allowedFields = ['name', 'description', 'price', 'category', 'image_url', 'stock', 'is_active'];
      const updates_obj = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updates_obj[field] = updates[field];
        }
      }

      const setClause = Object.keys(updates_obj)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      const values = [...Object.values(updates_obj), productId];

      const result = await pool.query(
        `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      logger.info(`Product updated: ${productId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update product error:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      const result = await pool.query(
        'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [productId]
      );

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      logger.info(`Product deleted: ${productId}`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('Delete product error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const result = await pool.query('SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category');
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  async updateProductStock(productId, quantity) {
    try {
      const result = await pool.query(
        'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING stock',
        [quantity, productId]
      );

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      return result.rows[0].stock;
    } catch (error) {
      logger.error('Update product stock error:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();
