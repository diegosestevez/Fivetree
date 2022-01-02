import axios from 'axios';
import {showAlert} from './alerts';

export const bookTour = async tourID => {
  const stripe = Stripe('pk_test_51KB6lzEzOEUXHhbw9Lvz3ElMFNnTQGYD2voEOS65enDHks2wK1bqScbHCVsUyjhRPOaVZ3CPxXDZjfTritjoDgdR00PCSyxLVU');
  // Stripe() is activated from from <script src="https://js.stripe.com/v3/"></script> tag in the html

  try{
  // 1) Get the stripe session from the server onto the client
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);

  // 2) Create the checkout form and charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
  })

  }catch(err){
    showAlert('error', err);
  }
}
