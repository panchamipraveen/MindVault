const { buildSchema } = require("graphql");
const Category = require("../models/Category");
const Note = require("../models/Note");

const schema = buildSchema(`
  type Category {
    id: ID!
    name: String!
  }

  type Note {
    id: ID!
    title: String!
    content: String!
    category: Category!
    isPinned: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type OperationResult {
    success: Boolean!
    message: String!
  }

  type Query {
    categories: [Category!]!
    
    notes(
  categoryId: ID
  keyword: String
  pinned: Boolean
  page: Int
  limit: Int
  sortBy: String
): [Note!]!
    note(id: ID!): Note
  }

  type Mutation {
    createCategory(name: String!): Category!
    
    updateCategory(
      id: ID!
      name: String!
    ): Category!

    deleteCategory(id: ID!): OperationResult!

    createNote(
      title: String!
      content: String!
      categoryId: ID!
    ): Note!

    updateNote(
      id: ID!
      title: String
      content: String
      categoryId: ID
    ): Note!

    deleteNote(id: ID!): OperationResult!

    togglePin(id: ID!): Note!
  }
`);

const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const root = {

  // -------------------------
  // CATEGORY QUERIES
  // -------------------------

  categories: async () => {
    return await Category.find().sort({ name: 1 });
  },

  // -------------------------
  // NOTE QUERIES
  // -------------------------

  notes: async ({ categoryId, keyword, pinned, page, limit, sortBy }) => {
    const filter = {};
    const currentPage = page && page > 0 ? page : 1;
    const pageLimit = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * pageLimit;
    const sortOrder = sortBy === "oldest"
  ? { createdAt: 1 }
  : { isPinned: -1, createdAt: -1 };

    if (categoryId) {
      filter.category = categoryId;
    }

    if (typeof pinned === "boolean") {
      filter.isPinned = pinned;
    }

    if (keyword && keyword.trim()) {
      const safeKeyword = escapeRegex(keyword.trim());

      filter.$or = [
        { title: { $regex: safeKeyword, $options: "i" } },
        { content: { $regex: safeKeyword, $options: "i" } }
      ];
    }

     return await Note.find(filter)
    .populate("category")
    .sort(sortOrder)
    .skip(skip)
    .limit(pageLimit);
},

  note: async ({ id }) => {
    return await Note.findById(id).populate("category");
  },

  // -------------------------
  // CATEGORY MUTATIONS
  // -------------------------

  createCategory: async ({ name }) => {

    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error("Category name cannot be empty.");
    }

    const existingCategory = await Category.findOne({
      name: { $regex: `^${escapeRegex(cleanName)}$`, $options: "i" }
    });

    if (existingCategory) {
      throw new Error("Category already exists.");
    }

    return await Category.create({
      name: cleanName
    });
  },

  updateCategory: async ({ id, name }) => {

    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error("Category name cannot be empty.");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name: cleanName },
      {
        new: true,
        runValidators: true
      }
    );

    if (!category) {
      throw new Error("Category not found.");
    }

    return category;
  },

  deleteCategory: async ({ id }) => {

    const category = await Category.findById(id);

    if (!category) {
      return {
        success: false,
        message: "Category not found."
      };
    }

    const notesUsingCategory = await Note.exists({
      category: id
    });

    if (notesUsingCategory) {
      return {
        success: false,
        message: "Cannot delete category because notes are still using it."
      };
    }

    await Category.findByIdAndDelete(id);

    return {
      success: true,
      message: "Category deleted successfully."
    };
  },

  // -------------------------
  // NOTE MUTATIONS
  // -------------------------

  createNote: async ({ title, content, categoryId }) => {

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      throw new Error("Note title cannot be empty.");
    }

    if (!cleanContent) {
      throw new Error("Note content cannot be empty.");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      throw new Error("Category not found.");
    }

    const note = await Note.create({
      title: cleanTitle,
      content: cleanContent,
      category: categoryId
    });

    return await note.populate("category");
  },

  updateNote: async ({ id, title, content, categoryId }) => {

    const note = await Note.findById(id);

    if (!note) {
      throw new Error("Note not found.");
    }

    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error("Note title cannot be empty.");
      }

      note.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        throw new Error("Note content cannot be empty.");
      }

      note.content = content.trim();
    }

    if (categoryId !== undefined) {

      const category = await Category.findById(categoryId);

      if (!category) {
        throw new Error("Category not found.");
      }

      note.category = categoryId;
    }

    await note.save();

    return await note.populate("category");
  },

  deleteNote: async ({ id }) => {

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return {
        success: false,
        message: "Note not found."
      };
    }

    return {
      success: true,
      message: "Note deleted successfully."
    };
  },

  togglePin: async ({ id }) => {

    const note = await Note.findById(id);

    if (!note) {
      throw new Error("Note not found.");
    }

    note.isPinned = !note.isPinned;

    await note.save();

    return await note.populate("category");
  }
};

module.exports = {
  schema,
  root
};