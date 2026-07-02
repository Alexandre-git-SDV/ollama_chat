'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { useConversations } from '@/hooks/useConversations';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useOllama } from '@/hooks/useOllama';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { ACCENTS } from '@/lib/theme';
import { Message } from '@/types/chat';

// Chargée à la demande (ouverture de la modale) pour l'écarter du bundle initial.
const SettingsModal = dynamic(() => import('@/components/settings/SettingsModal'), {
  ssr: false,
});

export default function Home() {
  const isDesktop = useIsDesktop();
  // null = suit le breakpoint (ouvert sur desktop, fermé sur mobile) ; sinon choix explicite.
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const sidebarOpen = sidebarOverride ?? isDesktop;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelChoice, setModelChoice] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');

  const [focusSignal, setFocusSignal] = useState(0);

  const { online, models, loadedModels, refresh } = useOllama();
  const {
    accent,
    setAccent,
    theme,
    toggleTheme,
    sources,
    addSource,
    removeSource,
    updateSourceKey,
    updateSourceName,
  } = useAppSettings();

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

  // Modèle effectif : choix explicite de l'utilisateur, sinon premier modèle disponible.
  const model = modelChoice || models[0]?.name || '';

  const closeSidebarOnMobile = useCallback(() => {
    if (!isDesktop) setSidebarOverride(false);
  }, [isDesktop]);

  const handleNewConversation = useCallback(() => {
    createConversation(model, temperature, maxTokens, systemPrompt);
    setFocusSignal((n) => n + 1);
    closeSidebarOnMobile();
  }, [createConversation, model, temperature, maxTokens, systemPrompt, closeSidebarOnMobile]);

  const handleSwitchConversation = useCallback(
    (id: string) => {
      switchConversation(id);
      closeSidebarOnMobile();
    },
    [switchConversation, closeSidebarOnMobile]
  );

  const handleEnsureConversation = useCallback(async (): Promise<string> => {
    if (activeId) return activeId;
    return createConversation(model, temperature, maxTokens, systemPrompt);
  }, [activeId, createConversation, model, temperature, maxTokens, systemPrompt]);

  const handleGenerateTitle = useCallback(
    async (convId: string, messages: Message[]) => {
      await generateTitle(convId, messages, model);
    },
    [generateTitle, model]
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <button
          aria-label="Fermer la barre latérale"
          onClick={() => setSidebarOverride(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar : drawer sur mobile, colonne sur desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 transition-transform duration-300 ease-out md:static md:z-auto md:transition-[margin] ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0 md:-ml-[280px]'
        }`}
      >
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          selectedModel={model}
          onModelChange={setModelChoice}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onNewConversation={handleNewConversation}
          onSwitchConversation={handleSwitchConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          isLoading={isLoading}
          mounted={mounted}
          online={online}
          models={models}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      <MainContent
        onToggleSidebar={() => setSidebarOverride(!sidebarOpen)}
        settings={{ model, temperature, maxTokens, systemPrompt }}
        conversation={active}
        models={models}
        onModelChange={setModelChoice}
        onDeleteConversation={deleteConversation}
        focusSignal={focusSignal}
        onEnsureConversation={handleEnsureConversation}
        onAddMessage={addMessage}
        onUpdateAssistant={updateLastAssistantMessage}
        onSaveConversation={saveConversation}
        onGenerateTitle={handleGenerateTitle}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        models={models}
        loadedModels={loadedModels}
        online={online}
        onRefresh={refresh}
        model={model}
        onModelChange={setModelChoice}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        accent={accent}
        accents={ACCENTS}
        onAccentChange={setAccent}
        sources={sources}
        onAddSource={addSource}
        onRemoveSource={removeSource}
        onUpdateKey={updateSourceKey}
        onUpdateName={updateSourceName}
      />
    </div>
  );
}
