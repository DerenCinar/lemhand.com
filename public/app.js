const app = Vue.createApp({
    data() {
        return {
            test: 'hello',
            name: '',
            
        }
    },
    computed: {
        myname() {
            if (this.name === '') {
                return 'Log In' 
            }
            else return 'Hi, ' + this.name
        }
    }

});

app.mount('#app')

const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');
const navbg = document.querySelector('.nav-bg');
menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
    navbg.classList.toggle('active');
});
 