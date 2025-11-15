import { ref } from 'vue'

// Simple in-memory store for the current marketplace app
const currentMarketplaceApp = ref<any>(null)

export function useMarketplaceApp() {
  function setCurrentApp(app: any) {
    // Create a clean, serializable copy
    currentMarketplaceApp.value = {
      id: app.id,
      title: app.title,
      version: app.version,
      icon: app.icon,
      category: app.category,
      description: app.description,
      author: app.author,
      source: app.source,
      manifestUrl: app.manifestUrl || app.s9pkUrl || app.url,
      url: app.url || app.s9pkUrl || app.manifestUrl,
      repoUrl: app.repoUrl,
      s9pkUrl: app.s9pkUrl
    }
  }

  function getCurrentApp() {
    return currentMarketplaceApp.value
  }

  function clearCurrentApp() {
    currentMarketplaceApp.value = null
  }

  return {
    setCurrentApp,
    getCurrentApp,
    clearCurrentApp
  }
}

