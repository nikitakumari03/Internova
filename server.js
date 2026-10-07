const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;


// =========================
// DATABASE
// =========================

const db = new Database("internship.db");


// =========================
// APPLICATIONS TABLE
// =========================

db.prepare(`
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        college TEXT NOT NULL,
        course TEXT NOT NULL,
        year TEXT NOT NULL,
        skills TEXT NOT NULL,
        resume TEXT,
        message TEXT NOT NULL,
        internship TEXT,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();


// =========================
// ADMIN TABLE
// =========================

db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();


console.log("Database connected successfully");


// =========================
// RESUME UPLOAD FOLDER
// =========================

const resumeFolder = path.join(
    __dirname,
    "uploads",
    "resumes"
);


if (!fs.existsSync(resumeFolder)) {

    fs.mkdirSync(
        resumeFolder,
        {
            recursive: true
        }
    );

}


// =========================
// MULTER STORAGE
// =========================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            resumeFolder
        );

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname);

        const originalName =
            path.basename(
                file.originalname,
                extension
            )
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        const uniqueName =
            Date.now() +
            "-" +
            originalName +
            extension;

        cb(
            null,
            uniqueName
        );

    }

});


// =========================
// FILE FILTER
// =========================

const fileFilter =
    function (req, file, cb) {

        const allowedExtensions = [
            ".pdf",
            ".doc",
            ".docx"
        ];

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        if (
            allowedExtensions.includes(
                extension
            )
        ) {

            cb(
                null,
                true
            );

        }

        else {

            cb(
                new Error(
                    "Only PDF, DOC and DOCX files are allowed."
                )
            );

        }

    };


// =========================
// MULTER UPLOAD
// =========================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});


// =========================
// MIDDLEWARE
// =========================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================
// SESSION
// =========================

app.use(
    session({

        secret:
            "internship-admin-secret-change-this",

        resave: false,

        saveUninitialized: false,

        cookie: {

            httpOnly: true,

            maxAge:
                1000 * 60 * 60

        }

    })
);


// =========================
// STATIC FILES
// =========================

app.use(
    express.static(__dirname)
);


// Resume files can be accessed
// only through admin route below.
// Do NOT make uploads folder public.


// =========================
// TEST API
// =========================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            message:
                "Backend and database are working!"

        });

    }
);


// =========================
// ADMIN SIGNUP
// =========================

app.post(
    "/api/admin/signup",
    async (req, res) => {

        try {

            const {
                username,
                email,
                password
            } = req.body;


            // Required fields

            if (
                !username ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all fields."

                });

            }


            // Password length

            if (
                password.length < 8
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be at least 8 characters."

                });

            }


            // Only one admin account

            const adminCount =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM admins
                `).get();


            if (
                adminCount.count > 0
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Admin account already exists."

                });

            }


            const cleanUsername =
                username.trim();


            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            // Hash password

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    12
                );


            // Save admin

            db.prepare(`
                INSERT INTO admins (
                    username,
                    email,
                    password
                )
                VALUES (?, ?, ?)
            `).run(
                cleanUsername,
                cleanEmail,
                hashedPassword
            );


            res.json({

                success: true,

                message:
                    "Admin account created successfully!"

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to create admin account."

            });

        }

    }
);


// =========================
// ADMIN LOGIN
// =========================

app.post(
    "/api/admin/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter username and password."

                });

            }


            // Find admin

            const admin =
                db.prepare(`
                    SELECT *
                    FROM admins
                    WHERE username = ?
                `).get(
                    username.trim()
                );


            if (!admin) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });

            }


            // Compare password

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    admin.password
                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });

            }


            // Create session

            req.session.adminId =
                admin.id;

            req.session.adminUsername =
                admin.username;


            res.json({

                success: true,

                message:
                    "Login successful."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to login."

            });

        }

    }
);


// =========================
// CHECK ADMIN LOGIN
// =========================

app.get(
    "/api/admin/check",
    (req, res) => {

        if (
            req.session.adminId
        ) {

            return res.json({

                loggedIn: true,

                username:
                    req.session.adminUsername

            });

        }


        res.status(401).json({

            loggedIn: false

        });

    }
);


// =========================
// ADMIN LOGOUT
// =========================

app.post(
    "/api/admin/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to logout."

                    });

                }


                res.json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);

// =========================
// ADMIN PASSWORD RESET
// =========================

app.post(
    "/api/admin/reset-password",
    async (req, res) => {

        try {

            const {
                username,
                email,
                newPassword
            } = req.body;


            // Check fields

            if (
                !username ||
                !email ||
                !newPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter username, email and new password."

                });

            }


            // Password length

            if (
                newPassword.length < 8
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "New password must be at least 8 characters."

                });

            }


            // Find admin

            const admin =
                db.prepare(`
                    SELECT *
                    FROM admins
                    WHERE username = ?
                    AND email = ?
                `).get(
                    username.trim(),
                    email.trim().toLowerCase()
                );


            if (!admin) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Username and email do not match."

                });

            }


            // Hash new password

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    12
                );


            // Update password

            db.prepare(`
                UPDATE admins
                SET password = ?
                WHERE id = ?
            `).run(
                hashedPassword,
                admin.id
            );


            res.json({

                success: true,

                message:
                    "Password reset successfully."

            });

        }


        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to reset password."

            });

        }

    }
);


