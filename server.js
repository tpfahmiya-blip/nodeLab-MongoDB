const express = require('express');
const { MongoClient } = require('mongodb');
const EventEmitter = require('events');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = 3000;

// MongoDB connection
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create EventEmitter
const myEmitter = new EventEmitter();


// =========================
// EVENT: SIGN UP
// =========================

myEmitter.on('signup', (email) => {

    const message =
        `${new Date().toISOString()} - User signed up: ${email}\n`;

    fs.appendFileSync('audit.log', message);

});


// =========================
// EVENT: LOGIN
// =========================

myEmitter.on('login', (email) => {

    const message =
        `${new Date().toISOString()} - User logged in: ${email}\n`;

    fs.appendFileSync('audit.log', message);

});


// =========================
// START SERVER
// =========================

async function startServer() {

    try {

        // Connect to MongoDB
        await client.connect();

        console.log('Connected to MongoDB');


        // Select database
        const db = client.db('nodeLab');


        // Select users collection
        const users = db.collection('users');


        // =========================
        // SIGN UP
        // =========================

        app.post('/signup', async (req, res) => {

            try {

                const { name, email, password } = req.body;


                // Check if email already exists
                const existingUser =
                    await users.findOne({ email: email });


                if (existingUser) {

                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered.'
                    });

                }


                // Insert new user
                await users.insertOne({
                    name: name,
                    email: email,
                    password: password
                });


                // Trigger signup event
                myEmitter.emit('signup', email);


                res.json({
                    success: true,
                    message: 'Registration successful!'
                });

            }

            catch (error) {

                console.error(error);

                res.status(500).json({
                    success: false,
                    message: 'Server error during registration.'
                });

            }

        });


        // =========================
        // LOGIN
        // =========================

        app.post('/login', async (req, res) => {

            try {

                const { email, password } = req.body;


                // Find matching user
                const user =
                    await users.findOne({
                        email: email,
                        password: password
                    });


                if (!user) {

                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password.'
                    });

                }


                // Trigger login event
                myEmitter.emit('login', email);


                res.json({
                    success: true,
                    message: 'Login successful!',
                    name: user.name
                });

            }

            catch (error) {

                console.error(error);

                res.status(500).json({
                    success: false,
                    message: 'Server error during login.'
                });

            }

        });


        // =========================
        // START EXPRESS
        // =========================

        app.listen(PORT, () => {

            console.log(
                `Server running at http://localhost:${PORT}`
            );

        });

    }

    catch (error) {

        console.error(
            'MongoDB connection failed:',
            error
        );

    }

}


startServer();
