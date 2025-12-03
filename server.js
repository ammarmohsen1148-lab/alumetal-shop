const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database('./shop.db');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// إنشاء الجدول (يدعم تخزين صور متعددة كـ نص JSON)
db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    description TEXT,
    images TEXT, 
    mainImage TEXT
)`);

// إعداد التخزين
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- الروابط (Routes) ---

// الصفحة الرئيسية
app.get('/', (req, res) => {
    db.all("SELECT * FROM projects ORDER BY id DESC", (err, rows) => {
        res.render('index', { projects: rows });
    });
});

// صفحة التفاصيل
app.get('/product/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
        if (err || !row) return res.redirect('/');
        row.imagesList = JSON.parse(row.images); 
        res.render('details', { product: row });
    });
});

// صفحة الأدمن
app.get('/admin-panel', (req, res) => {
    res.render('admin');
});

// حفظ المشروع
app.post('/add-project', upload.array('photos', 10), (req, res) => {
    const { title, description, category } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) return res.send("Please upload images");

    const imageNames = files.map(f => f.filename);
    const mainImage = imageNames[0]; 
    const imagesJSON = JSON.stringify(imageNames); 

    db.run(`INSERT INTO projects (title, category, description, images, mainImage) VALUES (?, ?, ?, ?, ?)`, 
        [title, category, description, imagesJSON, mainImage], (err) => {
            if(err) console.log(err);
            res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));