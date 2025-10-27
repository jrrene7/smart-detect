const handleSignin = (db, bcrypt) => async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json("incorrect form submission");
  }

  try {
    const data = await db.select("email", "hash").from("login").where({ email });

    if (!data.length) {
      return res.status(400).json("wrong credentials");
    }

    const isValid = bcrypt.compareSync(password, data[0].hash);

    if (!isValid) {
      return res.status(400).json("wrong credentials");
    }

    const user = await db.select("*").from("users").where({ email });

    if (!user.length) {
      return res.status(400).json("unable to get user");
    }

    return res.json(user[0]);
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(400).json("wrong credentials");
  }
};

module.exports = {
  handleSignin,
};
