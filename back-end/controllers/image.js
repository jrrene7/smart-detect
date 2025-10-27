const handleImage = (db) => async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json("missing user id");
  }

  try {
    const entries = await db("users")
      .where({ id })
      .increment("entries", 1)
      .returning("entries");

    if (!entries.length) {
      return res.status(400).json("unable to get entries");
    }

    return res.json(entries[0].entries);
  } catch (err) {
    console.error("Image entries error:", err);
    return res.status(400).json("unable to get entries");
  }
};

module.exports = {
  handleImage,
};
