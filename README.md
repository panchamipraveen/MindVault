# MindVault

A GraphQL-based Notes API built with Node.js, Express, Mongoose, and MongoDB.

## Overview

MindVault is a backend Notes Management API that allows users to organize notes using categories.

The project demonstrates:

- GraphQL API design
- MongoDB data persistence
- Mongoose models and relationships
- CRUD operations
- Search and filtering
- Note pinning
- Validation and error handling
- Git branching and version control

## Tech Stack

- Node.js
- Express.js
- GraphQL
- GraphQL HTTP
- MongoDB
- Mongoose
- Git

## Project Structure

```text
MindVault/
├── src/
│   ├── models/
│   │   ├── Category.js
│   │   └── Note.js
│   ├── schema/
│   │   └── schema.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md





## Core Features
### Categories

- Create category
- List categories
- Update category
- Delete category
- Prevent deletion when notes are using the category
- Prevent duplicate category names
### Notes

- Create note
- List notes
- Get a single note
- Update note
- Delete note
- Assign notes to categories
- Search notes by keyword
- Filter notes by category
- Filter pinned notes
- Pin and unpin notes
- Paginate notes with page and limit
- Sort notes by newest or oldest
- Get total note count with filters
- Validate pagination parameters
## Data Relationship

Each note belongs to a category.

```text
Category
   │
   └── Note
        ├── title
        ├── content
        ├── category
        ├── isPinned
        ├── createdAt
        └── updatedAt



MongoDB references are used to maintain the relationship between notes and categories.

## GraphQL Operations
### Queries
```graphql
categories
```graphql
notes
```graphql
note(id: ID!)
### Mutations
```graphql
createCategory
updateCategory
deleteCategory

createNote
updateNote
deleteNote

togglePin
## Example

### Category

```text
Name: Recipes
Title: Biryani Recipe
Content: My favourite biryani recipe, ingredients and cooking steps
Category: Recipes
Pinned: true
## Validation & Business Rules

MindVault includes validation and business rules such as:

- Category name cannot be empty
- Duplicate categories are rejected
- Note title cannot be empty
- Note content cannot be empty
- Notes must reference an existing category
- Non-existent notes return appropriate errors
- A category cannot be deleted while notes are still using it
## Running the Project
### 1. Install dependencies

```bash
npm install
```
### 2. Configure environment variables

Create a `.env` file:

```text
MONGODB_URI=your_mongodb_connection_string
```
### 3. Start the server

```bash
node src/server.js
```

The server runs on:

```text
http://localhost:3000
``` 
## Architecture

```text
Client
  │
  ▼
GraphQL API
  │
  ▼
Express / Node.js
  │
  ▼
Mongoose
  │
  ▼
MongoDB
```
## Git Workflow

The project uses Git for version control.

Main branches:

```text
main
development
```

Development work is performed on the `development` branch before being merged into `main`.
## Project Goal

The goal of MindVault is to demonstrate a clean, scalable backend architecture for managing structured notes and categories using GraphQL and MongoDB.
