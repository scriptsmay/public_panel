/*
 * @Author: Jerrykuku https://github.com/jerrykuku
 * @Date: 2021-1-8
 * @Version: v0.0.2
 * @thanks: FanchangWang https://github.com/FanchangWang
 */

let express = require('express')
let session = require('express-session')
let compression = require('compression')
let got = require('got')
let path = require('path')
let fs = require('fs')
let { execSync, exec } = require('child_process')

let rootPath = path.resolve(__dirname, '..')
// cookie.sh 文件所在目录
let ckFile = path.join(rootPath, 'config/cookie.sh')
// config.sh 文件所在目录
let confFile = path.join(rootPath, 'config/config.sh')
// config.sh.sample 文件所在目录
let sampleFile = path.join(rootPath, 'sample/config.sh.sample')
// crontab.list 文件所在目录
let crontabFile = path.join(rootPath, 'config/crontab.list')
// config.sh 文件备份目录
let confBakDir = path.join(rootPath, 'config/bak/')
// auth.json 文件目录
let authConfigFile = path.join(rootPath, 'config/auth.json')
// Share Code 文件目录
let shareCodeDir = path.join(rootPath, 'log/jd_get_share_code/')
// diy.sh 文件目录
let diyFile = path.join(rootPath, 'config/diy.sh')
// 日志目录
let logPath = path.join(rootPath, 'log/')
// 脚本目录
let ScriptsPath = path.join(rootPath, 'scripts/')

let authError = '错误的用户名密码，请重试'
let loginFaild = '请先登录!'

let configString = 'config usrconfig sample crontab shareCode diy'

let s_token,
    cookies,
    guid,
    lsid,
    lstoken,
    okl_token,
    token,
    userCookie = ''

function praseSetCookies(response) {
    s_token = response.body.s_token
    guid = response.headers['set-cookie'][0]
    guid = guid.substring(guid.indexOf('=') + 1, guid.indexOf(';'))
    lsid = response.headers['set-cookie'][2]
    lsid = lsid.substring(lsid.indexOf('=') + 1, lsid.indexOf(';'))
    lstoken = response.headers['set-cookie'][3]
    lstoken = lstoken.substring(lstoken.indexOf('=') + 1, lstoken.indexOf(';'))
    cookies = 'guid=' + guid + '; lang=chs; lsid=' + lsid + '; lstoken=' + lstoken + '; '
}

function getCookie(response) {
    let TrackerID = response.headers['set-cookie'][0]
    TrackerID = TrackerID.substring(TrackerID.indexOf('=') + 1, TrackerID.indexOf(';'))
    let pt_key = response.headers['set-cookie'][1]
    pt_key = pt_key.substring(pt_key.indexOf('=') + 1, pt_key.indexOf(';'))
    let pt_pin = response.headers['set-cookie'][2]
    pt_pin = pt_pin.substring(pt_pin.indexOf('=') + 1, pt_pin.indexOf(';'))
    let pt_token = response.headers['set-cookie'][3]
    pt_token = pt_token.substring(pt_token.indexOf('=') + 1, pt_token.indexOf(';'))
    let pwdt_id = response.headers['set-cookie'][4]
    pwdt_id = pwdt_id.substring(pwdt_id.indexOf('=') + 1, pwdt_id.indexOf(';'))
    let s_key = response.headers['set-cookie'][5]
    s_key = s_key.substring(s_key.indexOf('=') + 1, s_key.indexOf(';'))
    let s_pin = response.headers['set-cookie'][6]
    s_pin = s_pin.substring(s_pin.indexOf('=') + 1, s_pin.indexOf(';'))
    cookies =
        'TrackerID=' +
        TrackerID +
        '; pt_key=' +
        pt_key +
        '; pt_pin=' +
        pt_pin +
        '; pt_token=' +
        pt_token +
        '; pwdt_id=' +
        pwdt_id +
        '; s_key=' +
        s_key +
        '; s_pin=' +
        s_pin +
        '; wq_skey='
    let userCookie = 'pt_key=' + pt_key + ';pt_pin=' + pt_pin + ';'
    console.log('\n############  登录成功，获取到 Cookie  #############\n')
    console.log('Cookie1="' + userCookie + '"\n')
    console.log('\n####################################################\n')
    return userCookie
}

