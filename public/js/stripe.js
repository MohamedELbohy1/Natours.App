import axios from 'axios';
// import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';

// const stripe = loadStripe(
//   'pk_test_51RE9lk2ci2cNzJ3kfPRZTOxK3SpFHBOb3CgDrnqosqylic1jeJiStNBq0uT8ST00ck4zO9Qsa5ZDdMzj411pFiuv001W1TzhTG',
// );

const stripe = Stripe(
  'pk_test_51RDShKQMhnjy0bHmgw73GhrNquyW0hNL6yTTLXnmvwqjCGM9HuHT358VJVJa6Wdz5i8WRBC6uJH3mtLOFfr06xkB00SNwCYOX3',
);

export const bookTour = async (tourId) => {
  try {
    // 1)Get Checkout Session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);
    //2) Create Checkout form +charge credit cart
    if (!stripe) {
      console.error('Stripe error');
      showAlert('error', err);
      return;
    }
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
