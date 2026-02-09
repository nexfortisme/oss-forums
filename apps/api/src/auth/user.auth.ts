import { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { pbkdf2Sync, randomBytes } from "node:crypto";
// @ts-ignore - oss-forums.db will be resolved at runtime
import db from './oss-forums.db' with {type: 'sqlite'};
import { decode, sign, verify } from 'hono/jwt'

const iterations = 100000; // Number of iterations (adjust for desired security and performance)
const keyLength = 64; // Length of the resulting key
const digest = "sha256"; // Hash algorithm

const PASSWORD_MIN_LENGTH = 8;

export const register = async (c: Context) => {
    const requestBody = await c.req.json();

    const username = requestBody.username;
    const email = requestBody.email;
    const password = requestBody.password;

    // if(password.length < PASSWORD_MIN_LENGTH) {
    //     return c.text("Your password must be at least 8 characters long. If you wish to use a short password, you accept the risk of your account being compromised. This is your only warning.", 401);
    // }

    // if(BAD_PASSWORD_LIST.includes(password)) {
    //     return c.text("Your password is too common. Please choose a more secure password. If you with to use a bad password, you accept the risk of your account being compromised. This is your only warning.", 401);
    // }

    const user = db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username]);
    if (user.length > 0) {
        console.log('User already exists with that email or username', user);
        return c.text("User already exists with that email or username", 401);
    }

    const salt = randomBytes(16).toString("hex");
    const hashedPassword = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
    const userId = Bun.randomUUIDv7();

    const query = db.prepareQuery("INSERT INTO users (id, username, email, password, salt) VALUES (?, ?, ?, ?, ?)");
    query.all([userId, username, email, hashedPassword, salt]);

    const newUser = db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if(user.length === 0) {
        return c.text("Error Creating User ", 404);
    }

    console.log('newUser', newUser);

    return c.text("User created successfully");
}

export const login = async (c: Context) => {

    const requestBody = await c.req.json();

    console.log('Login Request Body', requestBody);

    const email = requestBody.email;
    const password = requestBody.password;

    // Checking to see if the user exists
    const user = db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
        console.log('User does not exist');
        return c.text("User does not exist", 401);
    }

    console.log('user', user.fromRow(user[0]));
    let userObj = user.fromRow(user[0]);

    // // Checking to see if the password is correct
    const hashedPassword = pbkdf2Sync(password, userObj.salt, iterations, keyLength, digest).toString("hex");
    if (userObj.password !== hashedPassword) {
        console.log('Password is incorrect');
        return c.text("Password is incorrect", 401);
    }

    const payload = {
        iss: "oss-forums",
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        user: JSON.stringify({
            id: userObj.id,
            username: userObj.username,
            email: userObj.email
        })
    }

    // Creating the JWT
    const userJWT = await sign(payload, Bun.env.JWT_SECRET as string, 'HS256');

    setCookie(c, "auth_token", userJWT, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 60 * 60,
        path: "/",
    });

    return c.text("Login successful");
}

export const logout = (c: Context) => {
    deleteCookie(c, "auth_token");
    return c.text("Logout successful");
}

export const validate = async (c: Context) => {
    const token = getCookie(c, "auth_token");

    if (!token) {
        return c.text("No token provided", 401);
    }

    try {
        const decoded = await verify(token, Bun.env.JWT_SECRET as string, 'HS256');

        console.log("Token is valid");

        return c.text("Token is valid", 200);
    } catch (_error) {
        return c.text("Invalid token", 401);
    }
}

// TODO - Update this with a DB call to return the user object, minus the password, salt and stuff like that
export const me = async (c: any) => {
    const token = getCookie(c, "auth_token");
    if (!token) {
        return c.text("No token provided", 401);
    }
    const decoded = await verify(token, Bun.env.JWT_SECRET as string, 'HS256');
    return c.json(decoded);
}
