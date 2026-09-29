const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  content: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.createdAt = ret.createdAt.getTime().toString();
      ret.updatedAt = ret.updatedAt.getTime().toString();
      return ret;
    }
  }
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;