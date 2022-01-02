const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email{
  constructor(user, url){
    this.to = user.email;
    this.firstname = user.name.split(' ')[0];
    this.url = url;
    this.from = `Fivetree Team <${process.env.EMAIL_FROM}>`;
  }

// async newTransport()
  newTransport(){
    if(process.env.NODE_ENV === 'production'){

      return nodemailer.createTransport({
        service: 'SendGrid',
        auth:{
          user:process.env.SENDGRID_USERNAME,
          pass:process.env.SENDGRID_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host:process.env.EMAIL_HOST,
      port:process.env.EMAIL_PORT,
      auth:{
        user:process.env.EMAIL_USERNAME,
        pass:process.env.EMAIL_PASSWORD
      },
      tls:{
          rejectUnauthorized:false
      }
    }) 
  }

  //send actual email
async send(template, subject){
    //1)Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject
    })

    //2)Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html)
    }

    //3)Create a transport and send email
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome(){
    await this.send('welcome', 'Welcome to Fivetree!')
  }

  async sendPasswordReset(){
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)')
  }
}
