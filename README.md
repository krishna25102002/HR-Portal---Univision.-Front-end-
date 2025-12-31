# HR Portal Frontend

React frontend for the HR Portal recruitment management system.

## Setup Instructions

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

3. **Build for production**:
```bash
npm run build
```

## Pages

- **Dashboard**: Overview of recruitment metrics
- **Candidates**: Manage candidates and their information
- **Interviews**: Schedule and track interviews
- **Offers**: Create and manage job offers
- **AI Assistant**: Use Gemini AI for resume analysis and suggestions

## Features

- Candidate management with status tracking
- Resume upload (PDF/DOCX) with parsing
- Interview scheduling and email notifications
- Offer letter creation and delivery
- AI-powered resume analysis
- Email integration with Gmail and Outlook

## Configuration

The API base URL defaults to `http://localhost:5000`. To change it, edit `src/api/client.js`:

```javascript
const API_BASE_URL = 'your_api_url';
```

## Dependencies

- react: UI framework
- react-router-dom: Routing
- axios: HTTP client
- react-toastify: Notifications
- date-fns: Date utilities
