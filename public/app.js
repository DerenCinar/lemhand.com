// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCWp6dqShdHCCtvLlJA03QMMqqb6LSePSU", // IMPORTANT: Consider securing your API key
    authDomain: "lemhand-6de2a.firebaseapp.com",
    databaseURL: "https://lemhand-6de2a-default-rtdb.firebaseio.com",
    projectId: "lemhand-6de2a",
    storageBucket: "lemhand-6de2a.appspot.com",
    messagingSenderId: "148302455321",
    appId: "1:148302455321:web:4f899d96f460842e868088",
    measurementId: "G-M96JLWHLSP"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth();
  
const app = Vue.createApp({
    data() {
        return {
            // Existing data
            readArticles: 0,
            test: 'hello',
            name: '', // For logged-in user's name or email
            currentpage: 'home', // Default page
            lheName: '', // Input for LHE login name
            lheCode: 'Krabat', // Predefined LHE access code
            lheCodeInput: '', // Input for LHE access code
            lheErrorMessage: false, // Flag for LHE code error
            lheErrorName: false, // Flag for LHE name error
            lheNameDisplay: '', // To display the name after LHE login
            osName: 'Unknown OS',
            drop: false,
            
            // Data for AI News functionality (moved from HTML)
            articles: [], // Will be populated by AI news; replaces static articles
            isLoadingNews: false,
            newsError: '',
            showArticleModal: false,
            selectedArticle: null,
        }
    },
    computed: {
        myname() {
            if (this.name === '') {
                return 'Log In' 
            }
            else return 'Hi, ' + this.name
        },
        accountStatus() {
            // Returns true if user is not logged in (name is empty), false otherwise
            return this.name === '';
        },
        availableArticlesCount() { // Corrected typo from availbleArticles
            // Calculates available articles based on total fetched and readArticles count
            const count = this.articles.length - this.readArticles;
            return count < 0 ? 0 : count; // Ensure it doesn't go below zero
        }
    },
    mounted() {
        this.detectOS();
        auth.onAuthStateChanged(this.onAuthEvent);

        if (localStorage.getItem("readArticles") === null) {
            localStorage.setItem("readArticles", "0"); // Store as string, parse when retrieving
        }
        this.readArticles = parseInt(localStorage.getItem("readArticles"), 10) || 0;

        console.log("Vue app mounted. LemHand page is ready.");
        // Optionally fetch news on load if the default page is 'news'
        // if (this.currentpage === 'news') {
        //    this.fetchRealNews();
        // }
    },
    watch: {
        readArticles(newValue, oldValue) {
            localStorage.setItem("readArticles", newValue.toString());
        }
    },
    methods: {
        // Existing methods
        detectOS() {
            const userAgent = window.navigator.userAgent;
            let os = 'Unknown OS';
      
            if (userAgent.indexOf('Win') !== -1) {
              os = 'Windows';
            } else if (userAgent.indexOf('Mac') !== -1) {
              os = 'MacOS';
            } else if (userAgent.indexOf('Linux') !== -1) {
              os = 'Linux';
            } else if (userAgent.indexOf('Android') !== -1) {
                os = 'Android';
            } else if (userAgent.indexOf('iOS') !== -1) { // Corrected from 'IOS' to 'iOS'
                os = 'iOS';
            }
            this.osName = os;
        },
        dropdown() {
            this.drop = !this.drop
        },
        resetCount() {
            // Increments the count of read articles.
            // This is now called when an article modal is opened.
            this.readArticles++;
        },
        onAuthEvent(user) {
            console.log("onAuthEvent triggered");
            if (user) {
                this.name = (user.displayName != null) ? user.displayName : user.email;
            } else {
                this.name = '';
            }
        },
        lheLogin() { 
            this.lheErrorName = this.lheName.trim() === '';
            this.lheErrorMessage = this.lheCodeInput !== this.lheCode;

            if (!this.lheErrorName && !this.lheErrorMessage) {
                this.lheNameDisplay = this.lheName; // Set display name for LHE portal
                this.currentpage = 'lhe';
            }
        },
        setCurrentPage(page) { // Method to change current page
            this.currentpage = page;
        },

        // Methods for AI News functionality (moved from HTML)
        async fetchRealNews() {
            this.isLoadingNews = true;
            this.newsError = '';
            // this.articles = []; // Clear previous articles if you want fresh list each time
                               // Or append, depending on desired behavior. Current code replaces.

            const prompt = "Fetch 5 recent and diverse technology news headlines from around the world. Focus on topics like software, hardware, AI, gadgets, and the tech industry. For each headline, provide the title, a brief snippet (summary that can act as a subtitle), the original source name, and the direct URL to the article. Also include an estimated publication time if available.";
            
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "title": { "type": "STRING" },
                                "snippet": { "type": "STRING" },
                                "source": { "type": "STRING" },
                                "url": { "type": "STRING" },
                                "publication_time": { "type": "STRING" }
                            },
                            required: ["title", "snippet", "source", "url"]
                        }
                    }
                }
            };
            const apiKey = "AIzaSyDnJhrLehPNgODff7gS5mQsnpO0mY414wc"; // API key will be injected by the environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API request failed: ${errorData?.error?.message || response.statusText}`);
                }
                const result = await response.json();
                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    const rawJson = result.candidates[0].content.parts[0].text;
                    const parsedArticles = JSON.parse(rawJson);
                    // Filter for valid URLs and assign to articles
                    this.articles = parsedArticles.filter(article => article.url && article.url.startsWith('http'));
                    if (this.articles.length === 0 && parsedArticles.length > 0) {
                        throw new Error("AI provided data, but no valid article URLs were found.");
                    }
                } else {
                    throw new Error("Unexpected AI response structure for tech news.");
                }
            } catch (error) {
                console.error("Error fetching tech news:", error);
                this.newsError = error.message || "An unknown error occurred while fetching news.";
            } finally {
                this.isLoadingNews = false;
            }
        },
        openArticleModal(article) {
            this.selectedArticle = { 
                title: article.title || "No Title",
                snippet: article.snippet || "No snippet available.", 
                source: article.source || "Unknown Source",
                url: article.url || "#",
                published: article.publication_time || "N/A"
            };
            this.showArticleModal = true;
            // Call resetCount here if opening modal means "reading" an article
            // This depends on how `readArticles` is intended to work with `availableArticlesCount`
            // If an article is "read" upon opening its details:
            // this.resetCount(); 
            // For now, let's assume original `resetCount` on button was for this.
            // The button now calls this method, so it's a good place to call it.
             if (this.articles.find(a => a.url === article.url && !a.isRead)) {
                this.resetCount(); // Increment read articles count
                const foundArticle = this.articles.find(a => a.url === article.url);
                if (foundArticle) foundArticle.isRead = true; // Mark as read to avoid double counting if modal is reopened
            }
        },
        closeArticleModal() {
            this.showArticleModal = false;
            this.selectedArticle = null;
        },
    },
});

app.mount('#app');

// Existing non-Vue JavaScript for menu toggle
const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');
const navbg = document.querySelector('.nav-bg');

if (menuIcon && navbar && navbg) { // Add null checks before adding event listeners
    menuIcon.addEventListener('click', () => {
        menuIcon.classList.toggle('bx-x');
        navbar.classList.toggle('active');
        navbg.classList.toggle('active');
    });
} else {
    console.warn("Menu icon, navbar, or nav-bg element not found. Mobile menu might not work.");
}
