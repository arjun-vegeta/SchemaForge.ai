# Data Schema & API Endpoint Generator

A powerful tool that converts natural language descriptions into JSON schemas, REST API endpoints, and ERP diagrams using AI.

## Features

- 🧠 **Natural Language Processing**: Describe your data requirements in plain English
- 📊 **JSON Schema Generation**: Automatically generates valid JSON schemas
- 🔗 **REST API Generation**: Creates complete OpenAPI specifications
- 🎨 **ERP Diagram Generation**: Visual entity relationship diagrams using Mermaid
- 🚀 **Export Options**: Download schemas, API specs, and diagram code
- 💡 **AI-Powered**: Uses Google Gemini API for intelligent parsing

## Tech Stack

### Backend
- Node.js + Express
- Google Gemini API
- JSON Schema validation
- OpenAPI/Swagger generation

### Frontend
- React + TypeScript
- Tailwind CSS
- Mermaid.js for diagrams
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Add your Google Gemini API key to the `.env` file.

4. Start the development servers:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Usage

1. **Describe Your Data**: Enter a natural language description of your data requirements
   
   Example: "I need to store user profiles with name, email, and age, and also product details with name, price, and description"

2. **Generate Schema**: The AI will parse your description and generate:
   - JSON Schema definitions
   - REST API endpoints
   - ERP diagram code

3. **View Results**: 
   - Interactive ERP diagram
   - Downloadable JSON schemas
   - OpenAPI specification
   - Sample API code

## Example Input

```
I need to manage a library system with:
- Books that have title, author, ISBN, and publication year
- Authors with name, biography, and birth date
- Users who can borrow books, with name, email, and membership date
- Borrowing records that link users to books with borrow and return dates
```

## Project Structure

```
schema-api-generator/
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   └── app.js         # Express app
│   └── package.json
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main App component
│   └── package.json
└── package.json           # Root package.json

```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 