// =========================
// SUBMIT APPLICATION
// =========================
// IMPORTANT:
// This route now accepts multipart/form-data
// because resume is uploaded as a real file.

app.post(
    "/api/apply",
    upload.single("resume"),
    (req, res) => {

        try {

            const {

                name,

                email,

                phone,

                college,

                course,

                year,

                skills,

                message,

                internship,

                company

            } = req.body;


            // Required fields

            if (
                !name ||
                !email ||
                !phone ||
                !college ||
                !course ||
                !year ||
                !skills ||
                !message
            ) {

                // Delete uploaded file if
                // required field is missing

                if (
                    req.file
                ) {

                    fs.unlinkSync(
                        req.file.path
                    );

                }


                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all required fields."

                });

            }


            // Resume filename

            const resumeName =
                req.file
                    ? req.file.filename
                    : "";


            // Save application

            const statement =
                db.prepare(`

                    INSERT INTO applications (

                        name,

                        email,

                        phone,

                        college,

                        course,

                        year,

                        skills,

                        resume,

                        message,

                        internship,

                        company

                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )

                `);


            const result =
                statement.run(

                    name,

                    email,

                    phone,

                    college,

                    course,

                    year,

                    skills,

                    resumeName,

                    message,

                    internship || "",

                    company || ""

                );


            res.json({

                success: true,

                message:
                    "Application submitted successfully!",

                applicationId:
                    result.lastInsertRowid

            });

        }

        catch (error) {

            console.error(error);


            // Remove uploaded file
            // if database save fails

            if (
                req.file &&
                fs.existsSync(
                    req.file.path
                )
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }


            res.status(500).json({

                success: false,

                message:
                    "Something went wrong."

            });

        }

    }
);


// =========================
// GET APPLICATIONS
// =========================

app.get(
    "/api/applications",
    (req, res) => {


        // Check admin login

        if (
            !req.session.adminId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized. Please login."

            });

        }


        try {

            const applications =
                db.prepare(`

                    SELECT *

                    FROM applications

                    ORDER BY created_at DESC

                `).all();


            res.json(
                applications
            );

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to fetch applications."

            });

        }

    }
);


// =========================
// DELETE APPLICATION
// =========================

app.delete(
    "/api/applications/:id",
    (req, res) => {


        // Check admin login

        if (
            !req.session.adminId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized. Please login."

            });

        }


        try {

            const id =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid application ID."

                });

            }


            // Find resume before deleting

            const application =
                db.prepare(`
                    SELECT resume
                    FROM applications
                    WHERE id = ?
                `).get(id);


            const result =
                db.prepare(`
                    DELETE FROM applications
                    WHERE id = ?
                `).run(id);


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Application not found."

                });

            }


            // Delete resume file also

            if (
                application &&
                application.resume
            ) {

                const resumePath =
                    path.join(
                        resumeFolder,
                        application.resume
                    );


                if (
                    fs.existsSync(
                        resumePath
                    )
                ) {

                    fs.unlinkSync(
                        resumePath
                    );

                }

            }


            res.json({

                success: true,

                message:
                    "Application deleted successfully."

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to delete application."

            });

        }

    }
);


// =========================
// ADMIN RESUME DOWNLOAD
// =========================

app.get(
    "/api/resume/:id",
    (req, res) => {

        // Only logged-in admin

        if (
            !req.session.adminId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized. Please login."

            });

        }


        try {

            const id =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid application ID."

                });

            }


            const application =
                db.prepare(`
                    SELECT resume
                    FROM applications
                    WHERE id = ?
                `).get(id);


            if (
                !application ||
                !application.resume
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Resume not found."

                });

            }


            const resumePath =
                path.join(
                    resumeFolder,
                    application.resume
                );


            if (
                !fs.existsSync(
                    resumePath
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Resume file not found."

                });

            }


            res.download(
                resumePath,
                application.resume
            );

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to download resume."

            });

        }

    }
);


// =========================
// MULTER ERROR HANDLER
// =========================

app.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Resume size must be 5 MB or less."

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        if (
            error &&
            error.message ===
            "Only PDF, DOC and DOCX files are allowed."
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        next(error);

    }
);


// =========================
// SERVER
// =========================

const server =
    app.listen(
        PORT,
        "127.0.0.1",
        () => {

            console.log("");

            console.log(
                "================================"
            );

            console.log(
                " Internova Server"
            );

            console.log(
                "================================"
            );

            console.log("");

            console.log(
                `Server running at http://localhost:${PORT}`
            );

            console.log(
                "Server is ACTIVE..."
            );

            console.log("");

        }
    );


// =========================
// SERVER ERROR
// =========================

server.on(
    "error",
    (error) => {

        console.error("");

        console.error(
            "SERVER ERROR:"
        );

        console.error(error);

        console.error("");

    }
);


// =========================
// SERVER CLOSE
// =========================

server.on(
    "close",
    () => {

        console.log("");

        console.log(
            "WARNING: Server has been closed."
        );

        console.log("");

    }
);