const path = require('path');
const config = {
    dzy: {
        domain: 'https://www.duozhuayu.com',
        category_path: '/api/categories',
        booksDataPath: path.join(__dirname, '..', 'data/dzy/books.json'),
        categoryDataPath: path.join(__dirname, '..', 'data/dzy/category.json'),
        partBooksDataPath: path.join(__dirname, '..', 'data/dzy/partBooks.json'),
        exportPath: path.join(__dirname, '..', 'download/excel'),
    },
    category: {
        phone: 1,
        tablet: 2
    },
    /**
     * 返回或设置当前环镜
     */
    env: function () {
        global.$config = this;

        return global.$config;
    }
};

module.exports = config.env();