async function step1() {
    try {
        s_token, cookies, guid, lsid, lstoken, okl_token, (token = '')
        let timeStamp = new Date().getTime()
        let url =
            'https://plogin.m.jd.com/cgi-bin/mm/new_login_entrance?lang=chs&appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=' +
            timeStamp +
            '&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport'
        const response = await got(url, {
            responseType: 'json',
            headers: {
                Connection: 'Keep-Alive',
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'zh-cn',
                Referer:
                    'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=' +
                    timeStamp +
                    '&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
                'User-Agent':
                    'jdapp;android;9.3.5;10;2346663656561603-4353564623932316;network/wifi;model/ONEPLUS A5010;addressid/138709979;aid/2dfceea045ed292a;oaid/;osVer/29;appBuild/86390;partner/jingdong;eufv/1;Mozilla/5.0 (Linux; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36',
                Host: 'plogin.m.jd.com'
            }
        })

        praseSetCookies(response)
    } catch (error) {
        cookies = ''
        console.log(error.response.body)
    }
}

async function step2() {
    try {
        if (cookies == '') {
            return 0
        }
        let timeStamp = new Date().getTime()
        let url = 'https://plogin.m.jd.com/cgi-bin/m/tmauthreflogurl?s_token=' + s_token + '&v=' + timeStamp + '&remember=true'
        const response = await got.post(url, {
            responseType: 'json',
            json: {
                lang: 'chs',
                appid: 300,
                returnurl:
                    'https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
                    timeStamp +
                    '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action',
                source: 'wq_passport'
            },
            headers: {
                Connection: 'Keep-Alive',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                Accept: 'application/json, text/plain, */*',
                Cookie: cookies,
                Referer:
                    'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
                    timeStamp +
                    '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
                'User-Agent':
                    'jdapp;android;9.3.5;10;2346663656561603-4353564623932316;network/wifi;model/ONEPLUS A5010;addressid/138709979;aid/2dfceea045ed292a;oaid/;osVer/29;appBuild/86390;partner/jingdong;eufv/1;Mozilla/5.0 (Linux; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36',
                Host: 'plogin.m.jd.com'
            }
        })
        token = response.body.token
        okl_token = response.headers['set-cookie'][0]
        okl_token = okl_token.substring(okl_token.indexOf('=') + 1, okl_token.indexOf(';'))
        let qrUrl = 'https://plogin.m.jd.com/cgi-bin/m/tmauth?appid=300&client_type=m&token=' + token
        return qrUrl
    } catch (error) {
        console.log(error.response.body)
        return 0
    }
}

let i = 0

async function checkLogin() {
    try {
        if (cookies == '') {
            return 0
        }
        let timeStamp = new Date().getTime()
        let url = 'https://plogin.m.jd.com/cgi-bin/m/tmauthchecktoken?&token=' + token + '&ou_state=0&okl_token=' + okl_token
        const response = await got.post(url, {
            responseType: 'json',
            form: {
                lang: 'chs',
                appid: 300,
                returnurl:
                    'https://wqlogin2.jd.com/passport/LoginRedirect?state=1100399130787&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action',
                source: 'wq_passport'
            },
            headers: {
                Referer:
                    'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
                    timeStamp +
                    '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
                Cookie: cookies,
                Connection: 'Keep-Alive',
                'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
                Accept: 'application/json, text/plain, */*',
                'User-Agent':
                    'jdapp;android;9.3.5;10;2346663656561603-4353564623932316;network/wifi;model/ONEPLUS A5010;addressid/138709979;aid/2dfceea045ed292a;oaid/;osVer/29;appBuild/86390;partner/jingdong;eufv/1;Mozilla/5.0 (Linux; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36'
            }
        })

        return response
    } catch (error) {
        console.log(error.response.body)
        let res = {}
        res.body = { check_ip: 0, errcode: 222, message: '出错' }
        res.headers = {}
        return res
    }
}

/**
 * 检查 config.sh 以及 config.sh.sample 文件是否存在
 */
function checkConfigFile() {
    if (!fs.existsSync(sampleFile)) {
        console.error('脚本启动失败，config.sh.sample 文件不存在！')
        process.exit(1)
    }
}

/**
 * 检查 config/bak/ 备份目录是否存在，不存在则创建
 */
function mkdirConfigBakDir() {
    if (!fs.existsSync(confBakDir)) {
        fs.mkdirSync(confBakDir)
    }
}

/**
 * 备份 config.sh 文件
 */
