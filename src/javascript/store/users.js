import router from '../routes.js';

const APIKEY = "AIzaSyDAmjMQVyV8WuF4AsFOz4GZjcDdspjIX50";
const SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${APIKEY}`;
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${APIKEY}`;
const REFRESH_TOKEN = `https://securetoken.googleapis.com/v1/token?key=${APIKEY}`;
const GET_USER_DATA = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${APIKEY}`;

const users = {
    namespaced:true,
    state:{
        email:null,
        isAuth:false
    },
    getters:{
        isAuth(state){
            if(state.email) return true;
            return false;
        }
    },
    mutations:{
        authUser(state, payload){
            state.email = payload.email;
        },

        resetUser(state){
            state.email = null;
        }
    },
    actions:{
        removeToken(){
            localStorage.removeItem("token");
            localStorage.removeItem("refresh");
        },
        
        setToken(context, payload){
            localStorage.setItem("token", payload.idToken);
            localStorage.setItem("refresh", payload.refreshToken);
        },

        async autoLogin(context){
            try{
                //Getting refresh token from localstorage.
                const refreshToken = localStorage.getItem('refresh');
                console.log(refreshToken);

                //Checking if refresh token exists
                if(refreshToken){
                    //Getting a token using the refresh token.
                    const token = await fetch(REFRESH_TOKEN, {
                        method:'POST',
                        headers:{
                            'Content-Type':'application/json'
                        },
                        body:JSON.stringify({
                            grant_type:'refresh_token',
                            refresh_token:refreshToken
                        })
                    })
                    .then(response => response.json());
                    console.log(token);
    
                    //Using token to get use->password.
                    const user = await fetch(GET_USER_DATA, {
                        method:'POST',
                        headers:{
                            'Content-Type':'application/json'
                        },
                        body:JSON.stringify({
                            idToken:token.id_token
                        })
                    })
                    .then(response => response.json());
                    console.log(user);
                    
                    //Creating new details from refresh.
                    const newTokens = {
                        email:user.users[0].email,
                        token:token.id_token,
                        refreshToken:token.refresh_token
                    }
                    console.log(newTokens);
    
                    //Setting the new details.
                    context.commit('authUser', newTokens);
                    context.dispatch('setToken', newTokens);
    
                }
            }
            catch(error){
                console.log(error);
            }
        },

        async signinUser(context, payload){
            try{
                const response = fetch(SIGN_IN_URL, {
                    method:"POST",
                    headers:{
                        'Content-Type':'application/json'
                    },
                    body:JSON.stringify({
                        email:payload.username+'@northrise.net',
                        password:payload.passcode,
                        returnSecureToken:true
                    })
                })
                .then(response => response.json())

                //Waiting for response from fetch request.
                let data = await response;

                context.commit('authUser', data);
                context.dispatch('setToken', data);
                console.log(context.state.email);
                if(context.state.email !== undefined)
                    router.push('/home');
            }
            catch(error){
                console.log(error);
            }
        },

        signOut(context){
            alert("Signing Out...");
            context.commit('resetUser');
            context.dispatch('removeToken');
            console.log(context.state.email);
            router.push('/login');
        },

        signupUser(context, payload){
            alert(`Signing up user ${payload.username}@northrise.net: ${payload.passcode}`);
            fetch(SIGN_UP_URL, {
                method:"POST",
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({
                    email:payload.username+'@northrise.net',
                    password:payload.passcode,
                    returnSecureToken:true
                })
            })
            .then(response => console.log(response))
            .then(data => {
                context.commit('authUser', data)
                context.dispatch('setToken', data)
                console.log(context.state.email);
            })
            .catch(error => console.log(error));
        }
    }
}

export default users;