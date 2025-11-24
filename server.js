const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb', charset: 'utf-8' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, charset: 'utf-8' }));

// تعيين الترميز الافتراضي
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname)));

// تقديم مكتبة XLSX من node_modules
app.get('/xlsx.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules/xlsx/dist/xlsx.full.min.js'));
});

// الوصول للملفات الثابتة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// مسار إرسال البريد الإلكتروني
app.post('/send-email', async (req, res) => {
    try {
        const { to, subject, message, from, appPassword } = req.body;
         console.log('بيانات الطلب:', req.body);
        // التحقق من البيانات
        if (!to || !subject || !message || !from || !appPassword) {
            return res.status(400).json({
                success: false,
                error: 'بيانات غير كاملة'
            });
        }

        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to) || !emailRegex.test(from)) {
            return res.status(400).json({
                success: false,
                error: 'بريد إلكتروني غير صحيح'
            });
        }

        // إنشاء transporter لـ Gmail مع دعم كامل للعربية
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: from,
                pass: appPassword
            },
            pool: {
                maxConnections: 1,
                maxMessages: 5
            }
        });

        // إعدادات البريد مع دعم كامل للعربية
        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
    ${message}
</body>
</html>`,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Mailer': 'DigitHub Emails'
            }
        };

        // إرسال البريد
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('خطأ في الإرسال:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'حدث خطأ في إرسال البريد'
                });
            }

            console.log('تم الإرسال:', info.response);
            res.json({
                success: true,
                message: 'تم إرسال البريد بنجاح',
                info: info.messageId
            });
        });

    } catch (error) {
        console.error('خطأ عام:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'حدث خطأ في معالجة الطلب',
            details: error.toString()
        });
    }
});

// معالج الأخطاء
app.use((err, req, res, next) => {
    console.error('خطأ غير متوقع:', err);
    res.status(500).json({
        success: false,
        error: 'حدث خطأ غير متوقع',
        details: err.message
    });
});

// بدء الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
    console.log('الرجاء فتح المتصفح والانتقال إلى http://localhost:' + PORT);
});
