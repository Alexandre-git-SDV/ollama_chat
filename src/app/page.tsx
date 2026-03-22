'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { useConversations } from '@/hooks/useConversations';
import { Message } from '@/types/chat';

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
    renameConversation,
    addMessage,
    updateLastAssistantMessage,
    saveConversation,
    isLoading,
    mounted,
    generateTitle,
  } = useConversations();

  const [sidebarWidth, setSidebarWidth] = useState(288);

  const handleNewConversation = useCallback(() => {
    createConversation(model, temperature, maxTokens, systemPrompt);
  }, [createConversation, model, temperature, maxTokens, systemPrompt]);

  const handleEnsureConversation = useCallback(async (): Promise<string> => {
    if (activeId) return activeId;
    return createConversation(model, temperature, maxTokens, systemPrompt);
  }, [activeId, createConversation, model, temperature, maxTokens, systemPrompt]);

  const handleSaveConversation = useCallback(
    async (convId: string) => {
      await saveConversation(convId);
    },
    [saveConversation]
  );

  const handleGenerateTitle = useCallback(
    async (convId: string, messages: Message[]) => {
      await generateTitle(convId, messages, model);
    },
    [generateTitle, model]
  );

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
          onRenameConversation={renameConversation}
          isLoading={isLoading}
          mounted={mounted}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={setSidebarWidth}
        />
      )}
      <MainContent
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        settings={{ model, temperature, maxTokens, systemPrompt }}
        conversation={active}
        onEnsureConversation={handleEnsureConversation}
        onAddMessage={addMessage}
        onUpdateAssistant={updateLastAssistantMessage}
        onSaveConversation={handleSaveConversation}
        onGenerateTitle={handleGenerateTitle}
      />
    </div>
  );
}
