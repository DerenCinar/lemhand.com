// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);
const auth = getAuth();
  
const app = Vue.createApp({
    data() {
        return {
            test: 'hello',
            name: '',
            currentpage: 'home',
            lheName: '',
            lheCode: 'Krabat', 
            lheCodeInput: '',
            lheErrorMessage: false,
            lheErrorName: false
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
            if (this.name === '') return true
            else return false
        }
    },
    mounted() {
        auth.onAuthStateChanged(this.onAuthEvent);
    },
    methods: {
        onAuthEvent(user) {
            console.log("onAuthEvent");
            if (user) {
                this.name = (user.displayName != null) ? user.displayName : user.email;
            } else {
                this.name = '';
            }
        },
        lheLogin() { 
            if (this.lheCodeInput === this.lheCode && this.lheName !== '') {
                this.currentpage = 'lhe'
            }
            else {
                if (this.lheCodeInput !== this.lheCode) this.lheErrorMessage = true
                if (this.lheName === '') this.lheErrorName = true
                }
        }
    },
});

app.mount('#app');

const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');
const navbg = document.querySelector('.nav-bg');
menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
    navbg.classList.toggle('active');
});



