const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Message = require("../models/message")
const { ensureLoggedIn } = require('../middleware/auth')

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try { 
        const { id } = req.params;
        const message = await Message.get(id)
        if (message.to_user.username != req.user.username || message.from_user.username != req.user.username) {
            throw new ExpressError("You don't have acces to message details", 401)
        }
        return res.json({ message })
    } catch(e) {
        return next(e)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/create', ensureLoggedIn, async (req, res, next) => {
    try {
        const { username } = req.user
        const { to_username, body } = req.body;
        const msg = await Message.create(username, to_username, body)
        return res.json({ msg })
    } catch(e) {
        return next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params
        const msg = await Message.get(id)
        // Check if the message is addressed to logged in user
        if (req.user.username !== msg.to_user.username) {
           throw new ExpressError("You don't have access to this message", 401) 
        }
        await Message.markRead(id)
        return res.json( { message : { id , status: "read"}})       
    } catch (e) {
        return next(e)
    }
})

module.exports = router;