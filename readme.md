![Fivetree logo](/public/img/fivetree.png)

## About
Fivetree is ecommerce web application that helps its users find recreational tours and touring related services. This application is rendered dynamically using the [pug templating engine](https://pugjs.org/api/getting-started.html) and an API built on [nodeJS](https://nodejs.org/en/), [express](https://expressjs.com/), [mongoose](https://mongoosejs.com/) and [mongoDB](https://www.mongodb.com/).

**_[Click here to see the live demo](http://fivetree.herokuapp.com/)_**

## Installing this project locally
1. Clone the github repo onto your local device
2. Install of the dependencies by running npm install
3. Set your own values for following environment variables on a .env file inside your project:
    - NODE_ENV
    - USERNAME
    - DATABASE
    - DATABASE_PASSWORD
    - JWT_SECRET
    - JWT_EXPIRES_IN
    - JWT_COOKIE_EXPIRES
    - EMAIL_FROM
    - SENDGRID_USERNAME
    - SENDGRID_PASSWORD
    - STRIPE_SECRET_KEY
    - STRIPE_WEBHOOK_SECRET
 
 **_Please note that in order for this project to work on your local environment you will require the following:_**
 1. Your own [mongoDB cluster and password](https://www.mongodb.com/)
 2. Your own account and verified email address with [SENDGRID](https://sendgrid.com/) in order for the application to send users email messages
 3. Your own testing account, secret key and webhook key from the [stripe service](https://stripe.com/en-ca)




