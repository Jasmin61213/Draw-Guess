const express = require('express');
const router = express.Router();

const {pool} = require('../model');

require('dotenv').config();

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

router.use(bodyParser.json());

router.post('/login',urlencodedParser,async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try{
        if (email == '' || password == ''){
            res.status(400).json({'error':true,'message':'請輸入帳號、密碼'});
        }else{
            let [[checkEmail]] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
            if (checkEmail){
                if(bcrypt.compareSync(password, checkEmail.password)){
                    req.session.user = checkEmail.username;
                    res.status(200).json({'ok':true});
                }else{
                    res.status(400).json({'error':true,'message':'密碼輸入錯誤'});
                }
            }else{
                res.status(400).json({'error':true,'message':'沒有此帳號'});
            };
        };
    }catch{
        res.status(500).json({error:true})
    };
});

router.post('/signup',async(req, res) => {
    const username = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const hash = bcrypt.hashSync(password, salt);
    try{
        let [[checkUsername]] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
        if (email == '' || password == '' || username == ''){
            res.status(400).json({'error':true,'message':'請輸入資料'});
        }else if (username.length > 7) {
            res.status(400).json({'error':true,'message':'暱稱不得大於八個字'});
        }else if (checkUsername) {
            res.status(400).json({'error':true,'message':'此暱稱已有人使用'});
        }else{
            const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            const isEmailValid = emailRegex.test(email);
            if (isEmailValid){
                const [[user]] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
                if (!user){
                    const postUser = await pool.execute('INSERT INTO user (username,email,password) VALUES (?,?,?)', [username,email,hash]);
                    res.status(200).json({'ok':true});
                }else{
                    res.status(400).json({'error':true,'message':'此帳號重複註冊'});
                };
            }else{
                res.status(400).json({'error':true,'message':'請輸入正確信箱格式'});
            };
        };
    }catch{
        return res.status(500).json({'error':true,'message':'伺服器錯誤'})
    };
});

router.get('/getLogin',async(req, res) => {
    const user = req.session.user;
    if (typeof(user) == 'undefined'){
        res.status(400).json({'error':true});
    }else{
        res.status(200).json({
            'ok':true,
            'user':user
        });
    };
});

router.delete('/logout',async(req, res) => {
    req.session.destroy();
    res.status(200).json({
        'ok':true,
    });
});

router.post('/changeName',urlencodedParser,async(req, res) => {
    const oldname = req.body.oldName;
    const newname = req.body.newName;
    try{
        if (newname.length > 7){
            res.status(400).json({error:true,'message':'暱稱不能大於八個字'})
        }else{
            let [[checkUsername]] = await pool.query('SELECT * FROM user WHERE username = ?', [oldname]);
            if (checkUsername){
                res.status(400).json({'error':true,'message':'此暱稱已有人使用'});
            }else{
                const changeName = await pool.execute('UPDATE user SET username= ? WHERE username= ?', [newname, oldname]);
                req.session.user = newname;
                res.status(200).json({'ok':true,'user':newname});
            };
        };
    }catch{
        res.status(500).json({error:true})
    };
});

module.exports = router;