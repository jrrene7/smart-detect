import dotenv from "dotenv";
import { Component } from "react";
import ParticlesBg from "particles-bg";
import "./App.css";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import Navigation from "./components/Navigation/Navigation";
import Signin from "./components/Signin/Signin";
import Register from "./components/Register/Register";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import Rank from "./components/Rank/Rank";

// Change thus to whatever model want to use:
const MODEL_ID = "face-detection";

const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in Clarifai's Account Security section
  const PAT ="f2b87982e51b4c94b8c227d6ede48dd";
  // You can keep the 'clarifai'/'main' without changing it to your own unless you want to.
  // This will use the public Clarifai model so you dont need to create an app:
  const USER_ID = "jrrene7";
  const APP_ID = "smart-detect";

  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    user_app_id: {
      user_id: USER_ID,
      app_id: APP_ID,
    },
    inputs: [
      {
        data: {
          image: {
            url: IMAGE_URL,
          },
        },
      },
    ],
  });

  return {
    method: "POST",
    headers: {
      "Accept": "application/json", // Indicate expected response type
      "Authorization": "Key " + PAT, // Your Clarifai API key or PAT [4]
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:5173" // Correct content type for JSON body
    },
    body: raw,
  };
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: "",
      imageUrl: "",
      box: {},
      route: "signin",
      isSignedIn: false,
      user: {
        id: "",
        name: "",
        email: "",
        entries: 0,
        joined: "",
      },
    };
  }

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined,
      },
    });
  };

  calculateFaceLocation = (data) => {
    const clarifaiFace =
      data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById("inputimage");
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height,
    };
  };

  displayFaceBox = (box) => {
    this.setState({ box: box });
  };

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onButtonSubmit = async () => {
    this.setState({ imageUrl: this.state.input });

    try {
      const response = await fetch(
        "http://localhost:3000/api/clarifai/face-detect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: this.state.input }),
        }
      );

      const data = await response.json();
      if (!data?.outputs) {
        return;
      }

      this.displayFaceBox(this.calculateFaceLocation(data));

      const entriesResponse = await fetch("http://localhost:3000/image", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: this.state.user.id,
        }),
      });

      const count = await entriesResponse.json();

      const normalizeEntriesValue = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }

        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }

        if (value && typeof value === "object") {
          if (Object.prototype.hasOwnProperty.call(value, "entries")) {
            return normalizeEntriesValue(value.entries);
          }
          if (Array.isArray(value) && value.length > 0) {
            return normalizeEntriesValue(
              value[0]?.entries ?? value[0]
            );
          }
        }

        return null;
      };

      const entriesValue = normalizeEntriesValue(count);
      if (entriesValue === null) {
        console.warn("Unable to parse entries count:", count);
        return;
      }

      this.setState((prevState) => ({
        user: {
          ...prevState.user,
          entries: entriesValue,
        },
      }));
    } catch (err) {
      console.log(err);
    }
  };

  onRouteChange = (route) => {
    if (route === "signout") {
      this.setState({ isSignedIn: false });
    } else if (route === "home") {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  };

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
      <div className="App">
        <ParticlesBg type="cobweb" bg={true} />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
        />
        {route === "home" ? (
          <div>
            <Logo />
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageUrl={imageUrl} />
          </div>
        ) : route === "signin" ? (
          <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
        ) : (
          <Register
            loadUser={this.loadUser}
            onRouteChange={this.onRouteChange}
          />
        )}
      </div>
    );
  }
}

export default App;
