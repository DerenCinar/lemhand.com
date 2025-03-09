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
            mkey: 0,
            test: 'hello',
            name: '',
            currentpage: 'home',
            lheName: '',
            lheCode: 'Krabat', 
            lheCodeInput: '',
            lheErrorMessage: false,
            lheErrorName: false,
            articles: [
                {title: 'What is Quizzy? ', subtitle: 'In this article you will learn everything about Quizzy and how to use it', content: 'i am text'},
                {title: 'LemHand plans to shutdown its old UI on May 4', subtitle: 'The company LemHand Co. LTD has approved that its shutting down its old website on May 4', content: 'i am text'},
                {title: 'LemHand plans to shutdown its old UI on May 4', subtitle: 'The company LemHand Co. LTD has approved that its shutting down its old website on May 4', content: 'i am text'},
                {title: 'LemHand plans to shutdown its old UI on May 4', subtitle: 'The company LemHand Co. LTD has approved that its shutting down its old website on May 4', content: 'i am text'},
                {title: 'LemHand plans to shutdown its old UI on May 4', subtitle: 'The company LemHand Co. LTD has approved that its shutting down its old website on May 4', content: 'i am text'},

            ]
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
        },
        availbleArticles() {
            if (localStorage.getItem("myKey") === null) {
                localStorage.setItem("readArticles", 0) 
                localStorage.setItem("myKey", this.articles.length)
            } if (localStorage.getItem("myKey") < this.articles.length) {
                return this.articles.length - localStorage.getItem("myKey") 
            } 
            
            else return localStorage.getItem("myKey")
        }
    },
    mounted() {
        auth.onAuthStateChanged(this.onAuthEvent);
    },
    methods: {
        resetCount() {
            this.mkey = +localStorage.getItem("myKey") + 1
            localStorage.setItem("myKey", this.mkey)
            
        },
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



