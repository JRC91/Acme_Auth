const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};
const bcrypt = require('bcrypt');
const { JsonWebTokenError } = require('jsonwebtoken');

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING,
})

User.byToken = async(token)=> {
  try {
    const user = await User.findByPk(token);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};
User.beforeCreate(async (user)=> {
  const hashedPW = await bcrypt.hash(user.password, 2)
  user.password=hashedPW;
})
User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });
  let unencrpyt = await bcrypt.compare(password, user.password)
  if(unencrpyt === true){
    return user.id;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const notes = [
    {text: 'worker porter for ye'},
    {text: 'worker porter for me'},
    {text: 'popeye the sailor man'}
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(notes.map(note => Note.create(note)))
  await lucy.setNotes(note1)
  await moe.setNotes([note2, note3])

  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};



Note.belongsTo(User)
User.hasMany(Note)
module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
