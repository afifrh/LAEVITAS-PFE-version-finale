// Utilitaire de debug pour WebSocket
export const debugWebSocket = () => {
  console.log('🔍 Debug WebSocket - Vérification des tokens...');
  
  // Vérifier les tokens dans localStorage
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('📋 État des tokens:');
  console.log('- Access Token:', accessToken ? '✅ Présent' : '❌ Absent');
  console.log('- Refresh Token:', refreshToken ? '✅ Présent' : '❌ Absent');
  
  if (accessToken) {
    try {
      // Décoder le token JWT (sans vérification de signature)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      console.log('🔑 Détails du token:');
      console.log('- User ID:', payload.userId);
      console.log('- Email:', payload.email);
      console.log('- Expiration:', new Date(payload.exp * 1000).toLocaleString());
      console.log('- Statut:', isExpired ? '❌ Expiré' : '✅ Valide');
      
      if (!isExpired) {
        // Tester la connexion WebSocket
        testWebSocketConnection(accessToken);
      } else {
        console.log('⚠️ Le token est expiré, connexion WebSocket impossible');
      }
    } catch (error) {
      console.error('❌ Erreur lors du décodage du token:', error);
    }
  } else {
    console.log('⚠️ Aucun token trouvé, l\'utilisateur doit se connecter');
  }
};

const testWebSocketConnection = (token) => {
  console.log('🔌 Test de connexion WebSocket...');
  
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';
  const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
  
  console.log('📡 URL WebSocket:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ Connexion WebSocket réussie !');
    
    // Envoyer un ping de test
    ws.send(JSON.stringify({
      type: 'ping'
    }));
    
    // Fermer après 3 secondes
    setTimeout(() => {
      ws.close();
      console.log('🔌 Test terminé - connexion fermée');
    }, 3000);
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('📨 Message reçu:', message);
  };
  
  ws.onerror = (error) => {
    console.error('❌ Erreur WebSocket:', error);
  };
  
  ws.onclose = (event) => {
    console.log('🔌 Connexion fermée:', event.code, event.reason);
  };
};

// Fonction pour afficher l'état complet de l'authentification
export const debugAuthState = () => {
  console.log('🔍 Debug État d\'authentification...');
  
  // Vérifier localStorage
  const keys = ['accessToken', 'refreshToken', 'user'];
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`- ${key}:`, value ? '✅ Présent' : '❌ Absent');
  });
  
  // Vérifier les cookies si utilisés
  console.log('🍪 Cookies:', document.cookie || 'Aucun cookie');
  
  // Vérifier l'état du contexte d'authentification
  const authContext = window.__AUTH_CONTEXT__;
  if (authContext) {
    console.log('🎯 Contexte d\'authentification:', authContext);
  } else {
    console.log('⚠️ Contexte d\'authentification non disponible');
  }
};

// Fonction pour nettoyer l'état d'authentification
export const clearAuthState = () => {
  console.log('🧹 Nettoyage de l\'état d\'authentification...');
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  console.log('✅ État d\'authentification nettoyé');
};

// Exposer les fonctions globalement pour le debug
if (typeof window !== 'undefined') {
  window.debugWebSocket = debugWebSocket;
  window.debugAuthState = debugAuthState;
  window.clearAuthState = clearAuthState;
}