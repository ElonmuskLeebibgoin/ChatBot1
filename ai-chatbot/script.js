document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const loading = document.getElementById('loading');

    function addMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'ai-message');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function simulateAIResponse(message) {
        loading.style.display = 'flex';
        setTimeout(() => {
            loading.style.display = 'none';
            let response = "I'm sorry, I don't understand. Can you please rephrase?";
            
            if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                response = "Hello! How can I assist you today?";
            } else if (message.toLowerCase().includes('how are you')) {
                response = "As an AI, I don't have feelings, but I'm functioning well. How can I help you?";
            } else if (message.toLowerCase().includes('weather')) {
                response = "I'm sorry, I don't have real-time weather information. You might want to check a weather website or app for that.";
            } else if (message.toLowerCase().includes('joke')) {
                response = "Why don't scientists trust atoms? Because they make up everything!";
            }
            
            addMessage(response);
        }, 1500);
    }

    function handleSendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            simulateAIResponse(message);
        }
    }

    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});