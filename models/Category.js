import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    }, 
    description: {
      type: String,
     
    },
    isDeleted: {
      type: Boolean,
      default: false, // Soft delete flag
    },

    //  Sub Categories
    subCategories: [
      {
        name: {
          type: String,
          required: [true, "Subcategory name is required"],
          trim: true,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },

        // Sub Child Categories
        subChildCategories: [
          {
            name: {
              type: String,
              required: [true, "Sub-child category name is required"],
              trim: true,
            },
            isDeleted: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
