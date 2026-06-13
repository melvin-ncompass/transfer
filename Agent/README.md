# AI Assistant Dashboard

A modern web application featuring a user information display and an AI-powered chatbox that can understand natural language commands and perform tasks like automatically filling out forms.

## Features

### 🎨 Modern UI
- Beautiful gradient design with glassmorphism effects
- Responsive layout that works on desktop and mobile
- Smooth animations and hover effects
- Professional color scheme and typography

### 👤 User Information Panel
- User profile display with avatar
- Contact information (email, phone, location)
- Company and job title information
- Hover effects and visual feedback

### 📝 Interactive Forms
- **Contact Form**: Name, email, and message fields
- **Profile Update Form**: Full name, job title, and bio
- **Task Management Form**: Task title, description, and priority

### 🤖 AI Chat Assistant
- Natural language processing for commands
- Real-time typing indicators
- Message history with clear chat functionality
- Context-aware responses

### ⚡ AI-Powered Task Execution
The AI assistant can understand and execute commands like:

#### Form Filling Commands
- "Fill out the contact form with my information"
- "Update my profile with Software Engineer title"
- "Fill the contact form and create a task for follow-up"

#### Task Creation
- "Create a high priority task for reviewing code"
- "Make a task for meeting preparation"
- "Add an urgent task for bug fixes"

#### Form Management
- "Clear the contact form"
- "Reset the profile form"
- "Empty the task form"

#### Information Requests
- "What can you do?"
- "Help me with forms"
- "Show me available commands"

## How to Use

### Setup (First Time)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Get Your DeepSeek API Key**
   - Visit [DeepSeek Platform](https://platform.deepseek.com/)
   - Sign up or log in to your account
   - Generate an API key from your dashboard

3. **Configure Environment Variables**
   - Copy `env.example` to `.env`:
     ```bash
     cp env.example .env
     ```
   - Edit `.env` and add your DeepSeek API key:
     ```
     DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
     PORT=3000
     ```

4. **Run Backend (NestJS)**
   ```bash
   cd backend
   npm install
   npm run start:dev
   # Backend runs at http://localhost:3001
   ```

5. **Run Frontend (React + Vite)**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Frontend runs at http://localhost:5173 and proxies /api to :3001
   ```

6. **Access the Application**
   - Open your browser and go to `http://localhost:5173`
   - The AI assistant will load configuration from the NestJS backend

### Using the Application

1. **Interact with the AI**
   - Type natural language commands in the chatbox
   - The AI will understand your intent and perform actions using DeepSeek's advanced language understanding
   - Watch as forms are automatically filled or cleared

2. **Try Example Commands**
   ```
   Fill out the contact form with my information
   Create a high priority task for code review
   Update my profile title to Senior Developer
   Clear the task form
   What can you do?
   Help me organize my tasks
   ```

3. **Configuration Management**
   - **Refresh Config**: `AIAssistantUtils.refreshConfig()` - Reload configuration from server
   - **Check API Status**: `AIAssistantUtils.getApiKeyStatus()` - Check if API key is loaded
   - **Server Status**: `AIAssistantUtils.getServerStatus()` - Check server connection

## Technical Implementation

### Architecture
- **Frontend**: React + Vite app under `frontend/`
- **Backend**: NestJS server under `backend/`
- **AI Processing**: DeepSeek API integration with real LLM responses
- **Form Management**: Dynamic form filling and clearing
- **Task Execution**: AI-powered command parsing and action execution
- **Conversation Memory**: Maintains context across interactions
- **Environment**: Secure API key management via .env file

### Key Components

#### AIAssistant Class
- Handles chat functionality and real-time message processing
- Manages form interactions and task execution
- Integrates with DeepSeek API for intelligent responses
- Maintains conversation history and context

#### Express Server (server.js)
- Serves static files and handles API endpoints
- Securely manages environment variables from .env file
- Provides configuration endpoint for frontend
- Health check endpoint for monitoring
- CORS enabled for development

#### DeepSeek API Integration
- Real-time API calls to DeepSeek's chat completion endpoint
- System prompts with context about available forms and user data
- JSON response parsing for structured actions
- Server-side API key management for security

#### Command Processing
- AI-powered natural language understanding
- Context extraction (titles, priorities, form types)
- Task queue management for multiple actions
- Conversation memory for better context awareness

#### Visual Feedback
- Real-time typing indicators
- Form field highlighting during filling
- Success messages for completed actions
- Smooth animations and transitions

## Customization

### Adding New Commands
Extend the `processUserMessage` method in `script.js`:

```javascript
else if (lowerMessage.includes('your_command')) {
    response.message = 'Your response message';
    response.tasks.push({
        type: 'fillForm', // or 'clearForm'
        formId: 'yourFormId',
        data: { fieldId: 'value' }
    });
}
```

### Adding New Forms
1. Add HTML form structure to `index.html`
2. Update the `forms` object in the AIAssistant constructor
3. Add form handling logic to the command processor

### Styling Customization
- Modify `styles.css` for visual changes
- Update color scheme in CSS variables
- Adjust animations and transitions

### User Data
Update the `userData` object in `script.js` to customize user information:

```javascript
this.userData = {
    name: 'Your Name',
    email: 'your.email@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Your City, State',
    company: 'Your Company',
    title: 'Your Job Title'
};
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Future Enhancements

### Additional LLM Providers
The application can be easily extended to support other LLM providers:

1. **OpenAI Integration**: Add OpenAI GPT-4 support
2. **Anthropic Claude**: Integrate Claude-3 models
3. **Google Gemini**: Add Gemini Pro support
4. **Multi-Provider**: Allow switching between different providers

### Advanced Features
- Multi-step task execution
- Form validation and error handling
- User preferences and settings
- Command history and favorites
- Export/import functionality
- Multi-language support

### Backend Integration
- User authentication and profiles
- Data persistence
- Real-time collaboration
- Analytics and usage tracking

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.
