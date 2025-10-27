const handleProfileGet = (db) => async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.select("*").from("users").where({ id });

    if (!user.length) {
      return res.status(404).json("Not found");
    }

    return res.json(user[0]);
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(400).json("error getting user");
  }
};

module.exports = {
  handleProfileGet,
};
