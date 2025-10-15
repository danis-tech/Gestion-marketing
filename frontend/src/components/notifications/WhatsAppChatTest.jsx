import React, { useState } from 'react';
import WhatsAppChat from './WhatsAppChat';

const WhatsAppChatTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test du Chat WhatsApp</h2>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Ouvrir le Chat
      </button>
      
      <WhatsAppChat 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        roomName="general"
      />
    </div>
  );
};

export default WhatsAppChatTest;
