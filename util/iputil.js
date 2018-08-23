const execSync = require('child_process').execSync;

const changeIP = async (failCount) => {
    try {
        execSync('ifdown ppp0 && ifup ppp0');
    }catch (e) {
        console.log(e);
        if(!failCount) {
            failCount = 0;
        }
        return await changeIP(++failCount);
    }
};

exports.changeIP = changeIP;