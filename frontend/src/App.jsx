import { useEffect, useState } from "react";
import "./App.css";

const GRAPHQL_URL = "https://mindvault-api-30yo.onrender.com/graphql";

function formatDate(value) {
  const timestamp = parseInt(value, 10);

  if (isNaN(timestamp)) {
    return "Unknown date";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [selectedNote, setSelectedNote] = useState(null);

  const [showNewNote, setShowNewNote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [creatingNote, setCreatingNote] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [updatingNote, setUpdatingNote] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingNote, setDeletingNote] = useState(false);

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  async function fetchGraphQL(query, variables = {}) {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  async function loadData() {
    try {
      setLoading(true);

      const data = await fetchGraphQL(`
        query {
          categories {
            id
            name
          }

          notes(
            page: 1
            limit: 100
          ) {
            id
            title
            content
            isPinned
            createdAt
            updatedAt
            category {
              id
              name
            }
          }
        }
      `);

      setCategories(data.categories);
      setNotes(data.notes);

      if (data.categories.length > 0) {
        setNewCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error("Failed to load MindVault data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function togglePin(noteId) {
    try {
      const data = await fetchGraphQL(
        `
          mutation TogglePin($id: ID!) {
            togglePin(id: $id) {
              id
              title
              content
              isPinned
              createdAt
              updatedAt
              category {
                id
                name
              }
            }
          }
        `,
        {
          id: noteId,
        }
      );

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId ? data.togglePin : note
        )
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote(data.togglePin);
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }

  async function createNote(event) {
    event.preventDefault();

    if (!newTitle.trim()) {
      setCreateError("Please enter a note title.");
      return;
    }

    if (!newContent.trim()) {
      setCreateError("Please enter note content.");
      return;
    }

    if (!newCategory) {
      setCreateError("Please select a category.");
      return;
    }

    try {
      setCreatingNote(true);
      setCreateError("");

      const data = await fetchGraphQL(
        `
          mutation CreateNote(
            $title: String!
            $content: String!
            $categoryId: ID!
          ) {
            createNote(
              title: $title
              content: $content
              categoryId: $categoryId
            ) {
              id
              title
              content
              isPinned
              createdAt
              updatedAt
              category {
                id
                name
              }
            }
          }
        `,
        {
          title: newTitle,
          content: newContent,
          categoryId: newCategory,
        }
      );

      setNotes((currentNotes) => [data.createNote, ...currentNotes]);

      setNewTitle("");
      setNewContent("");

      if (categories.length > 0) {
        setNewCategory(categories[0].id);
      }

      setShowNewNote(false);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreatingNote(false);
    }
  }

  function openEditNote(note) {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category.id);
    setEditError("");
  }

  function closeEditNote() {
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
    setEditCategory("");
    setEditError("");
  }

  async function updateNote(event) {
    event.preventDefault();

    if (!editTitle.trim()) {
      setEditError("Please enter a note title.");
      return;
    }

    if (!editContent.trim()) {
      setEditError("Please enter note content.");
      return;
    }

    if (!editCategory) {
      setEditError("Please select a category.");
      return;
    }

    try {
      setUpdatingNote(true);
      setEditError("");

      const data = await fetchGraphQL(
        `
          mutation UpdateNote(
            $id: ID!
            $title: String
            $content: String
            $categoryId: ID
          ) {
            updateNote(
              id: $id
              title: $title
              content: $content
              categoryId: $categoryId
            ) {
              id
              title
              content
              isPinned
              createdAt
              updatedAt
              category {
                id
                name
              }
            }
          }
        `,
        {
          id: editingNote.id,
          title: editTitle,
          content: editContent,
          categoryId: editCategory,
        }
      );

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingNote.id ? data.updateNote : note
        )
      );

      if (selectedNote?.id === editingNote.id) {
        setSelectedNote(data.updateNote);
      }

      closeEditNote();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setUpdatingNote(false);
    }
  }

  async function deleteNote(noteId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingNote(true);

      const data = await fetchGraphQL(
        `
          mutation DeleteNote($id: ID!) {
            deleteNote(id: $id) {
              success
              message
            }
          }
        `,
        {
          id: noteId,
        }
      );

      if (!data.deleteNote.success) {
        alert(data.deleteNote.message);
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== noteId)
      );

      setSelectedNote(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingNote(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();

    if (!newCategoryName.trim()) {
      setCategoryError("Please enter a category name.");
      return;
    }

    try {
      setCreatingCategory(true);
      setCategoryError("");

      const data = await fetchGraphQL(
        `
          mutation CreateCategory($name: String!) {
            createCategory(name: $name) {
              id
              name
            }
          }
        `,
        {
          name: newCategoryName,
        }
      );

      setCategories((currentCategories) =>
        [...currentCategories, data.createCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewCategory(data.createCategory.id);
      setNewCategoryName("");
    } catch (error) {
      setCategoryError(error.message);
    } finally {
      setCreatingCategory(false);
    }
  }

  function startCategoryEdit(category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setCategoryError("");
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }

  async function updateCategory(categoryId) {
    if (!editingCategoryName.trim()) {
      setCategoryError("Category name cannot be empty.");
      return;
    }

    try {
      setUpdatingCategory(true);
      setCategoryError("");

      const data = await fetchGraphQL(
        `
          mutation UpdateCategory(
            $id: ID!
            $name: String!
          ) {
            updateCategory(
              id: $id
              name: $name
            ) {
              id
              name
            }
          }
        `,
        {
          id: categoryId,
          name: editingCategoryName,
        }
      );

      setCategories((currentCategories) =>
        currentCategories
          .map((category) =>
            category.id === categoryId
              ? data.updateCategory
              : category
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.category.id === categoryId
            ? {
                ...note,
                category: data.updateCategory,
              }
            : note
        )
      );

      if (selectedNote?.category.id === categoryId) {
        setSelectedNote((current) => ({
          ...current,
          category: data.updateCategory,
        }));
      }

      cancelCategoryEdit();
    } catch (error) {
      setCategoryError(error.message);
    } finally {
      setUpdatingCategory(false);
    }
  }

  async function deleteCategory(categoryId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCategoryId(categoryId);
      setCategoryError("");

      const data = await fetchGraphQL(
        `
          mutation DeleteCategory($id: ID!) {
            deleteCategory(id: $id) {
              success
              message
            }
          }
        `,
        {
          id: categoryId,
        }
      );

      if (!data.deleteCategory.success) {
        setCategoryError(data.deleteCategory.message);
        return;
      }

      setCategories((currentCategories) =>
        currentCategories.filter(
          (category) => category.id !== categoryId
        )
      );

      if (newCategory === categoryId) {
        const remainingCategory = categories.find(
          (category) => category.id !== categoryId
        );

        setNewCategory(remainingCategory?.id || "");
      }
    } catch (error) {
      setCategoryError(error.message);
    } finally {
      setDeletingCategoryId(null);
    }
  }

  function closeCategoryManager() {
    setShowCategoryManager(false);
    setCategoryError("");
    cancelCategoryEdit();
  }

  /*
    Advanced Search

    Search checks:
    1. Note title
    2. Note content
    3. Category name
    4. Pinned status
  */
  const filteredNotes = notes.filter((note) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      note.title.toLowerCase().includes(searchText) ||
      note.content.toLowerCase().includes(searchText) ||
      note.category.name.toLowerCase().includes(searchText) ||
      (searchText.includes("pin") && note.isPinned);

    const matchesFilter =
      filter === "all" ||
      (filter === "pinned" && note.isPinned) ||
      (filter === "unpinned" && !note.isPinned) ||
      (filter === "category" &&
        note.category &&
        note.category.id === newCategory);

    return matchesSearch && matchesFilter;
  });

  const totalNotes = notes.length;

  const pinnedNotes = notes.filter(
    (note) => note.isPinned
  ).length;

  const totalCategories = categories.length;

  const latestNote =
    notes.length > 0
      ? [...notes].sort(
          (a, b) =>
            parseInt(b.createdAt, 10) -
            parseInt(a.createdAt, 10)
        )[0]
      : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">M</div>

          <div>
            <h1>MindVault</h1>
            <span>Knowledge workspace</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-title">WORKSPACE</p>

          <button className="nav active">
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="nav"
            onClick={() => setFilter("all")}
          >
            <span>▣</span>
            All Notes
            <b>{totalNotes}</b>
          </button>

          <button
            className="nav"
            onClick={() => setFilter("pinned")}
          >
            <span>📌</span>
            Pinned
            <b>{pinnedNotes}</b>
          </button>
        </div>

        <div className="sidebar-section">
          <p className="section-title">MANAGE</p>

          <button
            className="nav"
            onClick={() => setShowCategoryManager(true)}
          >
            <span>▤</span>
            Categories
            <b>{totalCategories}</b>
          </button>
        </div>

        <div className="sidebar-footer">
          <span>MindVault</span>
          <small>Personal knowledge system</small>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">YOUR KNOWLEDGE SPACE</p>

            <h2>Dashboard</h2>

            <p className="subtitle">
              Capture ideas. Organize knowledge. Find anything.
            </p>
          </div>

          <button
            className="new-note"
            onClick={() => {
              setShowNewNote(true);
              setCreateError("");
            }}
          >
            + New Note
          </button>
        </div>

        {/* DASHBOARD SUMMARY */}

        <div
          style={{
            marginTop: "28px",
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ee",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                color: "#858a9b",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              TOTAL NOTES
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "27px",
                fontWeight: "800",
              }}
            >
              {totalNotes}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ee",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                color: "#858a9b",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              PINNED
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "27px",
                fontWeight: "800",
              }}
            >
              {pinnedNotes}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ee",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                color: "#858a9b",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              CATEGORIES
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "27px",
                fontWeight: "800",
              }}
            >
              {totalCategories}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ee",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                color: "#858a9b",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              LATEST NOTE
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                fontWeight: "800",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {latestNote ? latestNote.title : "None"}
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="toolbar">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search title, content, category or pinned..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="toolbar-info">
            {filteredNotes.length} result
            {filteredNotes.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="notes-area">
          {loading ? (
            <div className="empty-state">
              <div className="loader">⟳</div>

              <h3>Loading MindVault...</h3>

              <p>
                Connecting to your knowledge database.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>

              <h3>No results found</h3>

              <p>
                Try a different keyword, category or
                search term.
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <article
                  className="note-card"
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="note-top">
                    <span className="category-tag">
                      {note.category.name}
                    </span>

                    <button
                      className="pin"
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePin(note.id);
                      }}
                      title={
                        note.isPinned
                          ? "Unpin note"
                          : "Pin note"
                      }
                    >
                      {note.isPinned ? "★" : "☆"}
                    </button>
                  </div>

                  <h3>{note.title}</h3>

                  <p>{note.content}</p>

                  <div className="note-footer">
                    <span>
                      {formatDate(note.createdAt)}
                    </span>

                    <span className="more">•••</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* NOTE DETAIL MODAL */}

      {selectedNote && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="note-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <span className="category-tag">
                {selectedNote.category.name}
              </span>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedNote(null)
                }
              >
                ×
              </button>
            </div>

            <h2>{selectedNote.title}</h2>

            <div className="modal-content">
              {selectedNote.content}
            </div>

            <div className="modal-footer">
              <span>
                Created{" "}
                {formatDate(selectedNote.createdAt)}
              </span>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  className="modal-pin-button"
                  onClick={() =>
                    togglePin(selectedNote.id)
                  }
                >
                  {selectedNote.isPinned
                    ? "Unpin"
                    : "Pin"}
                </button>

                <button
                  className="modal-pin-button"
                  onClick={() =>
                    openEditNote(selectedNote)
                  }
                >
                  Edit
                </button>

                <button
                  className="modal-pin-button"
                  onClick={() =>
                    deleteNote(selectedNote.id)
                  }
                  disabled={deletingNote}
                >
                  {deletingNote
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}

      {editingNote && (
        <div className="modal-overlay">
          <div className="note-modal new-note-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  NOTE MANAGEMENT
                </p>

                <h2 className="new-note-title">
                  Edit Note
                </h2>
              </div>

              <button
                className="close-button"
                onClick={closeEditNote}
              >
                ×
              </button>
            </div>

            <form onSubmit={updateNote}>
              <div className="form-group">
                <label>Title</label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Content</label>

                <textarea
                  rows="7"
                  value={editContent}
                  onChange={(event) =>
                    setEditContent(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <select
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {editError && (
                <div className="form-error">
                  {editError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeEditNote}
                  disabled={updatingNote}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-button"
                  disabled={updatingNote}
                >
                  {updatingNote
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}

      {showNewNote && (
        <div className="modal-overlay">
          <div className="note-modal new-note-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  KNOWLEDGE CAPTURE
                </p>

                <h2 className="new-note-title">
                  Create New Note
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowNewNote(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={createNote}>
              <div className="form-group">
                <label>Title</label>

                <input
                  type="text"
                  placeholder="Enter note title"
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Content</label>

                <textarea
                  rows="7"
                  placeholder="Write your note..."
                  value={newContent}
                  onChange={(event) =>
                    setNewContent(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <select
                  value={newCategory}
                  onChange={(event) =>
                    setNewCategory(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {createError && (
                <div className="form-error">
                  {createError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowNewNote(false)
                  }
                  disabled={creatingNote}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-button"
                  disabled={creatingNote}
                >
                  {creatingNote
                    ? "Creating..."
                    : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER */}

      {showCategoryManager && (
        <div
          className="modal-overlay"
          onClick={closeCategoryManager}
        >
          <div
            className="note-modal new-note-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  ORGANIZATION
                </p>

                <h2 className="new-note-title">
                  Manage Categories
                </h2>
              </div>

              <button
                className="close-button"
                onClick={closeCategoryManager}
              >
                ×
              </button>
            </div>

            <form onSubmit={createCategory}>
              <div className="form-group">
                <label>Add Category</label>

                <input
                  type="text"
                  placeholder="e.g. Learning"
                  value={newCategoryName}
                  onChange={(event) =>
                    setNewCategoryName(
                      event.target.value
                    )
                  }
                />
              </div>

              {categoryError && (
                <div className="form-error">
                  {categoryError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="create-button"
                  disabled={creatingCategory}
                >
                  {creatingCategory
                    ? "Adding..."
                    : "Add Category"}
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop: "25px",
                borderTop: "1px solid #ececf1",
                paddingTop: "18px",
              }}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "11px 0",
                    borderBottom:
                      "1px solid #f0f0f4",
                  }}
                >
                  {editingCategoryId ===
                  category.id ? (
                    <>
                      <input
                        style={{
                          flex: 1,
                          border:
                            "1px solid #dedfe7",
                          borderRadius: "8px",
                          padding: "8px 10px",
                        }}
                        value={editingCategoryName}
                        onChange={(event) =>
                          setEditingCategoryName(
                            event.target.value
                          )
                        }
                      />

                      <button
                        className="modal-pin-button"
                        onClick={() =>
                          updateCategory(
                            category.id
                          )
                        }
                        disabled={
                          updatingCategory
                        }
                      >
                        Save
                      </button>

                      <button
                        className="modal-pin-button"
                        onClick={
                          cancelCategoryEdit
                        }
                        disabled={
                          updatingCategory
                        }
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {category.name}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          gap: "7px",
                        }}
                      >
                        <button
                          className="modal-pin-button"
                          onClick={() =>
                            startCategoryEdit(
                              category
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="modal-pin-button"
                          onClick={() =>
                            deleteCategory(
                              category.id
                            )
                          }
                          disabled={
                            deletingCategoryId ===
                            category.id
                          }
                        >
                          {deletingCategoryId ===
                          category.id
                            ? "..."
                            : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;