const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const app = express()

app.use(express.json())

const dbpath = path.join(__dirname, 'twitterClone.db')

let db

const IntilizeDbAndServer = async () => {
  try {
    db = await open({filename: dbpath, driver: sqlite3.Database})

    app.listen(3000, () => {
      console.log('server running on http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Error in db ${e}`)
    process.exit(1)
  }
}
IntilizeDbAndServer()

// AIP 1
app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const hashedpassword = await bcrypt.hash(request.body.password, 10)
  const selectQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createQuery = `INSERT INTO user (username,password,name,gender)
        VALUES ('${username}','${hashedpassword}','${name}','${gender}')`
      const dbUser = await db.run(createQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM  user WHERE username ='${username}'`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch === true) {
      let payload = {username: username}
      const jwtToken = jwt.sign(payload, 'MY_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticate = async (request, response, next) => {
  let jwtToken
  const authorHeader = request.headers['authorization']
  if (authorHeader !== undefined) {
    jwtToken = authorHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

//API 3

app.get('/user/tweets/feed/', authenticate, async (request, response) => {
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const selectQuery = `
    SELECT
      user.username,
      tweet.tweet,
      tweet.date_time AS dateTime
    FROM follower
    INNER JOIN tweet
      ON follower.following_user_id = tweet.user_id
    INNER JOIN user
      ON tweet.user_id = user.user_id
    WHERE follower.follower_user_id = ${userId}
    ORDER BY tweet.date_time DESC
    LIMIT 4;
  `
  const tweets = await db.all(selectQuery)
  response.send(tweets)
})

//API 4

app.get('/user/following/', authenticate, async (request, response) => {
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const selectQuery = `
    SELECT user.name
    FROM follower
    INNER JOIN user
      ON follower.following_user_id = user.user_id
    WHERE follower.follower_user_id = ${userId};
  `
  const following = await db.all(selectQuery)
  response.send(following)
})

//API 5

app.get('/user/followers/', authenticate, async (request, response) => {
  const {username} = request

  const getUserQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(getUserQuery)
  const userId = userData.user_id

  const followersQuery = `
    SELECT user.name
    FROM follower
    INNER JOIN user
      ON follower.follower_user_id = user.user_id
    WHERE follower.following_user_id = ${userId};
  `

  const followers = await db.all(followersQuery)
  response.send(followers)
})

//API 6

app.get('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const checkQuery = `
    SELECT tweet.tweet, tweet.date_time AS dateTime
    FROM tweet
    INNER JOIN follower
      ON tweet.user_id = follower.following_user_id
    WHERE follower.follower_user_id = ${userId}
    AND tweet.tweet_id = ${tweetId};
  `
  const tweetData = await db.get(checkQuery)

  if (tweetData === undefined) {
    response.status(401)
    response.send('Invalid Request')
    return
  }

  const likesQuery = `
    SELECT COUNT(*) AS likes
    FROM like
    WHERE tweet_id = ${tweetId};
  `
  const likesData = await db.get(likesQuery)

  const repliesQuery = `
    SELECT COUNT(*) AS replies
    FROM reply
    WHERE tweet_id = ${tweetId};
  `
  const repliesData = await db.get(repliesQuery)

  response.send({
    tweet: tweetData.tweet,
    likes: likesData.likes,
    replies: repliesData.replies,
    dateTime: tweetData.dateTime,
  })
})

//API 7
app.get('/tweets/:tweetId/likes/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const checkQuery = `
    SELECT tweet.tweet_id
    FROM tweet
    INNER JOIN follower
      ON tweet.user_id = follower.following_user_id
    WHERE follower.follower_user_id = ${userId}
    AND tweet.tweet_id = ${tweetId};
  `
  const isAllowed = await db.get(checkQuery)

  if (isAllowed === undefined) {
    response.status(401)
    response.send('Invalid Request')
    return
  }

  const likesQuery = `
    SELECT user.username
    FROM like
    INNER JOIN user
      ON like.user_id = user.user_id
    WHERE like.tweet_id = ${tweetId};
  `
  const likesData = await db.all(likesQuery)

  const likes = likesData.map(each => each.username)

  response.send({likes})
})

//API 8
app.get(
  '/tweets/:tweetId/replies/',
  authenticate,
  async (request, response) => {
    const {tweetId} = request.params
    const {username} = request

    const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
    const userData = await db.get(userQuery)
    const userId = userData.user_id

    const checkQuery = `
    SELECT tweet.tweet_id
    FROM tweet
    INNER JOIN follower
      ON tweet.user_id = follower.following_user_id
    WHERE follower.follower_user_id = ${userId}
    AND tweet.tweet_id = ${tweetId};
  `
    const isAllowed = await db.get(checkQuery)

    if (isAllowed === undefined) {
      response.status(401)
      response.send('Invalid Request')
      return
    }

    const repliesQuery = `
    SELECT user.name, reply.reply
    FROM reply
    INNER JOIN user
      ON reply.user_id = user.user_id
    WHERE reply.tweet_id = ${tweetId};
  `
    const repliesData = await db.all(repliesQuery)

    response.send({replies: repliesData})
  },
)

//API 9
app.get('/user/tweets/', authenticate, async (request, response) => {
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const tweetsQuery = `
    SELECT
      tweet.tweet,
      COUNT(DISTINCT like.like_id) AS likes,
      COUNT(DISTINCT reply.reply_id) AS replies,
      tweet.date_time AS dateTime
    FROM tweet
    LEFT JOIN like
      ON tweet.tweet_id = like.tweet_id
    LEFT JOIN reply
      ON tweet.tweet_id = reply.tweet_id
    WHERE tweet.user_id = ${userId}
    GROUP BY tweet.tweet_id;
  `

  const tweets = await db.all(tweetsQuery)
  response.send(tweets)
})

//API 10
app.post('/user/tweets/', authenticate, async (request, response) => {
  const {tweet} = request.body
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const createTweetQuery = `
    INSERT INTO tweet (tweet, user_id, date_time)
    VALUES ('${tweet}', ${userId}, datetime('now'));
  `
  await db.run(createTweetQuery)

  response.send('Created a Tweet')
})

//API 11
app.delete('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request

  const userQuery = `
    SELECT user_id FROM user WHERE username = '${username}';
  `
  const userData = await db.get(userQuery)
  const userId = userData.user_id

  const tweetQuery = `
    SELECT tweet_id FROM tweet
    WHERE tweet_id = ${tweetId} AND user_id = ${userId};
  `
  const tweetData = await db.get(tweetQuery)

  if (tweetData === undefined) {
    response.status(401)
    response.send('Invalid Request')
    return
  }

  const deleteQuery = `
    DELETE FROM tweet WHERE tweet_id = ${tweetId};
  `
  await db.run(deleteQuery)

  response.send('Tweet Removed')
})

module.exports = app
