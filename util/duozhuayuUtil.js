const aesjs = require('aes-js');
const request = require('superagent');

// DES 加密
function desEncrypt (message, key)
{
    key = key.length >= 8 ? key.slice(0, 8) : key.concat('0'.repeat(8 - key.length));
    const keyHex = new Buffer(key);
    const cipher = crypto.createCipheriv('des-cfb', keyHex, keyHex);
    let c = cipher.update(message, 'utf8', 'base64');
    c += cipher.final('base64');
    return c
}

const encrypt = () =>
{
    const timestamp = Date.now();
    const userid = 0;
    const securityKey = Math.floor(1e8 * Math.random());

    const i = `${timestamp}:${userid}:${securityKey}`;
    let list = [];
    const e = encodeURI(i);
    for(let i=0; i<e.length; i++) {
        list.push(e.charCodeAt(i));
    }
    list = new Uint8Array(list);

    const a = [68, 107, 79, 108, 105, 87, 118, 70, 78, 82, 55, 67, 52, 87, 118, 82];
    // const a = [51, 80, 77, 71, 82, 81, 79, 50, 57, 69, 51, 54, 73, 68, 72, 56];
    const b = new Uint8Array([71, 81, 87, 75, 85, 69, 50, 67, 86, 71, 79, 79, 66, 75, 88, 85]);
    const key = new Uint8Array(a);

    const aesCfb = new aesjs.ModeOfOperation.cfb(key, b);
    const encryptedBytes = aesCfb.encrypt(list);
    const token = aesjs.utils.hex.fromBytes(encryptedBytes);

    return {
        timestamp,  userid, securityKey, token
    };
};

const getHeader = () =>
{
    const {timestamp,  userid, securityKey, token} = encrypt();
    return {
        'x-api-version': '0.0.3',
        'x-user-id': userid,
        'x-request-token': token,
        'x-security-key': securityKey,
        'x-timestamp': timestamp,
        'x-request-misc': {"platform":"browser"}
    };
};

exports.getHeader = getHeader;

/*
const getHeader1 = (q) => {
    return {
        'x-user-id': 0,
        'x-request-token': '0aa3785babfed094e8611d7935d7fe0838ae48151c321fb7',
        'x-security-key': Math.floor(1e8 * Math.random()),
        'x-timestamp': Date.now()
    };
};

const search = async (q) =>
{
    q = encodeURIComponent(q);
    const url = `https://www.duozhuayu.com/api/search?q=${q}&type=normal`;
    const result = await request.get(url).set(getHeader(q));
    console.log(result.text);
};

(async () => {
    await search('小说');
})();*/
