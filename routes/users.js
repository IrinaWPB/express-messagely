const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user")
const Message = require("../models/message")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth.js")
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async (req, res, next) => {
   try {
    const users = await User.all()
    return res.json(users)
  } catch (e) {
    return next(e)
  } 
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
    try {
       const { username } = req.params;
       let user = await User.get(username) 
       return res.json( { user })   
    } catch(e) {
        return next(e)
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureLoggedIn, async (req, res, next) => {
    try {
        const currentUser = await User.get(req.user.username)
        const { username, first_name, last_name, phone } = currentUser
        const to_username = req.params.username
        const msgs = await User.messagesTo(to_username)
        const myMessages = []
        for (let msg of msgs) {
            if (msg.from_username == req.user.username) {
                delete msg.from_username
                msg.from_user = { username, first_name, last_name, phone }
                myMessages.push(msg)
            } 
        }
        return res.json( {messages : myMessages})
    } catch(e) {
        return next(e)
    }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', ensureLoggedIn, async (req, res, next) => {
    try {
        const currentUser = await User.get(req.user.username)
        const { username, first_name, last_name, phone } = currentUser
        const from_username = req.params.username
        const msgs = await User.messagesFrom(username)
        const myMessages = []
        for (let msg of msgs) {
            if (msg.to_username = req.user.username) {
                delete msg.to_username
                msg.from_user = { username, first_name, last_name, phone }
                myMessages.push(msg)
            } 
        }
        return res.json( {messages : myMessages})
    } catch(e) {
        return next(e)
    }
})
module.exports = router;