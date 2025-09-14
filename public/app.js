// Import the functions you need from the SDKs you need
import { getFirestore, collection, addDoc, onSnapshot, setLogLevel } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
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
            accountStatus: false,
            availableArticlesCount: 5,
            lheName: '', // Input for LHE login name
            lheCode: 'Krabat', // Predefined LHE access code
            lheCodeInput: '', // Input for LHE access code
            lheErrorMessage: false, // Flag for LHE code error
            lheErrorName: false, // Flag for LHE name error
            lheNameDisplay: '', // To display the name after LHE login
            osName: 'Unknown OS',
            drop: false,

             // NEW Blog system data
                    blogs: [],
                    blogView: 'list', // 'list', 'create', 'single'
                    selectedBlog: null,
                    newBlog: {
                        title: '',
                        description: '',
                        bannerImage: '',
                        icon: '',
                        mainText: ''
                    },
                    isLoadingBlogs: false,
                    isSavingBlog: false,
                    blogError: '',
                    db: null,
                    auth: null,
                    userId: null,
                    unsubscribeBlogs: null, // To hold the onSnapshot listener
            
            
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

        // NEW Blog methods
                async initFirebase() {
                    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                    // Fallback to empty object if firebase config is not available
                    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
                    
                    // Basic check for valid config
                    if (!firebaseConfig.apiKey) {
                        this.blogError = "Firebase configuration is missing. Blog cannot be loaded.";
                        console.error("Firebase configuration is missing.");
                        return;
                    }

                    try {
                        const app = initializeApp(firebaseConfig);
                        this.db = getFirestore(app);
                        this.auth = getAuth(app);
                        setLogLevel('Debug');

                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(this.auth, __initial_auth_token);
                        } else {
                            await signInAnonymously(this.auth);
                        }
                    } catch (error) {
                        console.error("Firebase Initialization Error:", error);
                        this.blogError = "Could not connect to the database.";
                        return;
                    }

                    onAuthStateChanged(this.auth, (user) => {
                        if (user) {
                            this.userId = user.uid;
                            this.listenForBlogs(); // Start listening for blogs after user is authenticated
                        } else {
                            this.userId = null;
                            if (this.unsubscribeBlogs) this.unsubscribeBlogs(); // Stop listening if user logs out
                            this.blogs = [];
                        }
                    });
                },

                listenForBlogs() {
                    if (this.unsubscribeBlogs) this.unsubscribeBlogs(); // Unsubscribe from any previous listener
                    if (!this.db) return;
                    
                    this.isLoadingBlogs = true;
                    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                    const blogsCollection = collection(this.db, `/artifacts/${appId}/public/data/blogs`);

                    this.unsubscribeBlogs = onSnapshot(blogsCollection, (querySnapshot) => {
                        const blogs = [];
                        querySnapshot.forEach((doc) => {
                            blogs.push({ id: doc.id, ...doc.data() });
                        });
                        this.blogs = blogs;
                        this.isLoadingBlogs = false;
                    }, (error) => {
                        console.error("Error fetching blogs:", error);
                        this.blogError = "Failed to load blog posts.";
                        this.isLoadingBlogs = false;
                    });
                },

                async saveBlog() {
                    if (!this.newBlog.title || !this.newBlog.mainText) {
                        this.blogError = "Title and Main Content are required.";
                        setTimeout(() => this.blogError = '', 3000);
                        return;
                    }
                    this.isSavingBlog = true;
                    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                    const blogsCollection = collection(this.db, `/artifacts/${appId}/public/data/blogs`);

                    try {
                        await addDoc(blogsCollection, {
                            ...this.newBlog,
                            createdAt: new Date().toISOString() // Add a timestamp
                        });
                        this.cancelCreate();
                    } catch (error) {
                        console.error("Error saving blog:", error);
                        this.blogError = "Failed to save the blog post.";
                    } finally {
                        this.isSavingBlog = false;
                    }
                },

                selectBlog(blog) {
                    this.selectedBlog = blog;
                    this.blogView = 'single';
                },

                cancelCreate() {
                    this.newBlog = { title: '', description: '', bannerImage: '', icon: '', mainText: '' };
                    this.blogView = 'list';
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
