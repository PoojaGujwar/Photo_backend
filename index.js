const {initializeDatabase} = require('./db.connection')
const express = require('express')
const app = express()
const axios = require('axios')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const cors = require("cors")
const cloudinary = require("cloudinary")
const multer = require('multer')
const PORT = 4000
const Album = require("./models/Album.model")
const ImageV2 = require("./models/Image.model")
const ShareData = require("./models/Share.model")
const UserModel = require("./models/User.model")
const {setSecureCookie} = require('./services')
const {verifyAccessToken} = require("./middleware/verifyAccessToken")
dotenv.config()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
origin:"https://photo-frontend-amber.vercel.app",
credentials:true
}))

initializeDatabase()

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
})
const storage = multer.diskStorage({})
const upload = multer({storage})

app.get("/auth/google", (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=https://photo-backend-delta.vercel.app/auth/google/callback&response_type=code&scope=profile email`
  res.redirect(googleAuthUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not provided");
  }
  let accessToken;
  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `https://photo-backend-delta.vercel.app/auth/google/callback`,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = tokenResponse.data.access_token;
    console.log("access_token",accessToken)
    setSecureCookie(res, accessToken);
    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`);
  } catch (error) {
    console.error(error);
  }
});

app.get("/user/profile/google", verifyAccessToken, async (req, res) => {
  console.log(req.cookies)
   const { access_token } = req.cookies;
  try {
   
    console.log(access_token);
    const googleUserDataResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let googleUser = googleUserDataResponse.data;
    let user = await UserModel.findOne({ userId: googleUser.id });
    if (!user) {
      user = await UserModel.create({
        userId: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
      });
    }
   // console.log(user)
    res.status(200).json(googleUser);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch user Google profile." });
  }
});


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})

app.post("/albums",async (req, res) => {
  console.log("/albums",req.cookies)
  try {
    const { name, description, ownerId, sharedUser } = req.body;
    if (!name || !description || !ownerId) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const newAlbum = new Album({ name, description, ownerId });
    await newAlbum.save();
    res.status(202).json({ message: "Album added successfuly", newAlbum });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Album post error", error: error });
  }
});

app.get("/albums", async (req, res) => {
  try {
    const allAlbums = await Album.find();
    res.status(200).json(allAlbums);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching albums", error: error });
  }
});
app.post("/albums/:id/share", async (req, res) => {
  const albumId = req.params.id;
  const { sharedUser } = req.body;
  try {
    const updatedAlbum = await Album.findByIdAndUpdate(
      albumId,
      {
        $addToSet: { sharedUser: sharedUser },
      },
      {
        new: true,
      }
    );
    res
      .status(202)
      .json({ message: "Share album successfully", albums: updatedAlbum });
  } catch (error) {
    res.status(500).json({ message: "Error while update album", error: error });
  }
});
app.post("/albums/:id", async (req, res) => {
  const albumId = req.params.id;
  const updatedData = req.body;
  try {
    const updatedAlbum = await Album.findByIdAndUpdate(albumId, updatedData, {
      new: true,
    });
    res
      .status(202)
      .json({ message: "Updated successfully", albums: updatedAlbum });
  } catch (error) {
    res.status(500).json({ message: "Error while update album", error: error });
  }
});
app.delete("/albums/:id", async (req, res) => {
  const albumId = req.params.id;
  try {
    const imageDelete = await ImageV2.deleteMany({ albumId: albumId });
    const album = await Album.findByIdAndDelete(albumId);
    res.status(202).json({ message: "Deleted Successfully", album });
  } catch (error) {
    res.status(500).json({ message: "Error while delete album", error: error });
  }
});

app.post("/images", upload.single("image"), async (req, res) => {
  const {
    imageId,
    albumId,
    imageUrl,
    name,
    tags,
    person,
    isFavorite,
    comments,
    size,
  } = req.body;
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no file uploaded");
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "uploads",
    });
    const newImage = new ImageV2({
      imageId,
      albumId,
      imageUrl: result.secure_url,
      name,
      tags,
      person,
      isFavorite,
      comments,
      size: result.bytes,
    });
    await newImage.save();
    res.status(202).json({ message: "Image uploaded successfully", newImage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error while adding image", error: error });
  }
});

app.get("/images", async (req, res) => {
  try {
    const images = await ImageV2.find();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching images", error: error });
  }
});
app.delete("/images/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const images = await ImageV2.findByIdAndDelete(id);
    res.status(200).json({ message: "Image delete successfully", images });
  } catch (error) {
    res.status(500).json({ message: "Error while delete image", error: error });
  }
});
app.get("/v1/users", async (req, res) => {
  const { currentEmail } = req.query;
  try {
    const users = await UserModel.find({ email: { $ne: currentEmail } });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while user fetching", error: error });
  }
});

app.get("/v1/shareData", async (req, res) => {
  try {
    const data = await ShareData.find().populate("album");
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while fetching share album", error: error });
  }
});

app.delete("/v1/shareData/:id", async (req, res) => {
  const albumId = req.params.id;
  try {
    const allData = await ShareData.deleteMany({ album: albumId });
    res.status(200).json({ message: "Share data deleted", data: allData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while delete share album", error: error });
  }
});