/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const Message = require("./message")

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
     // hash password
     const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
     // save to db
     const results = await db.query(`
       INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING username, first_name, last_name, password`,
       [username, hashedPassword, first_name, last_name, phone, new Date, new Date]);
      console.log(results.rows[0])
     return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT username, password
       FROM users
       WHERE username = $1`,
      [username]);
    const user = results.rows[0];
    console.log(user)
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username }, SECRET_KEY);
        return token
      }
    }
    throw new ExpressError("Invalid username/password", 400);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(`
      UPDATE users SET last_login_at=$1
      WHERE username=$2`, [new Date, username])
    }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    let results = await db.query('SELECT username, first_name, last_name, phone FROM users');
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone, 
   *          join_at,
   *          last_login_at } */
  static async get(username) {
    let results = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username=$1`, [username])
    if (results.rows.length === 0) {
        throw new ExpressError('User not found', 404)
    }
    return results.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    let results = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username=$1`, [username])
    if (results.rows.length === 0) {
      throw new ExpressError(`No messages from user ${username}`, 404)
    }
    return results.rows
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    let results = await db.query(`
      SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE to_username=$1`, [username])
    console.log(results.rows)
    if (results.rows.length === 0) {
      throw new ExpressError(`No messages from user ${username}`, 404)
    }
    return results.rows
  }
}

module.exports = User;