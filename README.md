# movie-posting-product
🎬 Movie Posting Product — Full Stack Web Application

A complete movie management platform built with Node.js, Express, MongoDB, EJS, JWT Authentication & Multer.
Admin और users दोनों के लिए complete system जिसमें movies add, edit, delete, review, rate और watchlist features शामिल हैं।

🚀 Features
🔐 Authentication

Signup / Login with JWT
Secure HTTP-only cookies
Role-based access (User, Admin)

🎬 Movie Management

Add new movies with details (title, description, release date, genres)
Upload poster image + multiple gallery images
Edit movie information
Delete movies
Auto-generated movie slug & unique ID

⭐ Ratings & Reviews

Users can rate movies (1–5 stars)
Write reviews
Edit/Delete review (user-only)
Admin can delete abusive reviews
Auto average rating per movie

🔍 Search & Filters

Search by movie title, actor, director
Filter by:
  Genre
  Rating
  Year
  Trending / Popular
Combined filters supported

📽 Trailer Support

Add YouTube trailer URL
Embedded YouTube player on movie detail page

❤️ Watchlist / Favorites

Add/Remove movie from personal watchlist
Dedicated “My Watchlist” page for each user

📊 Admin Dashboard

Includes:
  Total movies
  Total users
  Average ratings
  Trending movies
  Most reviewed movies
  Recently added
  Graphs (optional using Chart.js)

📁 Multiple Image Upload

Poster image
Gallery images (Multer array upload)
Preview on detail page
Delete gallery images

👤 Actor & Director Profiles

Dedicated models for Actors & Directors
Profile pages with bio, age, photo
Linked movies section
Movie page shows cast details

✨ Trending / Popular Sections

Trending score based on:
Views
Ratings
Reviews count
Likes
Homepage sections:
Trending Now
Popular Movies
Recently Added
Top Rated

🗂️ Project Structure

Movie-posting-product/
│── controllers/
│── models/
│── routes/
│── middlewares/
│── views/
│── public/
│   ├── uploads/movies/
│── db/
│── index.js
│── package.json
│── README.md
│── .env (not included in repo)

🛠️ Tech Stack

Backend
  Node.js
  Express.js
  MongoDB (Mongoose)
  JWT Authentication
  Multer (file uploads)
  
Frontend
  EJS Templates
  Bootstrap / Custom CSS
  Client-side JS
  
Other Tools
  bcrypt
  Cookie-parser
  dotenv
  Express-validator

📦 Installation

1️⃣ Clone the repo

git clone <your-repo-url>
cd Movie-posting-product

2️⃣ Install dependencies

npm install

3️⃣ Setup environment

Create a .env file:

PORT=3000
MONGO_URI=mongodb://localhost:27017/movies
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

4️⃣ Start the server

npm start

Server will run at:

http://localhost:3000

🔐 Default Roles

| Role      | Permissions                                                                 |
| --------- | --------------------------------------------------------------------------- |
| **Admin** | Add/edit/delete movies, actors, directors, delete reviews, dashboard access |
| **User**  | Rate/review, watchlist save, view movies                                    |

🤝 Contributing

Pull requests are welcome. Please open an issue to discuss before major changes.

