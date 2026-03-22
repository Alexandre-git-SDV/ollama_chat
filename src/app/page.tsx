'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { useConversations } from '@/hooks/useConversations';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');

  const {
    conversations,
    active,
    activeId,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    updateLastAssistantMessage,
  } = useConversations();

  const handleNewConversation = useCallback(() => {
    createConversation(model);
  }, [createConversation, model]);

  const handleEnsureConversation = useCallback((): string => {
    if (activeId) return activeId;
    return createConversation(model);
  }, [activeId, createConversation, model]);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          selectedModel={model}
          onModelChange={setModel}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onNewConversation={handleNewConversation}
          onSwitchConversation={switchConversation}
          onDeleteConversation={deleteConversation}
        />
      )}
      <MainContent
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        settings={{ model, temperature, maxTokens, systemPrompt }}
        conversation={active}
        onEnsureConversation={handleEnsureConversation}
        onAddMessage={addMessage}
        onUpdateAssistant={updateLastAssistantMessage}
      />
    </div>
  );
}