// Script pour injecter un token d'authentification valide dans localStorage
console.log('🔧 Injection d\'authentification');
console.log('================================');

// Token valide obtenu via l'API de connexion
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRmZGI1Mjc4NjQ1MmQ0MWQzNmY0OGEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY2xpZW50IiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlhdCI6MTc1OTUwMTE1MSwiZXhwIjoxNzYwMTA1OTUxLCJhdWQiOiJsYWV2aXRhcy11c2VycyIsImlzcyI6ImxhZXZpdGFzLXRyYWRpbmcifQ.fFfHMY9z_6GpmQnM3x4IKNwFuxY-Ptpv6yMMWYDov1I';

// Données utilisateur correspondantes
const userData = {
    id: '68dfdb52786452d41d36f48a',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'client'
};

// Injecter dans localStorage
localStorage.setItem('accessToken', validToken);
localStorage.setItem('user', JSON.stringify(userData));

console.log('✅ Token d\'accès injecté');
console.log('✅ Données utilisateur injectées');

// Vérifier l'injection
console.log('\n📦 Vérification:');
console.log('- accessToken:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
console.log('- user:', localStorage.getItem('user') ? 'Présent' : 'Absent');

// Décoder le token pour vérifier
try {
    const tokenParts = validToken.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    console.log('- Expiration:', new Date(payload.exp * 1000));
    console.log('- Valide jusqu\'à:', new Date(payload.exp * 1000).toLocaleString());
    console.log('- Expiré:', Date.now() > payload.exp * 1000);
} catch (e) {
    console.log('- Erreur lors du décodage:', e.message);
}

console.log('\n🔄 Rechargez la page pour que les changements prennent effet');
console.log('🔌 Les connexions WebSocket devraient maintenant fonctionner');