# Twitter Backend API

A backend REST API for a Twitter-like application built using **Node.js**, **Express**, **SQLite**, and **JWT authentication**.  
This project implements secure user authentication and authorization, tweet management, follower system, likes, and replies.

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express
- **Database:** SQLite
- **Authentication:** JWT
- **Security:** bcrypt

---

## 📦 Database Schema

### User
| Column | Type |
|------|------|
| user_id | INTEGER |
| name | TEXT |
| username | TEXT |
| password | TEXT |
| gender | TEXT |

### Follower
| Column | Type |
|------|------|
| follower_id | INTEGER |
| follower_user_id | INTEGER |
| following_user_id | INTEGER |

### Tweet
| Column | Type |
|------|------|
| tweet_id | INTEGER |
| tweet | TEXT |
| user_id | INTEGER |
| date_time | DATETIME |

### Reply
| Column | Type |
|------|------|
| reply_id | INTEGER |
| tweet_id | INTEGER |
| reply | TEXT |
| user_id | INTEGER |
| date_time | DATETIME |

### Like
| Column | Type |
|------|------|
| like_id | INTEGER |
| tweet_id | INTEGER |
| user_id | INTEGER |
| date_time | DATETIME |

---

## 🔐 Authentication

JWT-based authentication is used for all protected routes.

### Sample Login Credentials
```json
{
  "username": "JoeBiden",
  "password": "biden@123"
}
```



🚀 API Endpoints
Authentication

POST /register/ — Register a new user

POST /login/ — Login user and return JWT token

Tweets & Feed

GET /user/tweets/feed/ — Get latest tweets from followed users

GET /user/tweets/ — Get all tweets of logged-in user

POST /user/tweets/ — Create a new tweet

DELETE /tweets/:tweetId/ — Delete a tweet (only own tweets)

Follow System

GET /user/following/ — List users the logged-in user follows

GET /user/followers/ — List users who follow the logged-in user

Tweet Interactions

GET /tweets/:tweetId/ — Get tweet details (authorized access)

GET /tweets/:tweetId/likes/ — Get users who liked a tweet

GET /tweets/:tweetId/replies/ — Get replies for a tweet

⚙️ Setup Instructions
npm install
node app.js

👨‍💻 Author

Sai Teja Ganduri
