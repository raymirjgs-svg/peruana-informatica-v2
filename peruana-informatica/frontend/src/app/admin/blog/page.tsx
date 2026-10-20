"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { useBlogAdmin } from "./useBlogAdmin";
import { BlogStatsGrid } from "./components/BlogStatsGrid";
import { BlogAiPanel } from "./components/BlogAiPanel";
import { BlogAiNotConfigured } from "./components/BlogAiNotConfigured";
import { BlogPostList } from "./components/BlogPostList";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { TitleSuggestionsModal } from "./components/TitleSuggestionsModal";
import { PostModal } from "./components/PostModal";

export default function BlogAdminPage() {
  const {
    posts,
    titleSuggestions,
    stats,
    loading,
    error,
    setError,
    selectedPost,
    isModalOpen,
    setIsModalOpen,
    modalType,
    setModalType,
    generatingTitles,
    generatingContent,
    loadingDemo,
    savingPost,
    formData,
    setFormData,
    apiKey,
    setApiKey,
    savingApiKey,
    generateTitles,
    generateContentFromTitle,
    manageTitleSuggestion,
    updatePostStatus,
    deletePost,
    loadDemoData,
    saveApiKey,
    savePost,
    resetForm,
    openNewPostModal,
    openEditPostModal,
  } = useBlogAdmin();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión del Blog</h1>
          <p className="text-gray-500 mt-1">
            Administra contenido con IA integrada
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {stats && <BlogStatsGrid stats={stats} />}

        {stats?.ai_configured && (
          <BlogAiPanel
            generatingTitles={generatingTitles}
            onGenerateTitles={generateTitles}
            suggestionCount={titleSuggestions.length}
            onOpenSuggestions={() => {
              setModalType("suggestions");
              setIsModalOpen(true);
            }}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            savingApiKey={savingApiKey}
            onSaveApiKey={saveApiKey}
          />
        )}

        {!stats?.ai_configured && (
          <BlogAiNotConfigured
            onConfigure={() => {
              setModalType("apikey");
              setIsModalOpen(true);
            }}
          />
        )}

        <BlogPostList
          posts={posts}
          loadingDemo={loadingDemo}
          onLoadDemo={loadDemoData}
          onNew={openNewPostModal}
          onEdit={openEditPostModal}
          onUpdateStatus={updatePostStatus}
          onDelete={deletePost}
        />

        {isModalOpen && modalType === "apikey" && (
          <ApiKeyModal
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            savingApiKey={savingApiKey}
            onSave={saveApiKey}
            onClose={() => {
              setIsModalOpen(false);
              setApiKey("");
            }}
          />
        )}

        {isModalOpen && modalType === "suggestions" && (
          <TitleSuggestionsModal
            suggestions={titleSuggestions}
            generatingContent={generatingContent}
            onGenerateContent={generateContentFromTitle}
            onManage={manageTitleSuggestion}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        {isModalOpen && modalType === "post" && (
          <PostModal
            selectedPost={selectedPost}
            formData={formData}
            onFormChange={setFormData}
            savingPost={savingPost}
            onSave={savePost}
            onClose={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
