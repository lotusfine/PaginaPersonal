const fs = require('fs');
const axios = require('axios');

const htmlFilePath = './index.html';
const cssFilePath = './style.css';
const jsFilePath = './main.js';

// Define a simple prompt for Ollama
const prompt = `
Write a JavaScript function to log "Hello, world!" to the console.
`;

// Ollama configuration
const ollamaUrl = 'http://127.0.0.1:11434/v1/chat/completions'; // Ensure the correct endpoint

// Read file content
const readFileSync = (path) => {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    return null;
  }
};

const htmlContent = readFileSync(htmlFilePath);
const cssContent = readFileSync(cssFilePath);
const jsContent = readFileSync(jsFilePath);

// Prepare data for Ollama
const promptData = {
  model: "llama3.2", // Ensure this matches the correct model name
  prompt: prompt,
  code: {
    html: htmlContent || "",
    css: cssContent || "",
    js: jsContent || "",
  }
};

// Request code generation from Ollama
axios.post(ollamaUrl, promptData)
  .then(response => {
    const { html, css, js } = response.data;

    // Write the new content back to files
    if (html) fs.writeFileSync(htmlFilePath, html);
    if (css) fs.writeFileSync(cssFilePath, css);
    if (js) fs.writeFileSync(jsFilePath, js);

    console.log('Code successfully inserted.');
  })
  .catch(error => {
    console.error('Error calling Ollama:', error.message);
  });