function bakConfFile(file) {
    mkdirConfigBakDir()
    let date = new Date()
    let bakConfFile =
        confBakDir +
        file +
        '_' +
        date.getFullYear() +
        '-' +
        date.getMonth() +
        '-' +
        date.getDay() +
        '-' +
        date.getHours() +
        '-' +
        date.getMinutes() +
        '-' +
        date.getMilliseconds()
    let oldConfContent = ''
    switch (file) {
        case 'cookie.sh':
            oldConfContent = getFileContentByName(ckFile)
            fs.writeFileSync(bakConfFile, oldConfContent)
            break
        case 'config.sh':
            oldConfContent = getFileContentByName(confFile)
            fs.writeFileSync(bakConfFile, oldConfContent)
            break
        case 'crontab.list':
            oldConfContent = getFileContentByName(crontabFile)
            fs.writeFileSync(bakConfFile, oldConfContent)
            break
        case 'diy.sh':
            oldConfContent = getFileContentByName(diyFile)
            fs.writeFileSync(bakConfFile, oldConfContent)
            break
        default:
            break
    }
}

/**
 * 将 post 提交内容写入 config.sh 文件（同时备份旧的 config.sh 文件到 bak 目录）
 * @param content
 */
function saveNewConf(file, content) {
    bakConfFile(file)
    switch (file) {
        case 'cookie.sh':
            fs.writeFileSync(ckFile, content)
            break
        case 'config.sh':
            fs.writeFileSync(confFile, content)
            break
        case 'crontab.list':
            fs.writeFileSync(crontabFile, content)
            execSync('crontab ' + crontabFile)
            break
        case 'diy.sh':
            fs.writeFileSync(diyFile, content)
            break
        default:
            break
    }
}

/**
 * 获取文件内容
 * @param fileName 文件路径
 * @returns {string}
 */
function getFileContentByName(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName, 'utf8')
    }
    return ''
}

/**
 * 获取目录中最后修改的文件的路径
 * @param dir 目录路径
 * @returns {string} 最新文件路径
 */
function getLastModifyFilePath(dir) {
    let filePath = ''

    if (fs.existsSync(dir)) {
        let lastmtime = 0

        let arr = fs.readdirSync(dir)

        arr.forEach(function (item) {
            let fullpath = path.join(dir, item)
            let stats = fs.statSync(fullpath)
            if (stats.isFile()) {
                if (stats.mtimeMs >= lastmtime) {
                    filePath = fullpath
                }
            }
        })
    }
    return filePath
}

let app = express()
// gzip压缩
app.use(compression({ level: 6, filter: shouldCompress }))

function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}

