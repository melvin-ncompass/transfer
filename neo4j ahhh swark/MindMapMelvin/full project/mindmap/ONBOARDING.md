# 🚀 MindMap Repository - Developer Onboarding Workflow

## Welcome New Developer! 

This interactive workflow diagram will guide you through understanding and contributing to the MindMap repository. Follow the visual flow chart to learn about the system architecture, set up your development environment, and start making meaningful contributions.

## 📋 Quick Start Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] Neo4j Desktop or Cloud instance
- [ ] Code editor (VS Code recommended)

### Initial Setup
1. **Clone Repository**
   ```bash
   git clone https://github.com/ncompass-ts/mindmap.git
   cd mindmap
   ```

2. **Frontend Setup** (in `/client` folder)
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

3. **Backend Setup** (in `/server` folder)
   ```bash
   cd server
   npm install
   # Configure .env file with Neo4j credentials
   npm run start:dev
   ```
   Backend runs on: `http://localhost:3000`

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18+** with TypeScript
- **Vite** for fast development
- **Material-UI (MUI)** for components
- **GoJS** for interactive diagrams
- **React Router** for navigation

### Backend Stack
- **NestJS** framework
- **Neo4j** graph database
- **JWT** authentication
- **TypeScript** for type safety

### Key Features
- **Code Analysis**: Parse uploaded code to extract dependencies
- **Mind Map Generation**: Create interactive visualizations
- **Project Management**: Handle multiple code projects
- **User Authentication**: Secure access control

## 🎯 Learning Paths

### 🎨 Frontend Developer Path
1. Study React components in `/client/src/components/`
2. Learn GoJS visualization in `OverviewResizing.tsx`
3. Understand Material-UI theming and responsive design
4. Practice with mind map interactions and layouts

### ⚙️ Backend Developer Path
1. Explore NestJS modules in `/server/src/`
2. Learn Neo4j graph database concepts
3. Study API endpoints and authentication
4. Understand code analysis algorithms

### 🔄 Full-Stack Path
1. Follow both frontend and backend paths
2. Focus on API integration between layers
3. Learn end-to-end data flow
4. Understand deployment and DevOps

## 🛠️ Common Development Tasks

### Adding New Features
1. **UI Enhancement**: Modify components, add new visualizations
2. **API Development**: Create new endpoints, extend services  
3. **Database**: Design new graph schemas, optimize queries
4. **Testing**: Add unit tests, integration tests

### Code Quality Standards
- Use TypeScript for type safety
- Follow ESLint rules for consistency
- Write meaningful commit messages
- Add proper error handling
- Include documentation for complex logic

## 📚 Helpful Resources

### Documentation
- [GoJS Documentation](https://gojs.net/latest/learn/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Neo4j Developer Guides](https://neo4j.com/developer/get-started/)
- [Material-UI Documentation](https://mui.com/getting-started/)

### Repository Structure
```
mindmap/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── data/       # Static data and types
│   │   └── hooks/      # Custom React hooks
├── server/          # NestJS backend
│   ├── src/
│   │   ├── auth/       # Authentication module
│   │   ├── projects/   # Project management
│   │   ├── neo4j/      # Database service
│   │   └── entities/   # TypeORM entities
└── shared.ts        # Shared types between client/server
```

## 🤝 Getting Help

1. **Check the Workflow**: Use the interactive diagram at `/workflow`
2. **Ask Questions**: Reach out to senior developers
3. **Review Code**: Study existing implementations
4. **Documentation**: Read inline comments and README files

## 🎉 First Contribution Ideas

### Beginner Friendly
- Fix UI bugs or improve styling
- Add loading states and error messages
- Improve accessibility features
- Update documentation

### Intermediate
- Add new GoJS node templates
- Implement new API endpoints
- Add data export features
- Performance optimizations

### Advanced
- Design new graph algorithms
- Implement real-time collaboration
- Add advanced visualization features
- Scale database architecture

Remember: Every expert was once a beginner. Take your time, ask questions, and enjoy learning about this fascinating codebase! 🚀