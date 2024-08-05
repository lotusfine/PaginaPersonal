const axios = require('axios');

const OLLAMA_API_URL = 'https://api.ollama.com/generate'; // Asegúrate de que esta es la URL correcta
const API_KEY = 'YOUR_OLLAMA_API_KEY'; // Reemplaza con tu clave API de Ollama

async function generateCode(prompt) {
    try {
        const response = await axios.post(OLLAMA_API_URL, {
            prompt,
            model: 'code-generator', // Asegúrate de que este es el modelo correcto
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
}

module.exports = { generateCode };
