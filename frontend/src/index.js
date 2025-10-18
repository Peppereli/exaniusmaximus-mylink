import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './tailwind.css';
// Ensure 'root' matches the ID in your public/index.html
const rootElement = document.getElementById('root'); 

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    // Add a log/error message for debugging if the element is not found
    console.error('Failed to find the root element with ID "root".');
}
