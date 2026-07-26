import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from './Icons';

export default function ChatModal({ traveler, onClose }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Simulate a realistic chat conversation
    const conversation = [
      { sender: 'them', text: `Hi! I saw we matched. Thanks for reaching out!` },
      { sender: 'me', text: `Hey ${traveler.name}! Yeah, I noticed we both love Korean BBQ.` },
      { sender: 'them', text: `Yes! I'm really excited to try authentic K-BBQ. Have you been to any good places around Hongdae?` },
      { sender: 'me', text: `There's a famous one called Saemaeul Sikdang that's great for first-timers.` },
      { sender: 'them', text: `Sounds perfect! I heard the drinking culture with Soju and beer (Somek) is fun too.` },
      { sender: 'me', text: `Definitely. We should order some Makgeolli too, it's traditional rice wine.` },
      { sender: 'them', text: `Awesome. Are you free this Friday evening around 7 PM?` },
      { sender: 'me', text: `Friday 7 PM works for me. Let's meet at Hongdae Station Exit 9.` },
      { sender: 'them', text: `Great! See you then.` }
    ];
    setMessages(conversation);
  }, [traveler.name]);

  return (
    <div className="chat-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
      <div className="chat-header" style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="icon-btn" onClick={onClose}><ChevronLeftIcon size={24} /></button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: traveler.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {traveler.name.slice(0, 1)}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{traveler.name}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Online now</p>
        </div>
      </div>
      <div className="chat-body" style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f9f9f9' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', background: msg.sender === 'me' ? '#4CAF50' : '#fff', color: msg.sender === 'me' ? '#fff' : '#333', padding: '10px 14px', borderRadius: '16px', maxWidth: '75%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-footer" style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
        <input type="text" placeholder="Type a message..." style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }} />
        <button className="btn-primary" style={{ padding: '10px 16px', borderRadius: '20px' }}>Send</button>
      </div>
    </div>
  );
}
