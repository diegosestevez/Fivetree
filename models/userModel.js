const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    required: [true, 'Please provide a name']
  },
  email:{
    type:String,
    required: [true, 'please provide an email address'],
    unique: true,
    lowercase: true,
    //using the validator package in validate array
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo:{
    type:String,
    default: 'default.jpg'
  },
  role:{
    type:String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password:{
    type:String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm:{
    type: String,
    required:[true, 'password confirm your password'],
    validate: {
      validator: function(val){
        return val === this.password
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangeAt:Date,
  passwordResetToken: String,
  passwordResetExpires:Date,
  active:{
    type:Boolean,
    default:true,
    select: false
  }
})

//MONGOOSE MIDDLEWARE
userSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next){
  if(!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
})

userSchema.pre(/^find/, function(next){
  this.find({active:{$ne:false}})
  next()
})

//INSTANCE METHODS
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
  return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if(this.passwordChangeAt){
    const changedTimeStamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimeStamp
  }
  return false;
}

userSchema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
