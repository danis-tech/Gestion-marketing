import React, { useContext, useEffect, useRef, useState } from 'react';
import Message from './Message';
import { ChatbotContext } from './context.jsx';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import soundManager from '../../utils/robustSoundUtils';
import './MessageList.css';

const MessageList = () => {
  const { messages, sendMessage } = useContext(ChatbotContext);
  const messagesEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 50 questions que le chatbot peut répondre parfaitement
  const questions = [
    // Statistiques et aperçu général
    { category: "📊 Statistiques", question: "Combien de projets ai-je au total ?" },
    { category: "📊 Statistiques", question: "Quelles sont les statistiques générales de ma plateforme ?" },
    { category: "📊 Statistiques", question: "Combien d'utilisateurs sont actifs ?" },
    { category: "📊 Statistiques", question: "Quel est le nombre total de tâches ?" },
    { category: "📊 Statistiques", question: "Combien de projets sont terminés ?" },
    
    // Projets
    { category: "📋 Projets", question: "Liste mes projets récents" },
    { category: "📋 Projets", question: "Quels sont mes projets actifs ?" },
    { category: "📋 Projets", question: "Montre-moi les projets en attente" },
    { category: "📋 Projets", question: "Quels projets sont terminés récemment ?" },
    { category: "📋 Projets", question: "Quels projets sont terminés ?" },
    { category: "📋 Projets", question: "Quels projets sont hors délai ?" },
    { category: "📋 Projets", question: "Quels projets sont rejetés ?" },
    { category: "📋 Projets", question: "Donne-moi la liste de tous mes projets" },
    
    // Projets urgents et prioritaires
    { category: "🚨 Urgences", question: "Quels sont les projets les plus urgents ?" },
    { category: "🚨 Urgences", question: "Montre-moi les projets prioritaires" },
    { category: "🚨 Urgences", question: "Quels projets ont une priorité élevée ?" },
    { category: "🚨 Urgences", question: "Liste les projets critiques" },
    { category: "🚨 Urgences", question: "Quels projets sont en retard ?" },
    
    // Utilisateurs et équipes
    { category: "👥 Équipes", question: "Liste tous les utilisateurs" },
    { category: "👥 Équipes", question: "Combien d'utilisateurs ai-je ?" },
    { category: "👥 Équipes", question: "Qui sont les administrateurs ?" },
    { category: "👥 Équipes", question: "Statistiques de mon équipe" },
    { category: "👥 Équipes", question: "Quels utilisateurs sont actifs ?" },
    { category: "👥 Équipes", question: "Donne-moi la liste des utilisateurs avec leurs tâches respectives" },
    { category: "👥 Équipes", question: "Qui a quelles tâches assignées ?" },
    { category: "👥 Équipes", question: "Liste les équipes avec leurs tâches" },
    { category: "👥 Équipes", question: "Quelles sont les tâches de chaque membre d'équipe ?" },
    { category: "👥 Équipes", question: "Répartition des tâches par équipe" },
    
        // Tâches
        { category: "📝 Tâches", question: "Combien de tâches sont en cours ?" },
        { category: "📝 Tâches", question: "Quelles tâches sont terminées ?" },
        { category: "📝 Tâches", question: "Liste les tâches en attente" },
        { category: "📝 Tâches", question: "Quelles tâches sont en cours ?" },
        { category: "📝 Tâches", question: "Quelles tâches sont hors délai ?" },
        { category: "📝 Tâches", question: "Quelles tâches sont rejetées ?" },
        { category: "📝 Tâches", question: "Quelles tâches ont une priorité haute ?" },
        { category: "📝 Tâches", question: "Quelles tâches ont une priorité moyenne ?" },
        { category: "📝 Tâches", question: "Quelles tâches ont une priorité basse ?" },
        { category: "📝 Tâches", question: "Statistiques des tâches" },
    
    // Analyse des risques
    { category: "⚠️ Risques", question: "Quels sont les risques actuels ?" },
    { category: "⚠️ Risques", question: "Analyse générale des risques" },
    { category: "⚠️ Risques", question: "Quels projets sont exposés aux retards ?" },
    { category: "⚠️ Risques", question: "Y a-t-il des risques de surcharge ?" },
    { category: "⚠️ Risques", question: "Quels sont les risques budgétaires ?" },
    
    // Risques spécifiques
    { category: "⚠️ Risques", question: "Analyse des risques de retard" },
    { category: "⚠️ Risques", question: "Quels sont les risques d'équipe ?" },
    { category: "⚠️ Risques", question: "Risques de dépendances critiques" },
    { category: "⚠️ Risques", question: "Projets les plus exposés aux risques" },
    { category: "⚠️ Risques", question: "Quels projets ont des problèmes de budget ?" },
    
    // Plus de questions sur les risques
    { category: "⚠️ Risques", question: "Y a-t-il un risque si un utilisateur quitte l'équipe ?" },
    { category: "⚠️ Risques", question: "Est-ce que l'étape de développement est critique ?" },
    { category: "⚠️ Risques", question: "Quels sont les projets dépendant d'une API externe ?" },
    { category: "⚠️ Risques", question: "Analyse des risques de ressources" },
    { category: "⚠️ Risques", question: "Quels projets sont les plus exposés aux retards ?" },
    
    // Questions spécifiques par projet
    { category: "🎯 Projet Spécifique", question: "Quels sont les risques du projet marketing ?" },
    { category: "🎯 Projet Spécifique", question: "Analyse les risques du projet site web" },
    { category: "🎯 Projet Spécifique", question: "Statut du projet campagne" },
    { category: "🎯 Projet Spécifique", question: "Avancement du projet mobile" },
    { category: "🎯 Projet Spécifique", question: "Détails du projet e-commerce" },
    
    // Aide et conseils
    { category: "💡 Aide", question: "Comment puis-je t'utiliser ?" },
    { category: "💡 Aide", question: "Que peux-tu faire pour moi ?" },
    { category: "💡 Aide", question: "Donne-moi des conseils de gestion" },
    { category: "💡 Aide", question: "Comment optimiser mes projets ?" },
    { category: "💡 Aide", question: "Aide-moi avec la gestion de projet" },
    
    // Questions de quantité et comptage
    { category: "🔢 Quantités", question: "Combien de projets sont en cours ?" },
    { category: "🔢 Quantités", question: "Combien de tâches sont en attente ?" },
    { category: "🔢 Quantités", question: "Nombre total d'utilisateurs" },
    { category: "🔢 Quantités", question: "Combien de projets sont prioritaires ?" },
    { category: "🔢 Quantités", question: "Quel est le nombre de projets urgents ?" },
    
    // Budgets et finances
    { category: "💰 Budgets", question: "Quels sont les budgets des projets ?" },
    { category: "💰 Budgets", question: "Liste les budgets de tous les projets" },
    { category: "💰 Budgets", question: "Quel est le budget total de mes projets ?" },
    { category: "💰 Budgets", question: "Quels projets ont les budgets les plus élevés ?" },
    { category: "💰 Budgets", question: "Quels projets ont les budgets les plus bas ?" },
    { category: "💰 Budgets", question: "Quel est le budget moyen des projets ?" },
    { category: "💰 Budgets", question: "Combien de projets ont un budget défini ?" },
    
    // Planning et dates
    { category: "📅 Planning", question: "Quelles sont les dates de début des projets ?" },
    { category: "📅 Planning", question: "Quelles sont les dates de fin des projets ?" },
    { category: "📅 Planning", question: "Quels projets sont en retard ?" },
    { category: "📅 Planning", question: "Quelle est la durée des projets ?" },
    { category: "📅 Planning", question: "Quels projets commencent bientôt ?" },
    { category: "📅 Planning", question: "Quels projets se terminent bientôt ?" },
    
    // Types et catégories
    { category: "📂 Types", question: "Quels sont les types de projets ?" },
    { category: "📂 Types", question: "Combien de projets par type ?" },
    { category: "📂 Types", question: "Liste les types de projets disponibles" },
    { category: "📂 Types", question: "Quel est le type de projet le plus courant ?" },
    
    // Objectifs et descriptions
    { category: "🎯 Objectifs", question: "Quels sont les objectifs des projets ?" },
    { category: "🎯 Objectifs", question: "Liste les objectifs de tous les projets" },
    { category: "📝 Descriptions", question: "Quelles sont les descriptions des projets ?" },
    { category: "📝 Descriptions", question: "Liste les descriptions de tous les projets" }
  ];

  // Grouper les questions par catégorie
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {});

  // Filtrer les questions selon le terme de recherche
  const filteredQuestionsByCategory = Object.keys(questionsByCategory).reduce((acc, category) => {
    const filteredQuestions = questionsByCategory[category].filter(question =>
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredQuestions.length > 0) {
      acc[category] = filteredQuestions;
    }
    return acc;
  }, {});

  const toggleCategory = (category) => {
    // Jouer un son de clic
    soundManager.playNotificationSound();
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleQuestionClick = (question) => {
    // Jouer un son de clic
    soundManager.playNotificationSound();
    sendMessage(question);
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 p-6">
        <div className="text-center max-w-lg">
          {/* Logo animé */}
          <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-bold">M</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse opacity-75"></div>
          </div>
          
          <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Marketges IA</h3>
          <p className="text-base mb-8 text-gray-500">Assistant intelligent pour la gestion de projets marketing</p>
          
          <p className="text-sm text-gray-400 mb-6 font-medium">💬 {questions.length} questions que je peux répondre parfaitement :</p>
          
          {/* Barre de recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent search-input"
            />
              </div>
              
          {/* Liste des questions organisées par catégories */}
          <div className="max-h-[500px] overflow-y-auto questions-scroll bg-white border border-gray-100 shadow-sm">
            {Object.keys(filteredQuestionsByCategory).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>Aucune question trouvée pour "{searchTerm}"</p>
              <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                  Effacer la recherche
              </button>
            </div>
            ) : (
              Object.entries(filteredQuestionsByCategory).map(([category, categoryQuestions]) => (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  {/* En-tête de catégorie */}
          <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors category-header"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-gray-700">{category}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        {categoryQuestions.length}
                      </span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
          </button>
          
                  {/* Questions de la catégorie */}
                  {expandedCategories[category] && (
                    <div className="bg-gray-50 category-questions">
                      {categoryQuestions.map((question, index) => (
                  <button
                    key={index}
                          onClick={() => handleQuestionClick(question.question)}
                          className="w-full p-4 text-left hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500 question-item"
                  >
                          <div className="text-base font-medium text-gray-800 leading-relaxed">
                            {question.question}
                          </div>
                  </button>
                ))}
            </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Bouton pour développer/réduire toutes les catégories */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                soundManager.playNotificationSound();
                const allExpanded = Object.keys(filteredQuestionsByCategory).reduce((acc, cat) => {
                  acc[cat] = true;
                  return acc;
                }, {});
                setExpandedCategories(allExpanded);
              }}
              className="flex-1 px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 action-button"
            >
              📖 Tout développer
            </button>
            <button
              onClick={() => {
                soundManager.playNotificationSound();
                setExpandedCategories({});
              }}
              className="flex-1 px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 action-button"
            >
              📕 Tout réduire
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((msg) => (
        <Message 
          key={msg.id} 
          sender={msg.sender} 
          text={msg.text}
          isLoading={msg.isLoading}
          isError={msg.isError}
          timestamp={msg.timestamp}
        />
      ))}
      
      {/* Afficher les questions prédéfinies après les messages */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 questions-suggestions">
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">💡 Autres questions que vous pourriez poser :</h4>
          <p className="text-sm text-gray-500">Cliquez sur une question pour la poser directement</p>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent search-input"
          />
        </div>
        
        {/* Liste des questions organisées par catégories */}
        <div className="max-h-[400px] overflow-y-auto questions-scroll bg-white border border-gray-100">
          {Object.keys(filteredQuestionsByCategory).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-xs">Aucune question trouvée pour "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-1 text-blue-600 hover:text-blue-700 text-xs"
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            Object.entries(filteredQuestionsByCategory).map(([category, categoryQuestions]) => (
              <div key={category} className="border-b border-gray-100 last:border-b-0">
                {/* En-tête de catégorie */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors category-header"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">{category}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1">
                        {categoryQuestions.length}
                      </span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp className="text-gray-400" size={16} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={16} />
                    )}
                  </button>
                
                {/* Questions de la catégorie */}
                {expandedCategories[category] && (
                  <div className="bg-gray-50 category-questions">
                    {categoryQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuestionClick(question.question)}
                          className="w-full p-3 text-left hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500 question-item compact-question-item"
                        >
                        <div className="text-sm font-medium text-gray-800 leading-relaxed">
                          {question.question}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Boutons d'action compacts */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              soundManager.playNotificationSound();
              const allExpanded = Object.keys(filteredQuestionsByCategory).reduce((acc, cat) => {
                acc[cat] = true;
                return acc;
              }, {});
              setExpandedCategories(allExpanded);
            }}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 action-button"
          >
            📖 Tout développer
          </button>
          <button
            onClick={() => {
              soundManager.playNotificationSound();
              setExpandedCategories({});
            }}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 action-button"
          >
            📕 Tout réduire
          </button>
        </div>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
