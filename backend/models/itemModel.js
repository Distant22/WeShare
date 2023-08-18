const util = require('../utils/util')
const { db } = require('../utils/util');
const { getUser } = require('./userModel')

module.exports = {

    addItem: async ( res, seller_id, buyers_limit, title, introduction, cost, tag, costco, item_location, latitude, longitude, expires_at ) => {
        try {
            const sql = 'INSERT INTO item (seller_id, buyers_limit, num_of_buyers, title, introduction, cost, tag, costco, item_location, latitude, longitude, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
            const [results] = await db.query(sql, [seller_id, buyers_limit, buyers_limit, title, introduction, cost, tag, costco, item_location, latitude, longitude, expires_at])
            const item = {
                id: results.insertId, 
            };
            return item;
        } catch (err) {
            return util.databaseError(err,'addItem',res);
        }
    },
    getSeller: async ( res, id ) => {
        try {
            const sql = 'SELECT seller_id FROM item WHERE id = ?'
            const [results] = await db.query(sql, [id])
            return results[0];
        } catch (err) {
            return util.databaseError(err,'getSeller',res);
        }
    },
    getNumOfBuyers: async ( res, id ) => {
        try{
            const sql = 'SELECT num_of_buyers FROM item WHERE id = ?'
            const [results] = await db.query(sql, [id]);
            return results[0];
        } catch (err) {
            return util.databaseError(err,'getNumOfBuyers',res);
        }
    },
    getItem: async ( res, id ) => {
        try {
            const [[user_id]] = await db.query('SELECT seller_id FROM item WHERE id = ?', [id])
            const seller_id = user_id.seller_id;
            const user = await getUser(res, seller_id);
            const sql = 'SELECT title, buyers_limit, image, introduction, cost, tag, item_location, latitude, longitude, expires_at \
            FROM item WHERE id = ?'
            const [[results]] = await db.query(sql, [id]);
            const item = {
                id: id,
                title: results.title, 
                buyers_limit: results.buyers_limit,
                image: results.image, 
                introduction: results.introduction, 
                cost: results.cost, 
                tag: results.tag, 
                costco: results.costco,
                item_location: results.item_location,
                latitude: results.latitude, 
                longitude: results.longitude,
                expires_at: results.expires_at,
                user: {
                    id: seller_id,
                    name: user.name,
                    rating: user.rating
                }
            };
            return item;
        } catch (err) {
            return util.databaseError(err,'getItem',res);
        }
    },
    
    getItems: async ( res, item_id, limit, latitude, longitude, keyword, tag ) => {
        try {
            limit = limit +1;
            if (!item_id) {
                item_id = '(SELECT MAX(id) FROM item)';
            }
            let keywordCondition = ''; 
            if (keyword) {
                keywordCondition = `AND item.title LIKE '%${keyword}%'`;
            }
            let tagCondition = ''; 
            if (tag) {
                tagCondition = `AND item.tag = '${tag}'`;
            }
            let locationCondition = ''; 
            if (latitude && longitude){
                locationCondition = `AND item.latitude < ${latitude+0.01} AND item.latitude > ${latitude-0.01} AND item.longitude < ${longitude+0.01} AND item.longitude > ${longitude-0.01}`;
            }
            const sql = `SELECT item.id, item.buyers_limit, item.title, item.image, item.introduction, item.cost, item.tag, item.item_location, item.latitude, item.longitude, item.expires_at, item.seller_id, user.name, user.rating \
                FROM item LEFT JOIN user ON item.seller_id = user.id\
                WHERE item.id <= ${item_id} ${keywordCondition} ${tagCondition} ${locationCondition}\
                ORDER BY item.id DESC LIMIT ?`;
            console.log(sql);
            const [results] = await db.query(sql, [limit]);
            if(results.length === 0){
                return [];
            }
            let items = [];
            results.map(result => {
                const item = {
                    id: result.id,
                    buyers_limit: result.buyers_limit,
                    title: result.title, 
                    image: result.image, 
                    introduction: result.introduction, 
                    cost: result.cost, 
                    tag: result.tag, 
                    costco: result.costco,
                    item_location: result.item_location,
                    latitude: result.latitude, 
                    longitude: result.longitude,
                    expires_at: result.expires_at,
                    user: {
                        id: result.seller_id,
                        name: result.name,
                        rating: result.rating
                    }
                };
                items.push(item);
            })
            return items;            
        } catch (err) {
            return util.databaseError(err,'getItems',res);
        }
    },
    updateItem: async ( res, id, title, introduction, cost, tag, costco, item_location, latitude, longitude, expires_at) => {
        try {
            const sql = 'UPDATE item SET title = ?, introduction = ?, cost = ?, tag = ?, costco = ?, item_location = ?, latitude = ?, longitude = ?, expires_at = ? WHERE id = ?'
            const [results] = await db.query(sql, [title, introduction, cost, tag, costco, item_location, latitude, longitude, expires_at, id]);
            const item = {
                id: id,
            };
            return item;
        } catch (err) {
            return util.databaseError(err,'updateItem',res);
        }
    },
    updateItemImage: async ( res, id, url ) => {
        try{
            const sql = 'UPDATE item SET image = ? WHERE id = ?'
            const [results] = await db.query(sql, [url, id]);
            const path = {
                image: url 
            }
            return path;
        } catch (err) {
            return util.databaseError(err,'updateItemImage',res);
        }
    },
    updateNumOfBuyers: async ( res, quantity, id ) => {
        try{
            const sql = 'UPDATE item SET num_of_buyers = ? WHERE id = ?'
            const [results] = await db.query(sql, [quantity, id]);
            const item = {
                id: id,
                quantity: quantity 
            }
            return item;
        } catch (err) {
            return util.databaseError(err,'updateItemImage',res);
        }
    }
}
