import axios from 'axios';
import {showAlert} from './alerts';

export const login = async (email, password) => {
  try{
    const res = await axios({
      method: 'POST',
       url: '/api/v1/users/login',
       data: {
         email: email,
         password: password
       }
     })

     if(res.data.status === 'success'){
       showAlert('success', 'Logged In successfully!')
       window.setTimeout(() => {
         location.assign('/');
       }, 1000)
     }
  }catch(err){
    showAlert('error', err.response.data.message);
  }
}

export const signup = async (name, email, password, passwordConfirm) => {
  try{
    const res = await axios({
      method: 'POST',
       url: '/api/v1/users/signup',
       data: {
         name: name,
         email: email,
         password: password,
         passwordConfirm: passwordConfirm
       }
     })

     if(res.data.status === 'success'){
       showAlert('success', 'New account successfully created!')
       window.setTimeout(() => {
         location.assign('/me');
       }, 1000)
     }
  }catch(err){
    showAlert('error', err.response.data.message);
  }
}

export const logout = async () => {
  try{
    const res = await axios({
      method: 'GET',
       url: '/api/v1/users/logout',
    });
    if(res.data.status === 'success') location.assign('/');
  }catch(err){
    showAlert('error', 'ERROR logging out! Try again.')
  }
}
