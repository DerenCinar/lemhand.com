// Import the functions you need from the SDKs you need
import { getFirestore, collection, addDoc, onSnapshot, setLogLevel, query, orderBy } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWp6dqShdHCCtvLlJA03QMMqqb6LSePSU",
    authDomain: "lemhand-6de2a.firebaseapp.com",
    databaseURL: "https://lemhand-6de2a-default-rtdb.firebaseio.com",
    projectId: "lemhand-6de2a",
    storageBucket: "lemhand-6de2a.appspot.com",
    messagingSenderId: "148302455321",
    appId: "1:148302455321:web:4f899d96f460842e868088",
    measurementId: "G-M96JLWHLSP"
};

// Initialize Firebase Globally
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
// setLogLevel('debug'); // Optional: for debugging

const app = Vue.createApp({
    data() {
        return {
            // UI State
            currentpage: 'home',
            mobileMenuOpen: false,
            loginModalOpen: false,

            // Auth Form State
            authMode: 'login', // 'login' or 'signup'
            authEmail: '',
            authPassword: '',
            authError: '',
            authLoading: false,
            
            // User State
            name: '',
            userId: null,
            
            // Legacy/Other State
            readArticles: 0,
            lheName: '',
            lheCode: 'Krabat',
            lheCodeInput: '',
            lheErrorMessage: false,
            lheErrorName: false,
            lheNameDisplay: '',
            
            // Blog System Data
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
            unsubscribeBlogs: null,
        }
    },
    computed: {
        myname() {
            if (!this.name) return 'Log In';
            return 'Hi, ' + this.name;
        },
        isLoggedIn() {
            return this.userId !== null;
        }
    },
    mounted() {
        // Auth Listener
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.name = (user.displayName != null) ? user.displayName : user.email;
                this.userId = user.uid;
                this.listenForBlogs();
            } else {
                this.name = '';
                this.userId = null;
                if (this.unsubscribeBlogs) this.unsubscribeBlogs();
                this.blogs = [];
                // Optional: Allow viewing blogs even if not logged in? 
                // For now, let's load them for everyone.
                this.listenForBlogs(); 
            }
        });

        // Legacy LocalStorage
        if (localStorage.getItem("readArticles") === null) {
            localStorage.setItem("readArticles", "0");
        }
        this.readArticles = parseInt(localStorage.getItem("readArticles"), 10) || 0;
    },
    methods: {
        // Auth Methods
        openLoginModal() {
            this.loginModalOpen = true;
            this.authError = '';
            this.authEmail = '';
            this.authPassword = '';
        },
        closeLoginModal() {
            this.loginModalOpen = false;
        },
        toggleAuthMode() {
            this.authMode = this.authMode === 'login' ? 'signup' : 'login';
            this.authError = '';
        },
        async handleAuth() {
            if (!this.authEmail || !this.authPassword) {
                this.authError = "Please enter both email and password.";
                return;
            }
            this.authLoading = true;
            this.authError = '';

            try {
                if (this.authMode === 'login') {
                    await signInWithEmailAndPassword(auth, this.authEmail, this.authPassword);
                } else {
                    await createUserWithEmailAndPassword(auth, this.authEmail, this.authPassword);
                }
                // Success
                this.closeLoginModal();
                this.authEmail = '';
                this.authPassword = '';
            } catch (error) {
                console.error("Auth error:", error);
                this.authError = error.message;
                // Simplify error messages
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    this.authError = "Invalid email or password.";
                } else if (error.code === 'auth/email-already-in-use') {
                    this.authError = "Email is already in use.";
                } else if (error.code === 'auth/weak-password') {
                    this.authError = "Password should be at least 6 characters.";
                }
            } finally {
                this.authLoading = false;
            }
        },
        async logout() {
            try {
                await signOut(auth);
                // Auth listener will handle state reset
            } catch (error) {
                console.error("Logout error:", error);
            }
        },
        async loginWithGoogle() {
            this.authLoading = true;
            this.authError = '';
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                this.closeLoginModal();
            } catch (error) {
                console.error("Google Auth error:", error);
                this.authError = error.message;
            } finally {
                this.authLoading = false;
            }
        },

        // Blog Methods
        listenForBlogs() {
            if (this.unsubscribeBlogs) this.unsubscribeBlogs();
            
            this.isLoadingBlogs = true;
            // Use a standard 'blogs' collection
            const blogsCollection = collection(db, 'blogs');
            const q = query(blogsCollection, orderBy('createdAt', 'desc'));

            this.unsubscribeBlogs = onSnapshot(q, (querySnapshot) => {
                const blogs = [];
                querySnapshot.forEach((doc) => {
                    blogs.push({ id: doc.id, ...doc.data() });
                });
                this.blogs = blogs;
                this.isLoadingBlogs = false;
            }, (error) => {
                console.error("Error fetching blogs:", error);
                // If it fails (e.g. permission denied or index missing), try without ordering
                if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
                     // Fallback for missing index or rules
                     // this.listenForBlogsSimple(); 
                }
                this.blogError = "Failed to load blog posts.";
                this.isLoadingBlogs = false;
            });
        },

        async saveBlog() {
            if (!this.userId) {
                this.blogError = "You must be logged in to post.";
                return;
            }
            // Check for LemHand Employee Email
            const userEmail = auth.currentUser.email;
            if (!userEmail || !userEmail.endsWith('@lemhand.com')) {
                this.blogError = "Only LemHand employees can post blogs.";
                return;
            }

            if (!this.newBlog.title || !this.newBlog.mainText) {
                this.blogError = "Title and Main Content are required.";
                setTimeout(() => this.blogError = '', 3000);
                return;
            }
            this.isSavingBlog = true;
            const blogsCollection = collection(db, 'blogs');

            try {
                await addDoc(blogsCollection, {
                    ...this.newBlog,
                    createdAt: new Date().toISOString(),
                    authorId: this.userId,
                    authorName: this.name
                });
                this.cancelCreate();
            } catch (error) {
                console.error("Error saving blog:", error);
                this.blogError = "Failed to save the blog post: " + error.message;
            } finally {
                this.isSavingBlog = false;
            }
        },

        selectBlog(blog) {
            this.selectedBlog = blog;
            this.blogView = 'single';
            window.scrollTo(0, 0);
        },

        cancelCreate() {
            this.newBlog = { title: '', description: '', bannerImage: '', icon: '', mainText: '' };
            this.blogView = 'list';
            this.blogError = '';
        },
        
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
        },

        // Legacy Employee Login
        lheLogin() { 
            this.lheErrorName = this.lheName.trim() === '';
            this.lheErrorMessage = this.lheCodeInput !== this.lheCode;

            if (!this.lheErrorName && !this.lheErrorMessage) {
                this.lheNameDisplay = this.lheName;
                this.currentpage = 'lhe'; // Note: 'lhe' page needs to exist in template if accessed
                alert("Employee Login Successful (Demo)");
            }
        }
    },
});

app.mount('#app');