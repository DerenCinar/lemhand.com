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