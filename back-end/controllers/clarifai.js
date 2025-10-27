const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID || "clarifai";
const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID || "main";
const CLARIFAI_MODEL_ID = process.env.CLARIFAI_MODEL_ID || "face-detection";

const stub = ClarifaiStub.grpc();

const createMetadata = (pat) => {
  const metadata = new grpc.Metadata();
  metadata.set("authorization", `Key ${pat}`);
  return metadata;
};

const callClarifaiModel = (client, request, metadata) =>
  new Promise((resolve, reject) => {
    client.PostModelOutputs(request, metadata, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });

const handleClarifaiCall =
  (client = stub) =>
  async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json("missing image url");
    }

    const pat = process.env.PAT;
    if (!pat) {
      console.error("Clarifai configuration error: PAT is not set.");
      return res
        .status(500)
        .json({ error: "Clarifai credentials are not configured" });
    }

    const request = {
      user_app_id: {
        user_id: CLARIFAI_USER_ID,
        app_id: CLARIFAI_APP_ID,
      },
      model_id: CLARIFAI_MODEL_ID,
      inputs: [
        {
          data: { image: { url: imageUrl } },
        },
      ],
    };

    try {
      const response = await callClarifaiModel(
        client,
        request,
        createMetadata(pat)
      );

      if (response.status?.code !== 10000) {
        console.error(
          "Clarifai API error:",
          response.status?.description,
          response.status?.details
        );
        return res
          .status(502)
          .json({ error: "Clarifai request failed", status: response.status });
      }

      return res.json(response);
    } catch (error) {
      console.error("Clarifai gRPC error:", error);
      return res.status(500).json({ error: "Clarifai request failed" });
    }
  };

module.exports = {
  handleClarifaiCall,
};
