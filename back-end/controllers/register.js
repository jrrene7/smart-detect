const handleRegister = (db, bcrypt) => async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json("incorrect form submission");
  }

  const hash = bcrypt.hashSync(password);

  try {
    const user = await db.transaction(async (trx) => {
      const loginEmail = await trx("login")
        .insert({ hash, email })
        .returning("email");

      const registeredUsers = await trx("users")
        .insert({
          email: loginEmail[0].email,
          name,
          joined: new Date(),
        })
        .returning("*");

      return registeredUsers[0];
    });

    return res.json(user);
  } catch (err) {
    console.error("Register error:", err);
    return res.status(400).json("unable to register");
  }
};

module.exports = {
  handleRegister,
};
