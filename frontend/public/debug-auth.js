// Script de débogage d'authentification à exécuter dans la console du navigateur
console.log('🔍 Debug Frontend Authentication State');
console.log('=====================================');

// Vérifier localStorage
console.log('\n📦 LocalStorage:');
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
const user = localStorage.getItem('user');

console.log('- accessToken:', accessToken ? 'Présent' : 'Absent');
console.log('- refreshToken:', refreshToken ? 'Présent' : 'Absent');
console.log('- user:', user ? 'Présent' : 'Absent');

if (accessToken) {
    console.log('\n🔑 Détails du token d\'accès:');
    try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('- Payload:', payload);
            console.log('- Expiration:', new Date(payload.exp * 1000));
            console.log('- Expiré:', Date.now() > payload.exp * 1000);
        }
    } catch (e) {
        console.log('- Erreur lors du décodage:', e.message);
    }
}

// Vérifier sessionStorage
console.log('\n📦 SessionStorage:');
const sessionKeys = Object.keys(sessionStorage);
console.log('- Clés:', sessionKeys);

// Vérifier les cookies
console.log('\n🍪 Cookies:');
console.log('- document.cookie:', document.cookie);

// Instructions pour corriger
console.log('\n🔧 Instructions pour corriger:');
console.log('1. Si aucun token n\'est présent, connectez-vous via /login');
console.log('2. Si le token est expiré, rafraîchissez la page ou reconnectez-vous');
console.log('3. Pour tester manuellement, utilisez:');
console.log('   localStorage.setItem("accessToken", "VOTRE_TOKEN_ICI");');

// Test de connexion WebSocket
console.log('\n🔌 Test de connexion WebSocket:');
if (accessToken && !accessToken.includes('undefined')) {
    const wsUrl = `ws://localhost:5000/ws?token=${accessToken}`;
    console.log('- URL WebSocket:', wsUrl);
    
    const testWs = new WebSocket(wsUrl);
    testWs.onopen = () => {
        console.log('✅ Connexion WebSocket réussie');
        testWs.close();
    };
    testWs.onerror = (error) => {
        console.log('❌ Erreur WebSocket:', error);
    };
    testWs.onclose = (event) => {
        console.log('🔌 Connexion fermée:', event.code, event.reason);
    };
} else {
    console.log('❌ Impossible de tester WebSocket: token absent ou invalide');
}