app.use(
    session({
        secret: 'secret',
        name: `connect.${Math.random()}`,
        resave: true,
        saveUninitialized: true
    })
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

/**
 * 登录页面
 */
app.get('/', function (request, response) {
    if (request.session.loggedin) {
        response.redirect('./home')
    } else {
        response.sendFile(path.join(__dirname + '/public/auth.html'))
    }
})

/**
 * 用户名密码
 */
app.get('/changepwd', function (request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/public/pwd.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * terminal
 */
app.get('/terminal', function (request, response) {
    if (request.session.loggedin) {
        response.sendFile(path.join(__dirname + '/public/terminal.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 获取二维码链接
 */

app.get('/qrcode', function (request, response) {
    if (request.session.loggedin) {
        ;(async () => {
            try {
                await step1()
                const qrurl = await step2()
                if (qrurl != 0) {
                    response.send({ err: 0, qrcode: qrurl })
                } else {
                    response.send({ err: 1, msg: '错误' })
                }
            } catch (err) {
                response.send({ err: 1, msg: err })
            }
        })()
    } else {
        response.send({ err: 1, msg: loginFaild })
    }
})

/**
 * 获取返回的cookie信息
 */

app.get('/cookie', function (request, response) {
    if (request.session.loggedin && cookies != '') {
        ;(async () => {
            try {
                const cookie = await checkLogin()
                if (cookie.body.errcode == 0) {
                    let ucookie = getCookie(cookie)
                    response.send({ err: 0, cookie: ucookie })
                } else {
                    response.send({ err: cookie.body.errcode, msg: cookie.body.message })
                }
            } catch (err) {
                response.send({ err: 1, msg: err })
            }
        })()
    } else {
        response.send({ err: 1, msg: loginFaild })
    }
})

/**
 * 获取各种配置文件api
 */

app.get('/api/config/:key', function (request, response) {
    if (request.session.loggedin) {
        if (configString.indexOf(request.params.key) > -1) {
            switch (request.params.key) {
                case 'config':
                    content = getFileContentByName(confFile)
                    break
                case 'usrconfig':
                    content = getFileContentByName(ckFile)
                    break
                case 'sample':
                    content = getFileContentByName(sampleFile)
                    break
                case 'crontab':
                    content = getFileContentByName(crontabFile)
                    break
                case 'shareCode':
                    let shareCodeFile = getLastModifyFilePath(shareCodeDir)
                    content = getFileContentByName(shareCodeFile)
                    break
                case 'diy':
                    content = getFileContentByName(diyFile)
                    break
                default:
                    break
            }
            response.setHeader('Content-Type', 'text/plain')
            response.send(content)
        } else {
            response.send('no config')
        }
    } else {
        response.send(loginFaild)
    }
})

/**
 * 首页
 */
app.get('/home', function (request, response) {
    if (request.session.loggedin) {
        if (request.session.role == 'admin') {
            response.sendFile(path.join(__dirname + '/public/home.html'))
        }
        if (request.session.role == 'guest') {
            response.sendFile(path.join(__dirname + '/public/cookie.html'))
        }

    } else {
        response.redirect('/')
    }
})

/**
 * 配置页面
 */
app.get('/usrconfig', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/usrconfig.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 对比 配置页面
 */
app.get('/diff', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/diff.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * Share Code 页面
 */
app.get('/shareCode', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/shareCode.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * crontab 配置页面
 */
app.get('/crontab', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/crontab.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 自定义脚本 页面
 */
app.get('/diy', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/diy.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 手动执行脚本 页面
 */
app.get('/run', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/run.html'))
    } else {
        response.redirect('/')
    }
})

app.post('/runCmd', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        const cmd = `cd ${rootPath};` + request.body.cmd
        const delay = request.body.delay || 0
        // console.log('before exec');
        // exec maxBuffer 20MB
        exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
            // console.log(error, stdout, stderr);
            // 根据传入延时返回数据，有时太快会出问题
            setTimeout(() => {
                if (error) {
                    console.error(`执行的错误: ${error}`)
                    response.send({ err: 1, msg: stdout ? `${stdout}${error}` : `${error}` })
                    return
                }

                if (stdout) {
                    // console.log(`stdout: ${stdout}`)
                    response.send({ err: 0, msg: `${stdout}` })
                    return
                }

                if (stderr) {
                    console.error(`stderr: ${stderr}`)
                    response.send({ err: 1, msg: `${stderr}` })
                    return
                }

                response.send({ err: 0, msg: '执行结束，无结果返回。' })
            }, delay)
        })
    } else {
        response.redirect('/')
    }
})

/**
 * 使用jsName获取最新的日志
 */
app.get('/runLog/:jsName', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        const jsName = request.params.jsName
        let shareCodeFile = getLastModifyFilePath(path.join(rootPath, `log/${jsName}/`))
        if (jsName === 'rm_log') {
            shareCodeFile = path.join(rootPath, `log/${jsName}.log`)
        }

        if (shareCodeFile) {
            const content = getFileContentByName(shareCodeFile)
            response.setHeader('Content-Type', 'text/plain')
            response.send(content)
        } else {
            response.send('no logs')
        }
    } else {
        response.send(loginFaild)
    }
})

/**
 * auth
 */
app.post('/auth', function (request, response) {
    let username = request.body.username
    let password = request.body.password
    fs.readFile(authConfigFile, 'utf8', function (err, data) {
        if (err) console.log(err)
        let con = JSON.parse(data)
        if (username && password) {
            if (username == con.user && password == con.password) {
                request.session.loggedin = true
                request.session.username = username
                request.session.role = 'admin'
                response.send({ err: 0 })
            } else if (username == 'member' && password == con.password) {
                // 普通用户
                request.session.loggedin = true
                request.session.role = 'guest'
                request.session.username = username
                response.send({ err: 0 })
            } else {
                response.send({ err: 1, msg: authError })
                //setTimeout(function() { callback(null); }, 8000);
            }
        } else {
            response.send({ err: 1, msg: '请输入用户名密码!' })
        }
    })
})

/**
 * change pwd
 */
app.post('/changepass', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        let username = request.body.username
        let password = request.body.password
        let config = {
            user: username,
            password: password
        }
        if (username && password) {
            fs.writeFile(authConfigFile, JSON.stringify(config), function (err) {
                if (err) {
                    response.send({ err: 1, msg: '写入错误请重试!' })
                } else {
                    response.send({ err: 0, msg: '更新成功!' })
                }
            })
        } else {
            response.send({ err: 1, msg: '请输入用户名密码!' })
        }
    } else {
        response.send(loginFaild)
    }
})

/**
 * change pwd
 */
app.get('/logout', function (request, response) {
    request.session.destroy()
    response.redirect('/')
})

/**
 * save config
 */

app.post('/api/save', function (request, response) {
    if (request.session.loggedin) {
        let postContent = request.body.content
        let postfile = request.body.name
        saveNewConf(postfile, postContent)
        response.send({ err: 0, title: '保存成功! ', msg: '将自动刷新页面' })
    } else {
        response.send({ err: 1, title: '保存失败! ', msg: loginFaild })
    }
})

/**
 * 日志查询 页面
 */
app.get('/log', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/tasklog.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 日志列表
 */
app.get('/api/logs', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        let fileList = fs.readdirSync(logPath, 'utf-8')
        let dirs = []
        let rootFiles = []
        for (let i = 0; i < fileList.length; i++) {
            let stat = fs.lstatSync(logPath + fileList[i])
            // 是目录，需要继续
            if (stat.isDirectory()) {
                let fileListTmp = fs.readdirSync(logPath + '/' + fileList[i], 'utf-8')
                fileListTmp.reverse()
                let dirMap = {
                    dirName: fileList[i],
                    files: fileListTmp
                }
                dirs.push(dirMap)
            } else {
                rootFiles.push(fileList[i])
            }
        }

        dirs.push({
            dirName: '@',
            files: rootFiles
        })
        let result = { dirs }
        response.send(result)
    } else {
        response.redirect('/')
    }
})

/**
 * 日志文件
 */
app.get('/api/logs/:dir/:file', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        let filePath
        if (request.params.dir === '@') {
            filePath = logPath + request.params.file
        } else {
            filePath = logPath + request.params.dir + '/' + request.params.file
        }
        let content = getFileContentByName(filePath)
        response.setHeader('Content-Type', 'text/plain')
        response.send(content)
    } else {
        response.redirect('/')
    }
})

