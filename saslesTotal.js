const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const request = require('superagent');
const config = require('./config/index');
const sleep = require('js-sleep/js-sleep');
const {getHeader} = require('./util/duozhuayuUtil');
const {formatDate} = require('./util/dateUtil');
const xlsx = require('node-xlsx').default;
const obj  = xlsx.parse('./file/dzy/豆瓣 8.5.xlsx');
const {domain, booksDataPath, exportPath, partBooksDataPath} = config.dzy;

const booksList = [];
let booksObjList = [];
Object.keys(obj).forEach(function(key)
{
    obj[key].data.forEach(function(item){
        booksObjList.push({
            groupId     : item[0],
            group       : item[1],
            categoryId  : item[2],
            categroyName: item[3],
            id          : item[4],
            title       : item[5],
            publisher   : item[6],
            isbn        : item[7],
            doubanRating: item[8],
            author      : item[9],
            price       : item[10]
        });
    });
});

// 剔除表头
booksObjList.shift();
console.info(`分组: ${booksObjList[0].group} 类别: ${booksObjList[0].categroyName}, 书籍总量: ${booksObjList.length} 本`);

(async() =>{
    await fs.ensureDir(_path.join(booksDataPath, '..'));
    fs.writeFileSync(booksDataPath, JSON.stringify(booksObjList, null, 4));
})();

let count = 0, requestNumber = 0;
const getBookSalesTotal = async (book, page, sumList) =>
{
    try {
        let path = page;
        if(count === 0){
            sumList = [];
            path = `${domain}/api/books/${book.id}/sellers`;
        }
        console.info(`请求次数: ${++requestNumber} bookId:　${book.id} >> ${path}`);
        let result = await request.get(path).set(getHeader());
        result = JSON.parse(result.text);
        const {paging, data} = result;
        const soldBooksCountList = [];
        for(let obj of data){
            soldBooksCountList.push(obj.soldBooksCount);
        }
        sumList = sumList.concat(soldBooksCountList);
        if(paging.next){
            count++;
            const page = paging.next;
            return await getBookSalesTotal(book, page, sumList);
        } else {
            count = 0;
            book.salesTotal = _.sum(sumList);
            return book;
        }
    } catch (e) {
        count = 0;
        requestNumber = 0;
        console.error(`已采集的部分数据: ${booksList.length}、 error: ${e}`);
        // 存储爬取到第几本
        await fs.ensureDir(_path.join(partBooksDataPath, '..'));
        fs.writeFileSync(partBooksDataPath, JSON.stringify({
            id: book.id, title: book.title
        }, null, 4));
        // 导出已爬取的部分数据
        await exportExcel(booksList);
    }
};

const getAllBookSalesTotal = async () =>
{
    try {
        let count = 0;
        for(let book of booksObjList){
            const _book = await getBookSalesTotal(book);
            console.info(`第 ${++count} 本, bookId: ${book.id}, title: ${book.title} _book: %j`, _book);
            booksList.push(_book);
            if(_.isEmpty(_book)){
                console.error('运行结束...');
                return;
            }
        }
        return booksList;
    } catch (e) {
        console.error('AllBook: ',e);
        return [];
    }
};

const getInterruptedBook = async () =>
{
    try {
        const interruptedBook = JSON.parse(fs.readFileSync(partBooksDataPath));
        return interruptedBook.id;
    } catch (e) {
        console.error(e);
        return;
    }
};

const getSurplusBooksObjList = async (interruptedId, bookArray) =>
{
    try {
        let start = false, result = [];
        for(let book of bookArray){
            if(book.id === interruptedId){
                start = true;
                // result.push(book);
            }
            if(start){
                result.push(book);
            }
        }
        booksObjList = result;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const exportExcel = async (list) =>
{
    try {
        if(!list){
            console.info('开始采集数据......');
        }
        // 检测是否出现中断
        const interrupted = await getInterruptedBook();
        if(!_.isEmpty(interrupted)){
            await getSurplusBooksObjList(interrupted, booksObjList);
        }

        let books = [];
        const dzyBookList = [['组ID', '组名称', '类别ID', '类别名称','书籍ID','书籍名称','出版社','ISBN','豆瓣评分','作者','价格', '销售总量']];
        if(!list){
            books = await getAllBookSalesTotal();
        } else {
            books = list;
        }
        if(_.isEmpty(books)){
            return;
        }
        for(let item of books){
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
            row.push(item.salesTotal);
            dzyBookList.push(row);
        }
        const filename = `${exportPath}/${booksObjList[0].categroyName}.xlsx`;
        console.info('dzyBookList.length: ', dzyBookList.length);
        fs.writeFileSync(filename, xlsx.build([
            {name: '多抓鱼书籍销售总量', data: dzyBookList},
        ]));
        console.log(`爬取结束, 成功导出文件: ${filename}`);
        return;
    } catch (e) {
        console.error('Export: ', e);
        return e;
    }
};

const test = async () =>
{
    await exportExcel();
};

test();

