// Configuration loader for Sunder
// In production with Vite, these would come from import.meta.env
// For vanilla JS without bundler, we'll use a config object

export const config = {
  firebase: {
    apiKey: "AIzaSyCkeR9g7lxx7x6Q8zb09nxbY7JEAQox_RY",
    authDomain: "sundermediaa.firebaseapp.com",
    projectId: "sundermediaa",
    storageBucket: "sundermediaa.firebasestorage.app",
    messagingSenderId: "160673212117",
    appId: "1:160673212117:web:21452d1132218737ffe45c",
    measurementId: "G-8W99VS45R1"
  },
  supabase: {
    // YOU MUST REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
    url: "YOUR_SUPABASE_URL_HERE",
    anonKey: "YOUR_SUPABASE_ANON_KEY_HERE"
  }
};
