const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// افزایش حجم برای دریافت داده‌های سنگین
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// ---------------------------------------------------------
// ⚙️ تنظیمات اصلی و دیتابیس
// ---------------------------------------------------------
// مسیر دیسک در لیارا (بسیار مهم)
const MOUNT_POINT = "/app/data";
const DB_PATH = path.join(MOUNT_POINT, "database.json");

// 🔑 رمز عبور امنیتی پنل مدیریت (دقیقاً مثل گوگل شیت)
const ADMIN_TOKEN = "chamran_admin_2025_secret_key";

// 👥 لیست کلاس (۲۸ نفر) برای ثبت‌نام خودکار
const INITIAL_STUDENTS = [
    { u: "matin.abouei", p: "6104", n: "محمد متین ابوئی مهریزی" },
    { u: "parsa.parsa", p: "9884", n: "محمدپارسا پارسانیا" },
    { u: "amir.pourreza", p: "1162", n: "امیرمحمد پوررضایی" },
    { u: "salar.hosseini", p: "6706", n: "سید امیرسالار حسینی" },
    { u: "reza.hosseini", p: "7966", n: "سید محمد رضا حسینی" },
    { u: "amir.heydari", p: "8123", n: "سید امیر رضا حیدری" },
    { u: "mahan.khoda", p: "3552", n: "ماهان خدادادسریزدی" },
    { u: "abolfazl.dehghan", p: "6952", n: "امیر ابوالفضل دهقان منگابادی" },
    { u: "amirali.dehghan", p: "5492", n: "امیرعلی دهقانی زاده بغدادآباد" },
    { u: "taha.zare", p: "4688", n: "محمد طه زارع" },
    { u: "hossein.zare1", p: "1755", n: "محمدحسین زارع" },
    { u: "hossein.zare2", p: "3849", n: "محمد حسین زارع" },
    { u: "yasin.zare", p: "7144", n: "محمد یاسین زارع بیدکی" },
    { u: "amir.zare.bidaki", p: "5192", n: "امیر حسین زارع بیدکی" },
    { u: "taha.zare.kh", p: "1392", n: "محمد طه زارع خورمیزی" },
    { u: "milad.zare", p: "8419", n: "میلاد زارع زاده مهریزی" },
    { u: "amin.zare", p: "5513", n: "امین زارع زاده مهریزی" },
    { u: "sajad.zare", p: "8210", n: "سجاد زارع زاده مهریزی" },
    { u: "abolfazl.zare", p: "0778", n: "ابوالفضل زارع میرک آباد" },
    { u: "mahdi.zarein", p: "8556", n: "محمد مهدی زارعین" },
    { u: "amir.rahbar", p: "4225", n: "امیرحسین رهبرنیا" },
    { u: "ali.sangari", p: "2405", n: "علیرضا سنگری نژاد" },
    { u: "hasan.taba", p: "5835", n: "سیدحسن طباطبائی نیا" },
    { u: "mojtaba.ebadi", p: "9778", n: "مجتبی عبادی فر" },
    { u: "amir.kamalian", p: "3288", n: "امیرعلی کمالیان مهریزی" },
    { u: "yasin.mohsen", p: "8456", n: "سیدیاسین محسن زاده مهریزی" },
    { u: "reza.mousavi", p: "3689", n: "سید محمد رضا موسوی" },
    { u: "mostafa.valayati", p: "8896", n: "مصطفی ولایتی" }
];

// 🛠️ توابع کمکی خواندن و نوشتن دیتابیس
function readDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        }
    } catch (e) { console.error("خطا در خواندن دیتابیس:", e); }
    // ساختار پیش‌فرض اگر فایل نبود
    return { users: [], lessons: [], exams: [] };
}

function writeDB(data) {
    // فقط اگر دیسک وصل بود بنویس (جلوگیری از کرش)
    if (fs.existsSync(MOUNT_POINT)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } else {
        console.error("⚠️ دیسک پیدا نشد! اطلاعات ذخیره نمی‌شود.");
    }
}

// راه اندازی اولیه (مشابه setupDatabase و adminImportStudents در گوگل شیت)
function initDatabase() {
    if (fs.existsSync(MOUNT_POINT) && !fs.existsSync(DB_PATH)) {
        console.log("Creating new database...");
        const db = { users: [], lessons: [], exams: [] };
        
        // ثبت نام خودکار ۲۸ نفر
        INITIAL_STUDENTS.forEach(st => {
            db.users.push({
                u: st.u, p: st.p, n: st.n,
                // جیسون داخلی دقیقاً مثل فرمت گوگل شیت
                json: JSON.stringify({ xp: 0, rank: "🐣 نوآموز", completed: [], playback: {}, exams: {} }),
                xp: 0, lvl: 1, last: new Date().toLocaleString('fa-IR')
            });
        });
        writeDB(db);
        console.log("✅ دیتابیس ساخته شد و ۲۸ دانش‌آموز اضافه شدند.");
    }
}

