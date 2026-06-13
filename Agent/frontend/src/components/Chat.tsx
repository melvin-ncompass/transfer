import React, { useEffect, useMemo, useRef, useState } from 'react';

type Task =
  | { type: 'fillForm'; formId: string; data: Record<string, string> }
  | { type: 'clearForm'; formId: string }
  | { type: 'navigate'; to: string };

export default function Chat() {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; content: string }[]>([
    { sender: 'ai', content: "Hello! I'm your AI assistant powered by DeepSeek." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const formIdToPath = useMemo(
    () => ({ contactForm: '/contact', profileForm: '/profile', taskForm: '/tasks' }),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        setVisible((v) => !v);
      }
      if (e.key === 'Escape' && visible) setVisible(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingTasks');
    if (!raw) return;
    sessionStorage.removeItem('pendingTasks');
    try {
      const tasks = JSON.parse(raw) as Task[];
      if (Array.isArray(tasks) && tasks.length) executeTasks(tasks);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages((m) => [...m, { sender: 'user', content: msg }]);
    setInput('');
    setTyping(true);

    try {
      const sys = createSystemPrompt();
      const res = await fetch('/api/config');
      const cfg = await res.json();
      const apiKey: string | null = cfg.apiKey;
      if (!apiKey) {
        setTyping(false);
        setMessages((m) => [...m, { sender: 'ai', content: 'No API key configured on server.' }]);
        return;
      }

      const body = {
        model: cfg.model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: msg },
        ],
        max_tokens: cfg.maxTokens,
        temperature: cfg.temperature,
        stream: false,
      };

      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content ?? 'No response';
      const parsed = parseAIResponse(content);
      setTyping(false);
      setMessages((m) => [...m, { sender: 'ai', content: parsed.message }]);
      if (parsed.tasks?.length) await executeTasks(parsed.tasks);
    } catch (e) {
      setTyping(false);
      setMessages((m) => [...m, { sender: 'ai', content: 'Request failed.' }]);
    }
  }

  function parseAIResponse(content: string): { message: string; tasks: Task[] } {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { message: parsed.message || content, tasks: parsed.tasks || [] };
      }
    } catch {}
    return { message: content, tasks: [] };
  }

  function createSystemPrompt() {
    return `You are an AI assistant helping users interact with a web dashboard. You can:
1. Fill out forms automatically
2. Create and manage tasks
3. Update user profiles
4. Clear forms
5. Provide helpful information
6. Navigate to another page when needed to complete actions

Available forms:
- Contact Form (fields: contactName, contactEmail, contactMessage)
- Profile Form (fields: profileName, profileTitle, profileBio)
- Task Form (fields: taskTitle, taskDescription, taskPriority)

Pages:
- Home: /
- Contact: /contact
- Profile: /profile
- Tasks: /tasks

When you need to perform actions, respond with a JSON object in this format:
{
  "message": "Your response message to the user",
  "tasks": [
    { "type": "fillForm" | "clearForm" | "navigate", "formId": "contactForm" | "profileForm" | "taskForm", "data": { "fieldId": "value" }, "to": "/profile" }
  ]
}

For regular conversation, just respond normally without JSON. Be helpful, concise, and friendly.`;
  }

  async function executeTasks(tasks: Task[]) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      await new Promise((r) => setTimeout(r, 300));

      if (task.type === 'navigate') {
        const remaining = tasks.slice(i + 1);
        if (remaining.length) sessionStorage.setItem('pendingTasks', JSON.stringify(remaining));
        window.location.href = task.to;
        return;
      }

      switch (task.type) {
        case 'fillForm': {
          const form = document.getElementById(task.formId) as HTMLFormElement | null;
          if (!form) {
            const path = (formIdToPath as any)[task.formId];
            const remaining = tasks.slice(i);
            if (path) {
              sessionStorage.setItem('pendingTasks', JSON.stringify(remaining));
              window.location.href = path;
              return;
            }
          } else {
            for (const [fieldId, value] of Object.entries(task.data)) {
              const field = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
              if (field) (field as any).value = value;
            }
          }
          break;
        }
        case 'clearForm': {
          const form = document.getElementById(task.formId) as HTMLFormElement | null;
          if (!form) {
            const path = (formIdToPath as any)[task.formId];
            const remaining = tasks.slice(i);
            if (path) {
              sessionStorage.setItem('pendingTasks', JSON.stringify(remaining));
              window.location.href = path;
              return;
            }
          } else {
            form.querySelectorAll('input, textarea, select').forEach((el) => ((el as any).value = ''));
          }
          break;
        }
      }
    }
  }

  return (
    <div className="chat-container" id="chatContainer" style={{ display: visible ? 'flex' : 'none' }}>
      <div className="chat-header">
        <h3>
          <i className="fas fa-comments" /> AI Assistant
        </h3>
        <div className="chat-controls">
          <button className="btn-secondary" onClick={() => setVisible(false)}>
            <i className="fas fa-times" /> Hide
          </button>
        </div>
      </div>
      <div className="chat-messages" id="chatMessages" ref={messagesRef}>
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.sender}-message`}>
            <div className="message-avatar">
              <i className={`fas ${m.sender === 'ai' ? 'fa-robot' : 'fa-user'}`} />
            </div>
            <div className="message-content">
              {m.content.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            id="chatInput"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button id="sendMessage" className="send-btn" onClick={send}>
            <i className="fas fa-paper-plane" />
          </button>
        </div>
        <div className={`typing-indicator ${typing ? 'show' : ''}`} id="typingIndicator">
          <span>AI is typing...</span>
        </div>
      </div>
    </div>
  );
}


