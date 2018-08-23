const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const request = require('superagent');
const config = require('./config');
const {getHeader} = require('./util/duozhuayuUtil');
const {domain, category_path, categoryDataPath} = config.dzy;

const getCategories = async () =>
{
    try {
        let result = await request.get(`${domain}${category_path}`).set(getHeader());
        result = JSON.parse(result.text);
        const final = [];
        for(let item of result){
            const group = item.name;
            const {categories} = item;
            for(let category of categories){
                const categoryId = category.id;
                const categoryName = category.name;
                const {parentCategory} = category;
                const groupId = parentCategory.id;
                final.push({
                    group       : group,
                    groupId     : groupId,
                    categoryId  : categoryId,
                    categroyName: categoryName
                })
            }
        }
        return final;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const crawlerCategories = async () =>
{
    try {
        const category = await getCategories();
        console.info('category: ', category);
        await fs.ensureDir(_path.join(categoryDataPath, '..'));
        fs.writeFileSync(categoryDataPath, JSON.stringify(category, null, 4));
    } catch (e) {
        console.error(e);
        return e;
    }
};


crawlerCategories();