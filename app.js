const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

let secret = process.env.JWT

async function requireToken (req, res, next) {
  try {const token = req.headers.authorization
  const userObj = await User.byToken(token)
  req.user = userObj;
  next();
  }
  catch(err) {
    next(err)
  }
}
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));


app.post('/api/auth', async(req, res, next)=> {
  try {
    let body = JSON.stringify(await User.authenticate(req.body))
    res.send({token: jwt.sign(body, secret)})
    // res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    res.send(await User.byToken(req.user));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', async (req,res,next) => {
  try{
    let notes = await Note.findAll({
      where: {userId: req.user}
    })
    res.send(notes)
  }

  catch(err){next(err)}
})

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
