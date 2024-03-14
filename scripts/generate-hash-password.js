const readline = require('readline')
const bcrypt = require('bcrypt')

const saltRounds = 10

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter password: ', password => {
  bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
      console.error(err)
      return
    }
    console.log('Hashed password:', hash)
    rl.close()
  })
})