// اجرای تابع ساخت دیتابیس در لحظه روشن شدن سرور
initDatabase();

// ==========================================================
// 🚀 روتر اصلی (API Gateway)
// ==========================================================

app.get("/", (req, res) => {
    if (fs.existsSync(MOUNT_POINT)) {
        res.send("<h1>💎 هسته مرکزی مدرسه چمران فعال است (دیسک متصل) ✅</h1>");
    } else {
        res.send("<h1>⚠️ خطا: دیسک متصل نیست!</h1>");
    }
});

app.post("/", (req, res) => {
    const { action, username, password, jsonData, admin_token, target_user, amount, op_type, lesson_id, exam_id, force_playback } = req.body;
    let db = readDB();

    // ----------------------------------------------------
    // 1️⃣ ورود دانش‌آموز (Login)
    // ----------------------------------------------------
    if (action === "login") {
        const user = db.users.find(u => u.u.toLowerCase() === String(username).toLowerCase() && u.p === String(password));
        
        if (user) {
            // چک کردن بن بودن (از داخل رشته جیسون)
            if (user.json && user.json.includes('"banned":true')) {
                return res.json({ status: 'fail', message: '⛔ حساب شما مسدود شده است. با معلم تماس بگیرید.' });
            }
            return res.json({ 
                status: 'success', 
                displayName: user.n, 
                jsonData: user.json // ارسال رشته جیسون (چون کلاینت انتظار رشته دارد)
            });
        }
        return res.json({ status: 'fail', message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // ----------------------------------------------------
    // 2️⃣ همگام‌سازی (Sync) - منطق هوشمند گوگل شیت
    // ----------------------------------------------------
    if (action === "sync" || action === "report") {
        const userIndex = db.users.findIndex(u => u.u.toLowerCase() === String(username).toLowerCase() && u.p === String(password));
        
        if (userIndex !== -1) {
            let user = db.users[userIndex];
            
            if (jsonData) {
                // تبدیل رشته‌های جیسون به آبجکت برای ترکیب
                let currentData = {};
                try { currentData = JSON.parse(user.json); } catch(e){}
                let newData = {};
                try { newData = JSON.parse(jsonData); } catch(e){}

                // --- [شروع سیستم هوشمند] ---
                
                // الف) آزمون‌ها (ترکیب)
                if (newData.exams) {
                    if (!currentData.exams) currentData.exams = {};
                    Object.assign(currentData.exams, newData.exams);
                }

                // ب) تیک‌های سبز (Completed) - استفاده از Set برای جلوگیری از تکرار
                let completedSet = new Set(currentData.completed || []);
                if (newData.completed && Array.isArray(newData.completed)) {
                    newData.completed.forEach(id => completedSet.add(String(id)));
                }
                currentData.completed = Array.from(completedSet);

                // ج) زمان پخش (Playback)
                if (newData.playback) {
                    if (!currentData.playback) currentData.playback = {};
                    for (let vidId in newData.playback) {
                        let sVidId = String(vidId);
                        let oldTime = parseFloat(currentData.playback[sVidId]) || 0;
                        let newTime = parseFloat(newData.playback[sVidId]) || 0;

                        // شرط حیاتی گوگل شیت: اگر force_playback بود یعنی جریمه است
                        if (force_playback === true) {
                            currentData.playback[sVidId] = newTime;
                        } else {
                            currentData.playback[sVidId] = Math.max(oldTime, newTime);
                        }
                    }
                }

                // د) امتیاز و رنک (بیشترین مقدار)
                let oldXP = currentData.xp || 0;
                let newXP = newData.xp || 0;
                currentData.xp = Math.max(oldXP, newXP);
                if (newData.rank) currentData.rank = newData.rank;
                // --- [پایان سیستم هوشمند] ---

                // ذخیره مجدد به صورت رشته جیسون
                user.json = JSON.stringify(currentData);
                user.xp = currentData.xp; // آپدیت ستون XP برای نمایش در پنل ادمین
                user.last = new Date().toLocaleString('fa-IR');
                
                db.users[userIndex] = user;
                writeDB(db);
            }
            return res.json({ status: 'success' });
        }
        return res.json({ status: 'fail', message: 'User not found' });
    }

    // ----------------------------------------------------
    // 3️⃣ پنل مدیریت (Admin)
    // ----------------------------------------------------
    
    // دریافت لیست همه
    if (action === "get_all_users") {
        if (admin_token !== ADMIN_TOKEN) return res.json({ status: "error", message: "عدم دسترسی" });

        // تبدیل آرایه درس‌ها و آزمون‌ها به فرمت آبجکت (متا) که ادمین گوگل شیت انتظار دارد
        const examsMeta = {};
        db.exams.forEach(ex => { examsMeta[ex.id] = ex.title; });
        
        const lessonsMeta = {};
        db.lessons.forEach(l => { lessonsMeta[l.id] = l.title; });

        return res.json({ 
            status: "success", 
            users: db.users, 
            meta: { exams: examsMeta, lessons: lessonsMeta } 
        });
    }

    // عملیات مدیریتی
    if (action === "admin_op") {
        if (admin_token !== ADMIN_TOKEN) return res.json({ status: "error", message: "عدم دسترسی" });
        
        const uIndex = db.users.findIndex(u => u.u.toLowerCase() === String(target_user).toLowerCase());
        if (uIndex === -1) return res.json({ status: "error", message: "کاربر یافت نشد" });
        
        let user = db.users[uIndex];
        let d = JSON.parse(user.json || "{}");

        if (op_type === "give_xp") {
            d.xp = (d.xp || 0) + parseInt(amount);
            user.xp = d.xp;
        } 
        else if (op_type === "ban_user") d.banned = true;
        else if (op_type === "unban_user") delete d.banned;
        else if (op_type === "reset_video") {
            if (d.completed) d.completed = d.completed.filter(id => String(id) !== String(req.body.video_id));
            if (d.playback) delete d.playback[String(req.body.video_id)];
        }
        else if (op_type === "reset_exam") {
            if (d.exams) delete d.exams[req.body.exam_id];
        }

        user.json = JSON.stringify(d);
        db.users[uIndex] = user;
        writeDB(db);
        return res.json({ status: "success", new_json: d });
    }

    // حذف درس سراسری
    if (action === "delete_lesson_global") {
        if (admin_token !== ADMIN_TOKEN) return res.json({ status: "error", message: "عدم دسترسی" });
        
        db.lessons = db.lessons.filter(l => String(l.id) !== String(lesson_id));

        db.users.forEach(u => {
            let d = JSON.parse(u.json || "{}");
            let changed = false;
            if (d.completed && d.completed.includes(String(lesson_id))) {
                d.completed = d.completed.filter(id => id !== String(lesson_id));
                changed = true;
            }
            if (d.playback && d.playback[String(lesson_id)]) {
                delete d.playback[String(lesson_id)];
                changed = true;
            }
            if (changed) u.json = JSON.stringify(d);
        });
        writeDB(db);
        return res.json({ status: "success", message: "Lesson deleted" });
    }

    // حذف آزمون سراسری
    if (action === "delete_exam_global") {
        if (admin_token !== ADMIN_TOKEN) return res.json({ status: "error", message: "عدم دسترسی" });

        db.exams = db.exams.filter(e => String(e.id) !== String(exam_id));

        db.users.forEach(u => {
            let d = JSON.parse(u.json || "{}");
            if (d.exams && d.exams[String(exam_id)]) {
                delete d.exams[String(exam_id)];
                u.json = JSON.stringify(d);
            }
        });
        writeDB(db);
        return res.json({ status: "success", message: "Exam deleted" });
    }

    // ----------------------------------------------------
    // 4️⃣ ذخیره محتوا (درس و آزمون جدید)
    // ----------------------------------------------------
    if (action === "save_lesson") { // مشابه saveLesson در گوگل شیت
        // پارامترها: title, link, attach (string joined by comma)
        const attachStr = req.body.attach || ""; 
        db.lessons.push({
            id: Math.floor(100000 + Math.random() * 900000),
            title: req.body.title.replace(/,/g, ' -'),
            link: req.body.link,
            attach: attachStr // ذخیره رشته فایل‌ها برای سازگاری
        });
        writeDB(db);
        return res.json({ status: "success" });
    }

    if (action === "save_exam") { // مشابه saveExam در گوگل شیت
        db.exams.push({
            id: 'EX-' + Math.floor(1000 + Math.random() * 9000),
            title: req.body.title,
            time: req.body.time,
            pass: req.body.pass,
            questions: req.body.questions // کل آرایه سوالات
        });
        writeDB(db);
        return res.json({ status: "success" });
    }

    res.json({ status: "error", message: "دستور نامعتبر" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});