import '@babel/polyfill';
import {login, signup, logout} from './login';
import {updateSettings} from './updateSettings';
import {displayMap} from './mapbox';
import {bookTour} from './stripe';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signUpForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION
 if(mapBox){
   const locations = JSON.parse(mapBox.dataset.locations);
   displayMap(locations);
 }

if(loginForm){
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  })
}

if(signUpForm){
  signUpForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
  })
}

if(logOutBtn) logOutBtn.addEventListener('click', logout);

if(updateDataForm){
  updateDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(); // this is used to handle form data such as files for multer on the backend in place of enctype='multipart/form-data' that you would put in the <form> tags
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo',document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  })
}

if(updatePasswordForm){
  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  })
}

if(bookBtn){
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...'
    const tourID = e.target.dataset.tourId; 
    bookTour(tourID);
  })
}
