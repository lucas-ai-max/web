import React, { useState, useEffect, useRef } from 'react';
import Roundtable from './components/Roundtable';
import ChatInterface from './components/ChatInterface';

// Personalities configuration
const PERSONALITIES = {
  1: {
    name: 'Zuck',
    role: 'Arquiteto do Metaverso',
    systemPrompt: 'Você é Mark Zuckerberg. Fale de forma robótica e orientada a dados, focando em conexão social e metaverso. Use frases curtas e diretas.'
  },
  2: {
    name: 'Gates',
    role: 'Otimista Global',
    systemPrompt: 'Você é Bill Gates. Seja pragmático, intelectual e focado em resolver problemas da humanidade. Mencione livros e dados globais.'
  },
  3: {
    name: 'Bezos',
    role: 'Pioneiro Espacial',
    systemPrompt: 'Você é Jeff Bezos. Seja ambicioso, obsessivo pelo cliente e mencione espaço. Use "Dia 1" e pense a longo prazo. Ria ocasionalmente.'
  },
  4: {
    name: 'Musk',
    role: 'Visionário de Marte',
    systemPrompt: 'Você é Elon Musk. Seja caótico, use emojis de foguete, pense em primeiros princípios. Mencione Marte, IA e probabilidades baixas.'
  },
  5: {
    name: 'Cook',
    role: 'Perfeccionista do Design',
    systemPrompt: 'Você é Tim Cook. Seja polido, focado em privacidade e design elegante. Mencione cadeia de suprimentos e "o melhor produto que já criamos".'
  }
};

// Mock responses for each personality (in Portuguese)
const MOCK_RESPONSES = {
  1: [ // Zuck
    "A conexão humana é fundamental.",
    "O metaverso vai transformar isso.",
    "Os dados mostram uma tendência clara.",
    "Precisamos otimizar a experiência.",
    "Vamos integrar isso à plataforma."
  ],
  2: [ // Gates
    "Olhando os dados globais...",
    "A tecnologia deve servir a humanidade.",
    "Li sobre isso recentemente.",
    "Podemos erradicar esse problema.",
    "É uma questão de inovação pragmática."
  ],
  3: [ // Bezos
    "É sempre o Dia 1.",
    "O cliente deve ser nossa obsessão.",
    "Pensando a longo prazo...",
    "Haha! A escala disso é imensa.",
    "Vamos lançar isso ao espaço!"
  ],
  4: [ // Musk
    "A probabilidade é baixa...",
    "Mas vamos fazer mesmo assim. 🚀",
    "Isso viola primeiros princípios?",
    "Marte precisa disso.",
    "A IA vai resolver isso em breve."
  ],
  5: [ // Cook
    "Acreditamos profundamente nisso.",
    "Privacidade é um direito humano.",
    "O design deve ser elegante.",
    "Nossa cadeia está preparada.",
    "É o melhor que já criamos."
  ]
};

function App() {
  const [messages, setMessages] = useState([
    { sender: 'ai', speakerId: 1, name: 'Zuck', text: 'Bem-vindo à Mesa Redonda dos Gênios.' }
  ]);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [thinkingSpeaker, setThinkingSpeaker] = useState(null);
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const speakerOrder = [1, 2, 3, 4, 5]; // Order of speakers in a round

  const handleSendMessage = (text) => {
    if (isRoundInProgress) return; // Prevent new questions during a round

    // Add user message
    const newMessage = { sender: 'user', text };
    setMessages(prev => [...prev, newMessage]);

    // Start a round where all 5 AIs respond one by one
    setIsRoundInProgress(true);
    setCurrentSpeakerIndex(0);
    startNextSpeaker(0, text);
  };

  const startNextSpeaker = (index, userQuestion) => {
    if (index >= speakerOrder.length) {
      // Round complete
      setIsRoundInProgress(false);
      setActiveSpeaker(null);
      setThinkingSpeaker(null);
      return;
    }

    const speakerId = speakerOrder[index];

    // Show thinking animation
    setThinkingSpeaker(speakerId);
    setActiveSpeaker(null);

    // Wait 2 seconds for "thinking"
    setTimeout(() => {
      setThinkingSpeaker(null);
      setActiveSpeaker(speakerId);

      // Start RPG-style text streaming for this speaker
      startRPGStream(speakerId, () => {
        // After this speaker finishes, move to next
        setTimeout(() => {
          setActiveSpeaker(null);
          startNextSpeaker(index + 1, userQuestion);
        }, 1000); // Brief pause before next speaker
      });
    }, 2000); // Thinking duration
  };

  const startRPGStream = (speakerId, onComplete) => {
    const responses = MOCK_RESPONSES[speakerId];
    const personalityName = PERSONALITIES[speakerId].name;
    let chunkIndex = 0;

    const showNextChunk = () => {
      if (chunkIndex < responses.length) {
        const chunk = responses[chunkIndex];

        // Add message to chat log
        setMessages(prev => [...prev, {
          sender: 'ai',
          speakerId,
          name: personalityName,
          text: chunk
        }]);

        chunkIndex++;

        // Wait 3.5 seconds before showing next chunk (increased from 2.5s)
        setTimeout(showNextChunk, 3500);
      } else {
        // Stream complete for this speaker
        if (onComplete) onComplete();
      }
    };

    showNextChunk();
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Roundtable
        activeSpeaker={activeSpeaker}
        thinkingSpeaker={thinkingSpeaker}
        messages={messages}
      />
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        disabled={isRoundInProgress}
      />
    </div>
  );
}

export default App;
