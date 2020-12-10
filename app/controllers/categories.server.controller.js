var Category = require('../models/categories.server.model');
var logger = require('winston');








exports.addCategory = function* () {
    try {
        let categoryAdded = yield Category.addCategory(this.body);
        if (getcheckin) {
            this.body = { status: 200, message: "Category Added", data: categoryAdded };
            return;
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}



exports.getCategory = function* () {
    try {
        let categoryList = yield Category.getCategory(this.body);
        if (getcheckin) {
            this.body = { status: 200, message: "Category Featch", data: categoryList };
            return;
        }
    } catch (error) {
        this.status = 400; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Something went wrong.' };
        return;
    }
}