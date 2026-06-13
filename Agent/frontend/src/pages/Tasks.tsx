import React from 'react';
import Chat from '../components/Chat';

export default function Tasks() {
  return (
    <div className="main-content">
      <section className="forms-section" style={{ gridColumn: '1 / -1' }}>
        <h3>
          <i className="fas fa-list-check" /> Task Management
        </h3>
        <div className="forms-container">
          <div className="form-card">
            <form id="taskForm">
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title:</label>
                <input type="text" id="taskTitle" name="taskTitle" placeholder="Enter task title" />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description:</label>
                <textarea id="taskDescription" name="description" placeholder="Enter task description" />
              </div>
              <div className="form-group">
                <label htmlFor="taskPriority">Priority:</label>
                <select id="taskPriority" name="priority">
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Create Task</button>
            </form>
          </div>
        </div>
      </section>
      <Chat />
    </div>
  );
}