/**
 * 查看脚本 页面
 */
app.get('/viewScripts', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        response.sendFile(path.join(__dirname + '/public/viewScripts.html'))
    } else {
        response.redirect('/')
    }
})

/**
 * 脚本列表
 */
app.get('/api/scripts', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        let fileList = fs.readdirSync(ScriptsPath, 'utf-8')
        let dirs = []
        let rootFiles = []
        let excludeRegExp = /(git)|(node_modules)|(icon)/
        for (let i = 0; i < fileList.length; i++) {
            let stat = fs.lstatSync(ScriptsPath + fileList[i])
            // 是目录，需要继续
            if (stat.isDirectory()) {
                let fileListTmp = fs.readdirSync(ScriptsPath + '/' + fileList[i], 'utf-8')
                fileListTmp.reverse()

                if (excludeRegExp.test(fileList[i])) {
                    continue
                }

                let dirMap = {
                    dirName: fileList[i],
                    files: fileListTmp
                }
                dirs.push(dirMap)
            } else {
                if (excludeRegExp.test(fileList[i])) {
                    continue
                }

                rootFiles.push(fileList[i])
            }
        }

        dirs.push({
            dirName: '@',
            files: rootFiles
        })
        let result = { dirs }
        response.send(result)
    } else {
        response.redirect('/')
    }
})

/**
 * 脚本文件
 */
app.get('/api/scripts/:dir/:file', function (request, response) {
    if (request.session.loggedin && request.session.role == 'admin') {
        let filePath
        if (request.params.dir === '@') {
            filePath = ScriptsPath + request.params.file
        } else {
            filePath = ScriptsPath + request.params.dir + '/' + request.params.file
        }
        let content = getFileContentByName(filePath)
        response.setHeader('Content-Type', 'text/plain')
        response.send(content)
    } else {
        response.redirect('/')
    }
})


const reg = /Cookie\d+="(.+)"/
const regex = /Cookie\d+="(.+)"/g
const blockReg = /TempBlockCookie="(.+)"/g

/**
 * 通过账户校验查询当前的cookieList
 */
app.get('/api/cookies/:username/:password', (request, response) => {
    confFile
    let username = request.params.username
    let password = request.params.password
    fs.readFile(authConfigFile, 'utf8', function (err, data) {
        if (err) console.log(err)
        let con = JSON.parse(data)
        if (username && password) {
            if (username == con.user && password == con.password) {
                const confContent = fs.readFileSync(confFile, 'utf8')
                const list = (confContent.match(regex) || []).map(str => {
                    return {
                        cookie: str.replace(reg, "$1"),
                        status: true
                    }
                }) || []
                const blocks = (confContent.match(blockReg) || [])
                if (blocks && blocks.length) {
                    let block = blocks[0].replace(/TempBlockCookie="(.+)"/, '$1')
                    if (block) {
                        const blist = block.split(' ').map(i => parseInt(i))
                        blist.forEach(i => {
                            list[i - 1].status = false
                        })
                    }
                }
                response.send({ err: 0, list })
            } else {
                response.send({ err: 1, msg: authError })
            }
        } else {
            response.send({ err: 1, msg: '请输入用户名密码!' })
        }
    })
})

checkConfigFile()

app.listen(5678, () => {
    console.log('应用正在监听 5678 端口!')
})
