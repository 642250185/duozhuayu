const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const request = require('superagent');
const config = require('./config');
const sleep = require('js-sleep/js-sleep');
const {getHeader} = require('./util/duozhuayuUtil');
const {formatDate} = require('./util/dateUtil');
const xlsx = require('node-xlsx').default;

const {domain, category_path, categoryDataPath, booksDataPath, exportPath} = config.dzy;

const TYPE = {
    BOOK: 'book',
    CATEGORIES: 'categories'
};

const getPrice = async (goods) =>
{
    try {
        let price = 0;
        if(goods.length === 1){
            price = (goods[0].price / 100).toFixed(2);
        } else if(goods.length === 2){
            for(let pitem of goods){
                if(pitem.condition === "fine" || pitem.condition === "medium"){
                    price = pitem.price;
                }
            }
            price = (price / 100).toFixed(2);
        } else {
            for(let pitem of goods){
                if(pitem.condition === "medium"){
                    price = pitem.price;
                }
            }
            price = (price / 100).toFixed(2);
        }
        return price;
    } catch (e) {
        console.error(e);
        return 0
    }
};

let count = 0;
const getBookInfoByCategoryId = async (groupId, group ,categoryId, categroyName, page, categoryList) =>
{
    try {
        let path = page;
        if(count === 0){
            categoryList = [];
            path = `${domain}${category_path}/${categoryId}/items`;
        }
        await sleep(1000 * 2);
        let result = await request.get(path).set(getHeader());
        result = JSON.parse(result.text);
        const {paging, data} = result;
        const books = [];
        for(let obj of data){
            if(obj.type === TYPE.BOOK){
                const id = obj.item.id;                     // 书籍ID
                const title = obj.item.title;               // 书籍名称
                const publisher = obj.item.publisher;       // 书籍出版社
                const isbn = obj.item.isbn13;               // 书籍ISBN
                const doubanRating = obj.item.doubanRating; // 书籍在豆瓣的评分
                const author = obj.item.author.join(" ");   // 书籍的作者
                const goods = obj.item.goods;
                const price = await getPrice(goods);        // 获取书籍的价格
                books.push({
                    groupId, group, categoryId, categroyName,
                    id, title, publisher, isbn, doubanRating,
                    author, price
                })
            }
        }
        categoryList = categoryList.concat(books);
        if(paging.next){
            count++;
            console.info(`${categroyName} 分类下的第 ${count} 页`);
            const page = paging.next;
            return await getBookInfoByCategoryId(groupId, group, categoryId, categroyName, page, categoryList);
        } else {
            count = 0;
            return categoryList;
        }
    } catch (e) {
        console.info(e);
        count = 0;
        return [];
    }
};


const exportExcel = async (resultList, categroyName) =>
{
    try {
        const dzyBookList = [['组ID', '组名称', '类别ID', '类别名称','书籍ID','书籍名称','出版社','ISBN','豆瓣评分','作者','价格']];
        for(let item of resultList){
            const row = [];
            row.push(item.groupId);
            row.push(item.group);
            row.push(item.categoryId);
            row.push(item.categroyName);
            row.push(item.id);
            row.push(item.title);
            row.push(item.publisher);
            row.push(item.isbn);
            row.push(item.doubanRating);
            row.push(item.author);
            row.push(item.price);
            dzyBookList.push(row);
        }
        const currentTime = formatDate(new Date(), 'YYYY-MM-DD-HH');
        const filename = `${exportPath}/${categroyName}-${currentTime}.xlsx`;
        console.info('filename: ', filename);
        fs.writeFileSync(filename, xlsx.build([
            {name: '多抓鱼书籍销售', data: dzyBookList},
        ]));
        console.log(`爬取结束, 成功导出文件: ${filename}`);
    } catch (e) {
        console.error(e);
        return e;
    }
};


const getAllBooksInfo = async () =>
{
    try {
        const categorysInfo = JSON.parse(fs.readFileSync(categoryDataPath));
        console.info('书籍分类总数: %d ', categorysInfo.length);
        let count = 0;
        for(let category of categorysInfo){
            ++count;
            console.info(' >>>>>>>>> 第: ',count,'组分类', category.categoryId, category.categroyName);
            const cList = await getBookInfoByCategoryId(category.groupId, category.group, category.categoryId, category.categroyName);
            await fs.ensureDir(_path.join(booksDataPath, '..'));
            fs.writeFileSync(booksDataPath, JSON.stringify(cList, null, 4));
            await exportExcel(cList, category.categroyName);
        }
    } catch (e) {
        console.error(e);
        return [];
    }
};

const test = async () =>
{
    await getAllBooksInfo();
};

test();