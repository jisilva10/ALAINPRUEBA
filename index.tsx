// --- Firebase Login Logic for index.html ---
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


/**
 * Initializes the entire application logic after the DOM is ready.
 * This prevents race conditions where scripts might execute before the page is fully loaded.
 */
function initializeAppLogic() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCCD9C2MPvPD2UbZ8IVVL6Mx5kg69BFjJQ",
        authDomain: "alain-profektus.firebaseapp.com",
        projectId: "alain-profektus",
        storageBucket: "alain-profektus.firebasestorage.app",
        messagingSenderId: "358275243622",
        appId: "1:358275243622:web:c92d447f7c28cffdd3d7a7",
        measurementId: "G-TCV8CNY4V2"
    };

    // Initialize Firebase
    let app;
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Enable offline persistence to handle network hiccups gracefully
    enableIndexedDbPersistence(db)
      .catch((err) => {
          if (err.code == 'failed-precondition') {
              // This can happen if multiple tabs are open.
              console.warn("Firestore persistence failed: multiple tabs open. App will still work online.");
          } else if (err.code == 'unimplemented') {
              // The current browser does not support all of the features required to enable persistence.
              console.warn("Firestore persistence is not supported in this browser.");
          }
      });


    /**
     * Handles the login process when the form is submitted.
     * @param {Event} event - The form submission event.
     */
    function handleLogin(event: Event) {
        event.preventDefault(); // Prevent form from reloading the page
        
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const errorEl = document.getElementById('error-message') as HTMLParagraphElement;
        const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;

        const email = emailInput.value;
        const password = passwordInput.value;

        // Reset UI for new login attempt
        errorEl.textContent = '';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Ingresando...';

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // User successfully signed in, now check for authorization
                const uid = userCredential.user.uid;
                const userDocRef = doc(db, 'Autorizados', uid);
                return getDoc(userDocRef);
            })
            .then((docSnap) => {
                if (docSnap.exists()) {
                    // User is authorized, redirect to the main application
                    window.location.href = 'app.html';
                } else {
                    // User is not authorized
                    errorEl.textContent = 'Acceso no autorizado. Contacta a Profektus.';
                    signOut(auth); // Sign out the unauthorized user
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Ingresar';
                }
            })
            .catch((error) => {
                // Handle different kinds of authentication errors
                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorEl.textContent = 'Correo electrónico o contraseña incorrectos.';
                        break;
                    case 'auth/invalid-email':
                        errorEl.textContent = 'El formato del correo electrónico no es válido.';
                        break;
                    default:
                        errorEl.textContent = 'Error al iniciar sesión. Inténtalo de nuevo.';
                        break;
                }
                console.error('Firebase Auth Error:', error);
                loginBtn.disabled = false;
                loginBtn.textContent = 'Ingresar';
            });
    }
    
    // Attach the login handler to the form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Set up an observer on the Auth object to listen for sign-in state changes.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // A user is signed in, check if they are authorized
            const statusCheck = document.getElementById('error-message') as HTMLParagraphElement;
            if (statusCheck) statusCheck.textContent = "Verificando autorización...";
            
            const userDocRef = doc(db, 'Autorizados', user.uid);
            getDoc(userDocRef).then((docSnap) => {
                if (docSnap.exists()) {
                    // User is authorized, redirect to the app
                    window.location.replace('app.html');
                } else {
                    // User is not authorized, sign them out and let them stay on the login page
                    if (statusCheck) statusCheck.textContent = "";
                    signOut(auth);
                }
            }).catch(() => {
                // Error during authorization check, sign out
                if (statusCheck) statusCheck.textContent = "";
                signOut(auth);
            });
        }
        // If no user is signed in, do nothing. The user will see the login form.
    });
}

// Run the initialization logic once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeAppLogic);