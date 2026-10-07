const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "aravi123@24#",
    database: "CINIHUB"
});

const upload = multer({
    storage: multer.memoryStorage()
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("MySQL Connected");
    }
});


// =========================
// SIGN UP
// =========================

app.post("/signup", (req, res) => {

    const { name, email, password, mobile } = req.body;

    const checkSql =
        "SELECT * FROM users WHERE email = ?";

    db.query(checkSql, [email], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const sql =
            "INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)";

        db.query(
            sql,
            [name, email, password, mobile],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Unable to create account"
                    });
                }

                res.json({
                    success: true,
                    message: "Account created successfully"
                });

            }
        );

    });

});


// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql =
        "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(
        sql,
        [email, password],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (result.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });

            }

            res.json({
                success: true,
                message: "Login successful",
                user: {
                    id: result[0].id,
                    name: result[0].name,
                    email: result[0].email
                }
            });

        }
    );

});


app.listen(3001, () => {
    console.log("CINIHUB backend running on port 3001");
});

app.post(
    "/profile/photo",
    upload.single("photo"),
    (req, res) => {

        const userId = req.body.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No photo selected"
            });
        }

        const sql = `
            UPDATE users
            SET profile_photo = ?,
                profile_photo_type = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                req.file.buffer,
                req.file.mimetype,
                userId
            ],
            (err, result) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to store photo"
                    });

                }

                res.json({
                    success: true,
                    message: "Profile photo stored in MySQL"
                });

            }
        );

    }
);

app.get("/profile/photo/:id", (req, res) => {

    const userId = req.params.id;

    const sql = `
        SELECT profile_photo, profile_photo_type
        FROM users
        WHERE id = ?
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {
                return res.status(500).send("Database error");
            }

            if (
                result.length === 0 ||
                !result[0].profile_photo
            ) {
                return res.status(404).send("Photo not found");
            }

            res.setHeader(
                "Content-Type",
                result[0].profile_photo_type
            );

            res.send(result[0].profile_photo);

        }
    );

});