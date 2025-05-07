// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

// --------------------------- App Bootstrapping ---------------------------
// This is the React entry point that mounts <App /> into the #root element
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Enables client-side routing */}
    <BrowserRouter>
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  </React.StrictMode>
);
