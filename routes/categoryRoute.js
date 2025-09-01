import Category from "../models/Category.js";
import { Router } from 'express';
import sanitizeHtml from "sanitize-html";

const CategoryRoute = Router();  

// Fetch all categories (non-deleted by default)
CategoryRoute.get('/category/get', async (req, res) => {
  try {  
    const { includeDeleted = false } = req.query;
    
    let query = {};
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    const categories = await Category.find(query);
    res.status(200).json(categories);
  } catch(error) {
    res.status(500).json({ message: "Error fetching categories!", error });
  }
});

// Create a new category
CategoryRoute.post('/category/post', async (req, res) => {
  try { 
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required!" });
    }

    // Check if category already exists (non-deleted)
    const existingCategory = await Category.findOne({ 
      name, 
      isDeleted: false 
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists!" });
    }

    // Agar description aayi hai tabhi sanitize karo
    let cleanDescription = undefined;
    if (description) {
      cleanDescription = sanitizeHtml(description, {
        allowedTags: [], 
        allowedAttributes: {}
      });
    }

    const category = new Category({ 
      name, 
      description: cleanDescription // optional rahega
    });

    await category.save();
    res.status(201).json({ 
      message: "Category created successfully!",
      category 
    });
  } catch(error) {
    res.status(500).json({ message: "Error creating category!", error });
  }
});


// Add a subcategory to a category
CategoryRoute.post('/category/:categoryId/subcategory', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Subcategory name is required!" });
    }

    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (category.isDeleted) {
      return res.status(400).json({ message: "Cannot add to a deleted category!" });
    }

    // Check if subcategory already exists
    const existingSubcategory = category.subCategories.find(
      sub => sub.name === name && !sub.isDeleted
    );
    
    if (existingSubcategory) {
      return res.status(400).json({ message: "Subcategory already exists!" });
    }

    category.subCategories.push({ name });
    await category.save();

    res.status(201).json({ 
      message: "Subcategory added successfully!",
      category 
    });
  } catch(error) {
    res.status(500).json({ message: "Error adding subcategory!", error });
  }
});

// Add a sub-child category to a subcategory
CategoryRoute.post('/category/:categoryId/subcategory/:subIndex/subchild', async (req, res) => {
  try {
    const { categoryId, subIndex } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Sub-child category name is required!" });
    }

    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (category.isDeleted) {
      return res.status(400).json({ message: "Cannot add to a deleted category!" });
    }

    const subCategory = category.subCategories[subIndex];
    
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found!" });
    }

    if (subCategory.isDeleted) {
      return res.status(400).json({ message: "Cannot add to a deleted subcategory!" });
    }

    // Check if sub-child category already exists
    const existingSubChild = subCategory.subChildCategories.find(
      child => child.name === name && !child.isDeleted
    );
    
    if (existingSubChild) {
      return res.status(400).json({ message: "Sub-child category already exists!" });
    }

    subCategory.subChildCategories.push({ name });
    await category.save();

    res.status(201).json({ 
      message: "Sub-child category added successfully!",
      category 
    });
  } catch(error) {
    res.status(500).json({ message: "Error adding sub-child category!", error });
  }
});

// Soft delete a category
CategoryRoute.delete('/category/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    res.status(200).json({
      message: "Category soft deleted successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error deleting category!", error });
  }
});

// Soft delete a subcategory
CategoryRoute.delete('/category/:categoryId/subcategory/:subIndex', async (req, res) => {
  try {
    const { categoryId, subIndex } = req.params;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (subIndex >= category.subCategories.length) {
      return res.status(404).json({ message: "Subcategory not found!" });
    }

    category.subCategories[subIndex].isDeleted = true;
    await category.save();

    res.status(200).json({
      message: "Subcategory soft deleted successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error deleting subcategory!", error });
  }
});

// Soft delete a sub-child category
CategoryRoute.delete('/category/:categoryId/subcategory/:subIndex/subchild/:childIndex', async (req, res) => {
  try {
    const { categoryId, subIndex, childIndex } = req.params;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (subIndex >= category.subCategories.length) {
      return res.status(404).json({ message: "Subcategory not found!" });
    }

    const subCategory = category.subCategories[subIndex];
    
    if (childIndex >= subCategory.subChildCategories.length) {
      return res.status(404).json({ message: "Sub-child category not found!" });
    }

    subCategory.subChildCategories[childIndex].isDeleted = true;
    await category.save();

    res.status(200).json({
      message: "Sub-child category soft deleted successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error deleting sub-child category!", error });
  }
});

// Restore a deleted category
CategoryRoute.put('/category/:id/restore', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    res.status(200).json({
      message: "Category restored successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error restoring category!", error });
  }
});

// Restore a deleted subcategory
CategoryRoute.put('/category/:categoryId/subcategory/:subIndex/restore', async (req, res) => {
  try {
    const { categoryId, subIndex } = req.params;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (subIndex >= category.subCategories.length) {
      return res.status(404).json({ message: "Subcategory not found!" });
    }

    category.subCategories[subIndex].isDeleted = false;
    await category.save();

    res.status(200).json({
      message: "Subcategory restored successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error restoring subcategory!", error });
  }
});

// Restore a deleted sub-child category
CategoryRoute.put('/category/:categoryId/subcategory/:subIndex/subchild/:childIndex/restore', async (req, res) => {
  try {
    const { categoryId, subIndex, childIndex } = req.params;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    if (subIndex >= category.subCategories.length) {
      return res.status(404).json({ message: "Subcategory not found!" });
    }

    const subCategory = category.subCategories[subIndex];
    
    if (childIndex >= subCategory.subChildCategories.length) {
      return res.status(404).json({ message: "Sub-child category not found!" });
    }

    subCategory.subChildCategories[childIndex].isDeleted = false;
    await category.save();

    res.status(200).json({
      message: "Sub-child category restored successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error restoring sub-child category!", error });
  }
});

// Update a category
CategoryRoute.put('/category/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Category name is required!" });
    }

    const cleanDescription = sanitizeHtml(description || "", {
      allowedTags: [], 
      allowedAttributes: {}
    });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description: cleanDescription },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found!" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      category
    });
  } catch(error) {
    res.status(500).json({ message: "Error updating category!", error });
  }
});

export default CategoryRoute;