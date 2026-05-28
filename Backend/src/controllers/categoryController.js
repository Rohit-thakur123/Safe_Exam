import Category from '../models/exam/category.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching categories'
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const name = req.body.name?.trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        const existingCategory = await Category.findOne({
            name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        if (existingCategory) {
            return res.status(200).json({
                success: true,
                message: 'Category already exists',
                category: existingCategory
            });
        }

        const category = await Category.create({ name });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: error.code === 11000 ? 'Category already exists' : error.message || 'Server error creating category'
        });
    }
};
