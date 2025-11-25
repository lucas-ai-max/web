import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

const ChatInterface = ({ messages, onSendMessage, disabled }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputText.trim() && !disabled) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <h3>Session Log</h3>
            </div>

            <div className="messages-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                        <div className="message-sender">
                            {msg.sender === 'user' ? 'You' : msg.name}
                        </div>
                        <div className="message-text">{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={disabled ? "AIs are discussing..." : "Ask the council..."}
                    disabled={disabled}
                />
                <button type="submit" disabled={disabled}>Send</button>
            </form>
        </div>
    );
};

export default ChatInterface;
