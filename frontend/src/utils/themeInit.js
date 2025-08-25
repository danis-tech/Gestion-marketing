// Initialisation du thème au chargement de l'application
export const initializeTheme = () => {
  // Récupérer le thème sauvegardé ou utiliser le thème sombre par défaut
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // Appliquer le thème au document
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Ajouter une classe pour éviter le flash de contenu non stylé
  document.documentElement.classList.add('theme-loaded');
  
  return savedTheme;
};

// Fonction pour détecter la préférence système
export const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Fonction pour écouter les changements de préférence système
export const watchSystemTheme = (callback) => {
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(callback);
    return () => mediaQuery.removeListener(callback);
  }
  return () => {};
};
