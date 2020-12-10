var debug = require('debug')('units.server.controller');
var logger = require('winston');
var msc = require('./moltin.server.controller');
var User = require('../models/user.server.model');
var CART = require('../models/cart.server.model')
var Company = require('../models/company.server.model');
var Unit = require('../models/unit.server.model');
var moltin = require('../controllers/moltin.server.controller')
var OrderHistory = require('../models/orderhistory.server.model');
var Delivery = require('../models/deliveryaddress.server.model');
var axios = require('axios');
var CHECKINS = require('../models/checkin.server.model');
var CUSTOMER = require('../models/customer.server.model');

const MILES5 = 5;
const MILES10 = 10;
const MILESFIFTEEN = 15;

const LESSTHAN5 = 4.25;
const MORETHAN5 = 7;
const MORETHAN10 = 9;

const TIP5 = 1.25;
const TIP10 = 2;
const TIP15 = 2.75;

const VEN5 = 3;
const VEN10 = 5;
const VEN15 = 6.25;

exports.createCart = function* (next) {
    console.log('params........................................................', this.params.cartName)
    try {
        var cart = (yield msc.createCart(this.params.cartName))
        // var customer = (yield msc.createCustomer(this.params.cartName))
        this.status = 200;
        this.body = { data: "Request created", data: cart };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}


exports.completeOrder = function* (next) {
    orderId = this.params.orderId;
    order = (yield CART.getOrderById(orderId));
    if (order.rows && order.rows.length > 0) {
        context = order.rows[0].context;
        if (context == 'cod') {
            if (this.body && this.body.hasOwnProperty('amount')) {
                amount = this.body.amount;
            } else {
                this.status = 400;
                this.body = { status: 400, message: 'Please send Tip amount!' };
                return;
            }
        } else {
            amount = order.rows[0].order_detail.meta.display_price.with_tax.formatted;
        }
        var updatedone = null;
        if (amount != 0) {
            updatedone = (yield OrderHistory.updateOrder({ tip_amount: amount }));
        }

    }
    console.log('completeOrdercompleteOrdercompleteOrder', amount, order)
    this.status = 200;
    this.body = { status: 200, message: 'Order has been completed, Now!', data: updatedone };
    return;
}


exports.completeTakeoutOrder = function* () {
    try {
        var user = this.passport.user;
        if (user.role != 'OWNER') {
            this.status = 401;
            this.body = { status: 401, message: "User unauthorized" };
            return;
        }
        var orderId = this.params.orderId;
        var order = (yield CART.getOrderById(orderId));
        if (order.rows && order.rows.length > 0) {
            let orderdet = order.rows[0].order_detail;
            orderdet.status = 'complete';
            orderdet.payment = 'paid';
            let updateMoltin = yield msc.updateOrderStatus(orderId);
            let updatedone = (yield OrderHistory.updateOrderStatus(orderId, orderdet));
            console.log({ updatedone, updateMoltin })
            if (updatedone) {
                this.status = 200;
                this.body = { status: 200, message: "payment status updated" };
                return;
            }
        } else {
            this.status = 404;
            this.body = { status: 404, message: "Order not found!" };
            return;
        }
    } catch (error) {
        console.log({ error })
        this.status = 400;
        this.body = { status: 400, message: "Something went wrong", error };
        return;
    }
}

exports.sendOrderToCustomer = function* (next) {
    var companyDetail = yield Company.getSingleCompany(this.body.company_id);
    var cartItems = (yield msc.getCartItems(this.params.vendorId));
    let d = [];
    for (let item of cartItems) {
        // var getcustomer = ( yield CUSTOMER.getForUser(this.body.company_id ? this.body.company_id : ''))[0];
        // var totalOrderCount = ( yield OrderHistory.getTotalOrderCount(getcustomer.id));

        let c = (yield CART.getCartForVendor(this.params.vendorId, item.product_id));
        // console.log(')))))))))))))))))))))))))))))))))))))))))',c)
        // item['addons'] = c[0].addons;
        // item['addonsprice'] = c[0].addonsprice;
        // item['instructions'] = c[0].instructions;
        // d.push(item);

        let ad = c[0].addons && c[0].addons.split(',');
        let pr = c[0].addonsprice && c[0].addonsprice.split(',');
        let ins = c[0].instructions && c[0].instructions.split(',');

        let addons = [];
        let addonsprice = [];
        let i = 0;
        if (ad && ad.length > 0) {
            for (let add of ad) {
                addons.push(add.title);
                addonsprice.push(pr[i]);
                i++;
            }
        }


        var data = {
            productid: item.product_id,
            quantity: item.quantity ? item.quantity : 0,
            price: item.unit_price.amount,
            userid: this.body.customer_id,
            addons: addons ? addons.join(',') : "",
            addonsprice: addonsprice ? addonsprice.join(',') : "",
            instructions: ins & ins.length > 0 ? ins.join(',') : "",
            note: this.body.note ? this.body.note : '',
            vendor_id: this.body.company_id,
            vendor_name: companyDetail[0].name,
            size: c[0].size
        }
        // console.log(')))))))))))))))))))))))))))))))))))))))))',data)
        var cart = (yield msc.addItemsToCart(this.body.customer_id, item.product_id, item.quantity))
        let cartData = yield CART.addcart(data); // store into our DB
        var deletecart = (yield msc.deleteCart(this.params.vendorId))
        var deletecartitem = (yield CART.deleteCartItem(this.params.vendorId))
    }

    this.status = 200;
    this.body = { status: 200, message: 'Cart Has been sent to customer!' };
    return;
}

getDistance = (body) => {
    return new Promise((resolve, reject) => {
        axios('https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=' + body.origin.lat + ',' + body.origin.lng + '&destinations=' + body.destination.lat + ',' + body.destination.lng + '&key=AIzaSyBLXlb_YUHwakS59P-aI5_xJHRwXBtA_hE')
            .then(data => {
                resolve(data)
            });
    })
}


exports.calculateDistance = function* (next) {
    let distance = yield getDistance(this.body);
    console.log('body........................................................', this.body, distance);
    this.status = 200;
    this.body = { status: 200, message: 'Your Distance!', data: distance.data };
    return;
}

exports.addItemsToCart = function* (next) {
    console.log('params........................................................', this.params.cartName);
    // var companyD = yield Company.getSingleCompany(this.body.vendor_id);
    // var companyDetail = yield Company.getSingleCompany(companyD[0].id);
    var companyid = (yield Company.getSingleCompanyByunit(this.body.vendor_id));
    var companyDetail = yield Company.getSingleCompany(companyid[0].company_id);

    let addons = [];
    let addonsprice = [];
    if (this.body.addons && this.body.addons.length > 0) {
        for (let add of this.body.addons) {
            addons.push(add.title);
            addonsprice.push(add.value);
        }
    }
    var getcustomer = (yield CUSTOMER.getForUser(this.body.userid ? this.body.userid : ''))[0];

    var totalOrderCount = (yield OrderHistory.getTotalOrderCount(getcustomer.id));
    console.log('hkjgkf;kasjdhashdkashkdhksahdkhshdkjhsakdhasdasd0', totalOrderCount)
    var data = {
        productid: this.body.itemId,
        quantity: this.body.quantity,
        price: this.body.price,
        userid: this.body.userid,
        addons: addons ? addons.join(',') : "",
        addonsprice: addonsprice ? addonsprice.join(',') : "",
        instructions: this.body.instructions && this.body.instructions.length > 0 ? this.body.instructions.join(',') : "",
        note: this.body.note,
        vendor_id: this.body.vendor_id,
        vendor_name: companyDetail[0].name,
        size: this.body.size,
        order_count: totalOrderCount[0].count == '0' ? 1 : parseInt(totalOrderCount[0].count) + 1
    }
    try {
        var cart = (yield msc.addItemsToCart(this.params.cartName, this.body.itemId, this.body.quantity))
        let cartData = yield CART.addcart(data); // store into our DB
        // let orderData = yield CART.addorderHistory(data); // store into our DB

        this.status = 200;
        // this.body = {status:200, data: "Request created", data: cart };
        this.body = { status: 200, data: "Item has been added to you cart!" };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 400, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 400, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}

exports.acceptOrderByRestaurant = function* (next) {
    var updatestatus = yield CART.acceptOrderByRestaurant(this.params.order_id);
    console.log('acceptOrderByRestaurantacceptOrderByRestaurant', updatestatus)
    this.status = 200;
    this.body = { status: 200, message: "Order Accepted Successfully", data: updatestatus };
}


exports.assignOrderToDriver = function* (next) {
    var driverAssign = yield CART.assignOrderToDriver(this.params.order_id, this.params.driver_id);
    console.log('assignOrderToDriverassignOrderToDriverassignOrderToDriver', driverAssign)
    this.status = 200;
    this.body = { status: 200, message: "Order Accepted Successfully", data: driverAssign };
}



exports.orderPayment = function* (next) {
    var driverAssign = yield moltin.orderManualPayment(this.body.order_id);
    console.log('assignOrderToDriverassignOrderToDriverassignOrderToDriver', driverAssign)
    this.status = 200;
    this.body = { status: 200, message: "Order Accepted Successfully", data: driverAssign };
}


exports.getAllrestaurantOrder = function* (next) {
    var cartItems = (yield CART.getAllorderItems(this.params.vendor_id));

    var data = [];
    let finalArray = [];
    var orderId = [];
    for (let item of cartItems) {
        let status = orderId.indexOf(item.order_id);
        if (status == -1) {
            orderId.push(item.order_id);
            ordersItem = (yield msc.getorderItems(item.order_id));
            items = item;
            let oi = [];
            for (var i = 0; i < ordersItem.length; i++) {
                delete ordersItem[i].meta;
                delete ordersItem[i].links;
                delete ordersItem[i].relationships;
                delete ordersItem[i].value;

                if (items) {
                    ordersItem[i]['addons'] = items && items.addons ? items && items.addons : '';
                    ordersItem[i]['addonsprice'] = items && items.addonsprice ? items && items.addonsprice : 0;
                    ordersItem[i]['instructions'] = items && items.instructions ? items && items.instructions : '';
                    ordersItem[i]['vendor_name'] = items && items.vendor_name ? items && items.vendor_name : '';
                    ordersItem[i]['payment_date'] = items && items.payment_date ? items && items.payment_date : '';
                    ordersItem[i]['payment_status'] = items && items.payment_status ? items && items.payment_status : '';
                    ordersItem[i]['created_at'] = items && items.created_at ? items && items.created_at : '';
                    oi.push(ordersItem[i])
                }
            }
            items['ordersItem'] = oi;
            finalArray.push(items);
        } else {
            // do nothing
        }

    }
    this.status = 200;
    this.body = { status: 200, data: "Request created", results: finalArray };
}

exports.getAllCartItems = function* (next) {
    var cartItems = (yield CART.getAllCartItems(this.params.userid));
    var data = [];
    for (let item of cartItems) {
        let d = yield msc.findMenuItem(item.productid);
        d['orderprice'] = item.price
        d['orderquantity'] = item.quantity
        d['orderaddons'] = item.addons
        d['orderaddonsprice'] = item.addonsprice
        d['orderinstructions'] = item.instructions
        d['ordernote'] = item.note
        data.push(d);
    }
    // var results = yield msc.findMenuItem(cartItems[0].productid);

    this.status = 200;
    this.body = { status: 200, data: "Request created", results: data };
}

exports.updateItemsToCart = function* (next) {
    try {
        var cart = (yield msc.updateItemsToCart(this.params.cartName, this.body.itemId, this.body.quantity, this.params.itemId))
        this.status = 200;
        this.body = { data: "Request created", data: cart };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        throw (error);
    }
}

exports.cartCheckout = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    var getcustomer = (yield CUSTOMER.getForUser(this.params.cartName ? this.params.cartName : ''))[0];
    var totalOrderCount = (yield OrderHistory.getTotalOrderCount(getcustomer.id));

    var d = {};
    // let addressobj = {};
    // if (this.body.delivery_address_details) {
    //     addressobj.customer_id = this.body.customer_id ? this.body.customer_id : getcustomer.id;
    //     addressobj.nickname = this.body.delivery_address_details.first_name;
    //     addressobj.address1 = this.body.delivery_address_details.line_1;
    //     addressobj.address2 = this.body.delivery_address_details.line_2;
    //     addressobj.city = this.body.delivery_address_details.city;
    //     addressobj.state = this.body.delivery_address_details.state ? this.body.delivery_address_details.state : '';
    //     addressobj.phone = this.body.delivery_address_details.phone_number;
    //     addressobj.title = this.body.delivery_address_details.instructions;
    //     var address = yield Delivery.createAddress(addressobj);
    //     //    console.log('lllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll',address);
    //     this.body.delivery_address_id = address[0].id;
    // }

    if (this.body.delivery_address_id) {
        var deliverDetails = yield Delivery.getSingleAddress(this.body.delivery_address_id);
        if (deliverDetails && deliverDetails.length > 0) {
            d['first_name'] = user[0].first_name;
            d['last_name'] = user[0].last_name;
            d['line_1'] = deliverDetails[0].address1;
            d['line_2'] = deliverDetails[0].address2;
            d['city'] = deliverDetails[0].city;
            d['company_name'] = deliverDetails[0].city;
            d['postcode'] = deliverDetails[0].city;
            d['county'] = deliverDetails[0].city;
            d['country'] = deliverDetails[0].city;

        }
    }
    let shipd = d;
    shipd['phone_number'] = deliverDetails[0].phone;
    shipd['instructions'] = deliverDetails[0].phone;

    var data = {
        "company": this.body.company_id,
        "unit": this.body.unit_id,
        "customer": {
            "email": user[0].username,
            "name": user[0].first_name + " " + user[0].last_name
        },
        "billing_address": d,
        "shipping_address": shipd
    }
    console.log('asdassssssssssssssssssssssssssssssssssssssssssss', data);

    try {
        var cart = (yield msc.cartCheckout(this.params.cartName, data));

        // let paymentStatus = (yield moltin.orderManualPayment(cart.id)); 
        // if(paymentStatus){
        //     cart['payment'] = "paid";
        //     cart['status'] = paymentStatus.status;
        //     cart['transactionId'] = paymentStatus.id;
        //     cart['gateway'] = paymentStatus.gateway;
        //     cart['transaction_type'] = paymentStatus.transaction_type;
        //     let paymentcaptureStatus = (yield moltin.orderManualCapturePayment(cart.id,paymentStatus.id));
        // } 


        // empty cart agianst the user
        // (yield CART.deleteCartItem(this.params.cartName));
        // (yield CART.updateOrderScreen(this.params.cartName,cart.id)); 
        // console.log('params........................................................',this.body.commission_type);
        var companyDetail = yield Company.getSingleCompany(this.body.company_id);
        var unitDetail = yield Unit.getSingleUnit(this.body.unit_id);

        // console.log('asdassssssssssssssssssssssssssssssssssssssssssss111',cart,paymentStatus,companyDetail,unitDetail);

        // logic for calculating the distance and tip, delivery charges
        var longDelivery = false;
        var shortDelivery = false;
        var deliveryCharges = 0;
        var deliveryDistance = 0;

        if (companyDetail && companyDetail.length > 0 && companyDetail[0].id) {
            let checkins = (yield CHECKINS.findCompanyCheckin(companyDetail[0].id))[0];

            if (checkins.hasOwnProperty('latitude')) {
                let coords = {
                    origin: {
                        lat: checkins.latitude,
                        lng: checkins.longitude
                    },
                    destination: {
                        lat: deliverDetails[0].latitude,
                        lng: deliverDetails[0].longitude
                    }
                }
                let distance = yield getDistance(coords);
                console.log({coords})
                if (distance && distance.data && distance.data.rows) {
                    let d = distance.data.rows[0].elements[0].distance && distance.data.rows[0].elements[0].distance.text ? distance.data.rows[0].elements[0].distance.text : '';
                    console.log(distance.data.rows[0].elements[0].distance)
                    deliveryDistance = d.split(' ') ? parseFloat(d.split(' ')[0]) : 0;
                    console.log({deliveryDistance})
                    //    deliveryDistance=11;
                    //    console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',deliveryDistance < MILES, deliveryDistance >= MILES && deliveryDistance <= MORETHAN5,deliveryDistance > MORETHAN5 && deliveryDistance <= MILESFIFTEEN)
                    if (deliveryDistance < MILES5) {
                        shortDelivery = true;
                        longDelivery = false;
                        doubleDelivery = false;
                        deliveryCharges = LESSTHAN5;
                        // tip_amount = TIP5;
                    }else if (deliveryDistance >= MILES5 && deliveryDistance <= MILES10) {
                        shortDelivery = false;
                        longDelivery = true;
                        doubleDelivery = false;
                        deliveryCharges = MORETHAN5;
                        // tip_amount = TIP10;
                    }else if (deliveryDistance > MILES10 && deliveryDistance <= MILESFIFTEEN) {
                        longDelivery = false;
                        shortDelivery = false;
                        doubleDelivery = true;
                        deliveryCharges = MORETHAN10;
                        // tip_amount = TIP15;
                    } else {
                        console.log('shdjgsajgdgsadgasgdgas faillllllllllllllllllllllllllllllllll')
                        this.status = 500;
                        this.body = { status: 500, message: "Sorry! We can't deliver in your area", status: 500 };
                        return;
                    }

                    //    if(deliveryDistance < MILES){
                    //     shortDelivery = true;
                    //     longDelivery = false; 
                    //     deliveryCharges = LESSTHAN5;
                    //    }
                    //    else{
                    //        longDelivery = true;
                    //        shortDelivery = false;
                    //        deliveryCharges = MORETHAN5;
                    //    }
                }
                // console.log('params........................................................',JSON.stringify(distance.data),shortDelivery,longDelivery,deliveryCharges);
            }
        }

        let random = Math.floor((Math.random() +1) *9999);
        let order_id = `${random}${Date.now()}`;
        let orderData = {
            // distance_type : longDelivery ? 'long' : 'short',
            order_id ,
            distance_type: shortDelivery ? 'short' : longDelivery ? 'long' : 'extra-long',
            order_distance: deliveryDistance,
            delivery_charge: deliveryCharges,
            tip_amount: this.body.tip_amount ? this.body.tip_amount : 0,
            order_count: totalOrderCount[0].count == '0' ? 1 : (parseInt(totalOrderCount[0].count) + 1),

            unit_id: this.body.unit_id,
            // customer_id : this.body.customer_id ? this.body.customer_id : (user[0].id ? user[0].id : null),
            customer_id: this.body.customer_id ? this.body.customer_id : getcustomer.id,
            customer_name: user[0].first_name + " " + user[0].last_name,
            company_id: this.body.company_id,
            company_name: companyDetail && companyDetail[0].name ? companyDetail[0].name : null,
            amount: this.body.amount,
            status: { "order_requested": new Date() },
            commission_type: this.body.commission_type,
            context: this.body.context,
            for_delivery: this.body.for_delivery,
            order_detail: cart,
            delivery_address_id: this.body.delivery_address_id,
            checkin_id: this.body.checkin_id ? this.body.checkin_id : null,
            prep_notice_time: unitDetail && unitDetail[0].prep_notice ? new Date(Date.now() + (unitDetail[0].prep_notice * 60 * 1000)) : null,
            desired_delivery_time: this.body.desired_delivery ? new Date(Date.now() + (Number(this.body.desired_delivery) * 60 * 1000))  : unitDetail && unitDetail[0].customer_order_window ? new Date(Date.now() + (unitDetail[0].customer_order_window + unitDetail[0].delivery_time_offset * 60 * 1000)) : null,
            initiation_time: unitDetail && unitDetail[0].customer_order_window ? new Date(Date.now() + (unitDetail[0].customer_order_window * 60 * 1000)) : null,
            delivery_address_details: this.body.delivery_address_details ? this.body.delivery_address_details : shipd
        }
        // console.log('params........................................................',orderData);
        let d = (yield CART.addorderHistory(orderData));
        console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&', d);

        // delete the items from cart
        var cartItemsData = (yield msc.getCartItems(this.params.cartName));
        for (let deleteItemid of cartItemsData) {
            (yield msc.deleteCartItem(this.params.cartName, deleteItemid.id))
        }

        let getorder= (yield CART.getOrderByOrderid(order_id))[0];
        getorder.cartItems = cartItemsData;
        this.status = 200;
        this.body = { status: 200, message: "Request created", data: getorder };
    } catch (error) {
        console.log({error})
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist', status: 422 };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.', error: error };
        return;
        // throw (error);
    }
}


exports.getAllOrderFormattedResponse = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    try {
        // var cart = (yield msc.getCustomerOrder(user[0].username)) //get all order from moltin
        let customer =(yield CART.getcustomer(this.params.cartName))[0];
        let orderHistorys = (yield CART.getOrderHistory(this.params.cartName));

        let orderHistory = (yield CART.getnewOrderHistory(customer.id));
        var items = null;
        var finalArray = [];
        for (let item of orderHistory) {
            ordersItem = (yield msc.getorderItems(item.order_detail.id));
            console.log(ordersItem)
            console.log({item})
            items = item;
            // items['ordersItem']=  ordersItem;

            // delete items.meta;
            delete items.relationships;
            delete items.links;
            delete items.customer;
            delete items.shipping_address;
            delete items.billing_address;
            delete items.delivery_address_details;
            delete items.order_sys_order_id;
            delete items.order_detail.relationships;
            delete items.order_detail.billing_address;
            delete items.order_detail.shipping;
            delete items.order_detail.shipping_address;
            delete items.order_detail.links;
            delete items.order_count;
            delete items.context;
            delete items.priority;
            delete items.distance_type;
            delete items.order_distance;
            delete items.delivery_charge;
            delete items.tip_amount;
            delete items.payment_time;
            delete items.prep_notice_time;
            delete items.status;
            delete items.qr_code;
            delete items.manual_pickup;
            delete items.contact;
            delete items.order_detail.meta;
            delete items.order_detail.transactionId;
            delete items.order_detail.transaction_type;
            delete items.checkin_id;
            delete items.updated_at;
            delete items.commission_type;
            delete items.payment_response;
            delete items.actual_pickup_time;
            let oi = [];
            for (var i = 0; i < ordersItem.length; i++) {
                delete ordersItem[i].meta;
                delete ordersItem[i].links;
                delete ordersItem[i].relationships;
                delete ordersItem[i].value;
                delete ordersItem[i].unit_price;
                delete ordersItem[i].type;
              

                let currentorder = orderHistorys.filter((it) => {
                    // console.log('orderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistory', it);
                    return it.productid == ordersItem[i].product_id;
                });
                // if (currentorder && currentorder.length > 0) {

                    ordersItem[i]['addons'] = currentorder[i] && currentorder[i].addons ? currentorder[i] && currentorder[i].addons : '';
                    ordersItem[i]['addonsprice'] = currentorder[i] && currentorder[i].addonsprice ? currentorder[i] && currentorder[i].addonsprice : 0;
                    ordersItem[i]['instructions'] = currentorder[i] && currentorder[i].instructions ? currentorder[i] && currentorder[i].instructions : '';
                    // ordersItem[i]['vendor_name'] = currentorder[i] && currentorder[i].vendor_name ? currentorder[i] && currentorder[i].vendor_name : '';
                    // ordersItem[i]['payment_date'] = currentorder[i] && currentorder[i].payment_date ? currentorder[i] && currentorder[i].payment_date : '';
                    // ordersItem[i]['payment_status'] = currentorder[i] && currentorder[i].payment_status ? currentorder[i] && currentorder[i].payment_status : '';
                    // ordersItem[i]['created_at'] = currentorder[i] && currentorder[i].created_at ? currentorder[i] && currentorder[i].created_at : '';

                // }
                oi.push(ordersItem[i])
            }
            items['ordersItem'] = oi;
            finalArray.push(items);
        }
        this.status = 200;
        this.body = { status: 200, message: "Request created", data: finalArray };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        return;
        // throw (error);
    }
}

exports.getAllOrder = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    try {
        var cart = (yield msc.getCustomerOrder(user[0].username)) //get all order from moltin
        let orderHistory = (yield CART.getOrderHistory(this.params.cartName));

        var items = null;
        var finalArray = [];
        for (let item of cart) {

            ordersItem = (yield msc.getorderItems(item.id));
            items = item;
            // items['ordersItem']=  ordersItem;
            let oi = [];
            for (var i = 0; i < ordersItem.length; i++) {
                let currentorder = orderHistory.filter((it) => {
                    console.log('orderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistory', it.productid, item.product_id)
                    return it.productid == ordersItem[i].product_id;
                });
                if (currentorder && currentorder.length > 0) {

                    ordersItem[i]['addons'] = currentorder[i] && currentorder[i].addons ? currentorder[i] && currentorder[i].addons : '';
                    ordersItem[i]['addonsprice'] = currentorder[i] && currentorder[i].addonsprice ? currentorder[i] && currentorder[i].addonsprice : 0;
                    ordersItem[i]['instructions'] = currentorder[i] && currentorder[i].instructions ? currentorder[i] && currentorder[i].instructions : '';
                    ordersItem[i]['vendor_name'] = currentorder[i] && currentorder[i].vendor_name ? currentorder[i] && currentorder[i].vendor_name : '';
                    ordersItem[i]['payment_date'] = currentorder[i] && currentorder[i].payment_date ? currentorder[i] && currentorder[i].payment_date : '';
                    ordersItem[i]['payment_status'] = currentorder[i] && currentorder[i].payment_status ? currentorder[i] && currentorder[i].payment_status : '';
                    ordersItem[i]['created_at'] = currentorder[i] && currentorder[i].created_at ? currentorder[i] && currentorder[i].created_at : '';

                    oi.push(ordersItem[i])
                }
            }
            items['ordersItem'] = oi;

            // let currentorder = orderHistory.filter((it)=>{
            //     console.log('orderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistoryorderHistory',it.productid,item.product_id)
            //     return it.productid==ordersItem[0].product_id;
            // });
            // if(currentorder && currentorder.length > 0){
            //     items['addons']= currentorder[0].addons;
            //     items['addonsprice']= currentorder[0].addonsprice;
            //     items['instructions']= currentorder[0].instructions;
            // }

            finalArray.push(items);
        }
        this.status = 200;
        this.body = { status: 200, data: "Request created", data: finalArray };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
    }
}

exports.getAllPendingCustomers = function* (next) {
    try {
        var cart = (yield msc.getAllCustomerPendingOrder());
        let d = [];
        for (let item of cart) {
            console.log('d.indexOf(item.customer.email)d.indexOf(item.customer.email)', d.indexOf(item.customer.email))
            if (d.findIndex((item1, index) => { return item.customer.email == item.name }) == -1) {
                d.push({ email: item.customer.email, name: item.customer.name })
            }
        }
        this.status = 200;
        this.body = { status: 200, data: "Request created", data: cart };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, models: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        return;
    }
}

exports.deleteAllOrderForUser = function* (next) {
    user = (yield User.getSingleUser(this.params.userId));
    try {
        var cart = (yield msc.getAllCustomerOrder(user[0].username));
        for (let item of cart) {
            let deleteorder = (yield moltin.deleteUserAllOrder(item.id));
            console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk', deleteorder, item);

        }
    }
    catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, models: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        return;
        // throw (error);
    }
}

exports.calculateDriverWeekWagesOnworkingDay = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getWeekWorkingDayDriverOrder(driver_id);
    // day = 7;
    totalhous = 8;
    perhourscost = 11.25;
    var driverWages = driverData.rows[0].count * totalhous * perhourscost;
    this.body = { status: 200, totalPay: driverWages };
    return;
}

exports.calculateDriverWeekWagesOnDeliveryCharges = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getWeekDeliveryChargesDriverOrder(driver_id);
    let data = [];
    for (let item of driverData.rows) {
        orderData = yield OrderHistory.getWeekDeliveryChargesTotalDriverOrder(driver_id, item.unit_id);
        console.log('asjkdhshdkhaskdksasvbjcvjdsvjvfjhdsjfvjewhvjkvewjvhjwjevjhvdhsjfvdsjfjdsjhdsjhdsjhfdsjfvjds', orderData.rows)
        data.push({
            name: orderData.rows[0].company_name,
            pay: orderData.rows.length * orderData.rows[0].delivery_charge
        })
    }
    this.body = { status: 200, totalPay: data };
    return;
}

exports.calculateVendorWagesPerdayForDriver = function* (next) {
    let vendorId = this.params.vendorId;
    vendorData = yield OrderHistory.calculateVendorWagesPerdayForDriver(vendorId);
    let data = [];
    for (let item of vendorData.rows) {
        orderData = yield OrderHistory.getPerDayVendorWagesForDriver(vendorId, item.driver_id);
        let driver = yield User.getSingleUser(orderData.rows[0].driver_id);
        data.push({
            driver: driver[0],
            pay: orderData.rows[0].tip_amount + orderData.rows[0].delivery_charge + parseInt(orderData.rows[0].amount),
        })
    }
    this.body = { status: 200, totalPay: data };
    return;
}

exports.moneyReceivedForVendorByDriver = function* (next) {
    let vendorId = this.body.vendorId;
    let driverId = this.body.driverId;
    let data = OrderHistory.updateMoneyReceived(vendorId, driverId);
    this.body = { status: 200, message: "Updated" }
    return;
}

exports.getCompanyByVendorId = function* (next) {
    let company = yield OrderHistory.getCompany(this.params.vendorId)
    this.body = { status: 200, data: company }
    return;
}

exports.calculateDriverPerDayWagesOnDeliveryCharges = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getPerDayDeliveryChargesDriverOrder(driver_id);
    let data = [];
    for (let item of driverData.rows) {
        orderData = yield OrderHistory.getPerDayDeliveryChargesTotalDriverOrder(driver_id, item.unit_id);
        data.push({
            name: orderData.rows[0].company_name,
            // pay : orderData.rows.length * orderData.rows[0].delivery_charge
            pay: orderData.rows[0].tip_amount * orderData.rows[0].delivery_charge,
            // order : orderData.rows[0],
            delivery_address_details: orderData.rows[0].delivery_address_details,
            tip_amount: orderData.rows[0].tip_amount,
            delivery_charge: orderData.rows[0].delivery_charge,
            trip_fees: orderData.rows[0].delivery_charge ? orderData.rows[0].delivery_charge == 9 ? TIP15 : orderData.rows[0].delivery_charge == 7 ? TIP10 : TIP5 : 0

        })
    }
    this.body = { status: 200, totalPay: data };
    return;
}

exports.getVendorDriverWagesForOrders = function* () {
    ordersData = yield OrderHistory.getOrders();
    let data = [];
    var pay = 0;
    let tip_amount = 0;
    let delivery_charge = 0;
    let trip_fees = 0;
    if (ordersData.rows) {
        for (let i of ordersData.rows) {
            if (i.driver_id) {
                console.log({ i })
                let driverdetails = yield User.getSingleUser(i.driver_id);
                let obj = {};
                obj.id = i.id;
                obj.created_at = i.created_at;
                obj.updated_at = i.updated_at;
                obj.amount = parseFloat(i.amount);
                obj.instaMarkt_commission = parseInt(i.amount) * .1;
                obj.delivery_charge = i.delivery_charge != null ? parseInt(i.delivery_charge) : 0;
                obj.tip_amount = i.tip_amount != null ? parseInt(i.tip_amount) : 0;
                obj.total_order_amount = parseFloat(i.amount) + (parseFloat(i.amount) * .1 + i.delivery_charge != null ? parseFloat(i.delivery_charge) : 0) + (i.tip_amount != null ? parseFloat(i.tip_amount) : 0);
                obj.deduction = (parseFloat(i.amount) * .1) + (i.delivery_charge != null ? parseFloat(i.delivery_charge) : 0) + (i.tip_amount != null ? parseFloat(i.tip_amount) : 0);
                obj.driver = {
                    first_name: driverdetails[0].first_name,
                    last_name: driverdetails[0].last_name,
                    id: driverdetails[0].id,
                    username: driverdetails[0].username,
                    phone: driverdetails[0].phone,
                    image: driverdetails[0].image,
                },
                    obj.order_detail = {
                        type: i.order_detail.type,
                        status: i.order_detail.status,
                        gateway: i.order_detail.gateway,
                        payment: i.order_detail.payment,
                        customer: i.order_detail.customer,
                        transaction_type: i.order_detail.transaction_type,
                    },
                    obj.context = i.context;
                obj.for_delivery = i.for_delivery;
                obj.trip_fees = i.delivery_charge ? i.delivery_charge == 9 ? TIP15 : i.delivery_charge == 7 ? TIP10 : TIP5 : 0;
                obj.driver_pay = i.tip_amount + (i.delivery_charge ? i.delivery_charge == 9 ? TIP15 : i.delivery_charge == 7 ? TIP10 : TIP5 : 0);
                obj.vendor_pay = (parseFloat(i.amount) * .9) + (i.delivery_charge ? i.delivery_charge == 9 ? VEN15 : i.delivery_charge == 7 ? VEN10 : VEN5 : 0);
                data.push(obj);
            }
        }
        this.body = { status: 200, message: "Order payouts", data };
        return;
    } else {
        this.status = 404
        this.body = { status: 404, message: "Order not found" };
        return;
    }
}




exports.getcodorderbyrestaurant = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getWeekDeliveryChargesDriverOrder(driver_id);
    let data = [];
    for (let item of driverData.rows) {
        orderData = yield OrderHistory.getWeekDeliveryChargesTotalDriverOrder(driver_id, item.unit_id);
        data.push({
            name: orderData.rows[0].company_name,
            pay: orderData.rows.length * orderData.rows[0].delivery_charge,
            delivery_address_details: orderData.rows[0].delivery_address_details,
            tip_amount: orderData.rows[0].tip_amount,
            delivery_charge: orderData.rows[0].delivery_charge,
            trip_fees: orderData.rows[0].delivery_charge ? orderData.rows[0].delivery_charge == 9 ? TIP15 : orderData.rows[0].delivery_charge == 7 ? TIP10 : TIP5 : 0
        })
    }
    this.body = { status: 200, totalPay: data };
    return;
}



exports.calculateDriverWeekWages = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getWeekDriverOrder(driver_id);
    var driverWages = 0;
    for (let item of driverData.rows) {
        if (item.distance_type == 'short') {
            driverWages += item.tip_amount + TIP5;
        }
        if (item.distance_type == 'long') {
            driverWages += item.tip_amount + TIP10;
        }
        if (item.distance_type == 'extra-long') {
            driverWages += item.tip_amount + TIP15;
        }
    }
    this.body = { status: 200, totalPay: driverWages };
    return;
}

exports.calculateDriverDailyWages = function* (next) {
    let driver_id = this.params.driverid;
    driverData = yield OrderHistory.getDayWageDriverOrder(driver_id);
    var driverWages = 0;
    for (let item of driverData.rows) {
        if (item.distance_type == 'short') {
            driverWages += item.tip_amount + TIP5;
        }
        if (item.distance_type == 'long') {
            driverWages += item.tip_amount + TIP10;
        }
        if (item.distance_type == 'extra-long') {
            driverWages += item.tip_amount + TIP15;
        }
    }
    this.body = { status: 200, totalPay: driverWages };
    return;
}

exports.getAllCustomerOrder = function* (next) {
    user = (yield User.getSingleUser(this.params.userId));
    // console.log('dasjkhdkjhaskhdkhashdhaskjdjashdkhaskhdkhsakhdkhsadhsakhdhshakhdhsakjhdkjashdjas',user);
    try {
        var cart = (yield msc.getAllCustomerOrder(user[0].username));

        let itemDetails = [];
        let mycustomObj = {};
        var orderCounter = 0;
        for (let item of cart) {
            mycustomObj['type'] = item.type;
            mycustomObj['id'] = item.id;
            mycustomObj['status'] = item.status;
            mycustomObj['payment'] = item.payment;
            mycustomObj['shipping'] = item.shipping;
            mycustomObj['customer'] = item.customer;
            mycustomObj['shipping_address'] = item.shipping_address;
            mycustomObj['billing_address'] = item.billing_address;


            let itd = (yield msc.getorderItems(item.id));
            // console.log('ORDER ID and TOTAL ITEMS FOUND:::::::',item.id,itd.length,orderCounter);
            // let dddd = yield getItemsFromOrder(itd,orderCounter);
            let myitemsArray = [];
            for (var i = 0; i < itd.length; i++) {
                myitem = itd[i];
                // var getcustomer = ( yield CUSTOMER.getForUser(this.params.userId ? this.params.userId : ''))[0];
                // var totalOrderCount = ( yield OrderHistory.getTotalOrderCount(getcustomer.id));

                // let d = yield CART.getCart(this.params.userId,myitem.product_id, parseInt(totalOrderCount[0].count));
                let d = yield CART.getCart(this.params.userId, myitem.product_id, cart.length - orderCounter);
                // console.log('ORDER ID and TOTAL ITEMS FOUND:::::::', this.params.userId, myitem.product_id, itd.length, orderCounter, d);
                if (d && d.length > 0) {
                    let ad = [];
                    let i = 0;
                    let addddds = d[0].addons ? d[0].addons.split(',') : []
                    let addonsprice = d[0].addonsprice ? d[0].addonsprice.split(',') : []
                    for (let adddd of addddds) {
                        ad.push({ title: adddd, value: addonsprice[i] ? addonsprice[i] : 0 });
                        i++;
                    }
                    myitem['price'] = d[0].price
                    myitem['quantity'] = d[0].quantity
                    myitem['addons'] = ad ? ad : []
                    myitem['instructions'] = d[0].instructions ? d[0].instructions.split(',') : []
                    myitem['note'] = d[0].note
                    myitem['size'] = d[0].size
                }
                myitemsArray.push(myitem)
            }
            orderCounter = orderCounter + 1;
            // itd['order'] = mycustomObj;
            itemDetails.push({ items: myitemsArray, order: mycustomObj });
            mycustomObj = {};
            // console.log('sdasdasdjbaskhdasdhashdkasdhkashdkashdklas',itd)

            // for(let myitems of item.relationships.items.data){
            //     console.log('dsadasdasdasdasdasdasdsadasdasdasdasdsadasdsadasdasdasfdsfsdasdasdasdasdasdasdasdasdsa',myitems.id);
            //     let itd = (yield msc.findMenuItem(myitems.id));
            //     itd.order = mycustomObj;
            //     itemDetails.push(itd)
            // }
            // ordersItem = (yield msc.getorderItems(item.id));
        }

        // let filteredData = cart.filter((item,index)=>{return item.status==='complete'});
        // let filteredData = cart.filter((item,index)=>{return item.status!=='complete'});
        this.status = 200;
        this.body = { status: 200, data: "Request created", data: itemDetails };
        return;
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, models: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        return;
        // throw (error);
    }
}

exports.getCustomerOrder = function* (next) {
    user = (yield User.getSingleUser(this.params.userId));
    let customerOrder = null;
    try {
        var cart = (yield msc.getCustomerOrder(user[0].username))
        // let filteredData = cart.filter((item,index)=>{return item.status==='complete'});
        // let filteredData = cart.filter((item,index)=>{return item.status!=='complete'});
        let itemDetails = [];
        let mycustomObj = {};
        console.log('this.params.customerIdthis.params.customerId', this.params.customerId)
        customerOrder = yield OrderHistory.getCustomerOrder(this.params.customerId);
        for (let item of cart) {
            mycustomObj['type'] = item.type;
            mycustomObj['id'] = item.id;
            mycustomObj['status'] = item.status;
            mycustomObj['payment'] = item.payment;
            mycustomObj['shipping'] = item.shipping;
            mycustomObj['customer'] = item.customer;
            mycustomObj['shipping_address'] = item.shipping_address;
            mycustomObj['billing_address'] = item.billing_address;

            let itd = (yield msc.getorderItems(item.id));
            console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', itd)

            // customerOrder = yield OrderHistory.getCustomerOrder(this.params.customerId);
            let status = customerOrder.findIndex((item1, index) => {
                return item1.order_detail.id == mycustomObj.id;
            });
            if (status != -1) {
                mycustomObj['priority'] = parseInt(customerOrder[status].priority);
                // mycustomObj['company_id']=customerOrder[status].company_id;
                // mycustomObj['customer_id']=customerOrder[status].customer_id;
                // mycustomObj['driver_id']=customerOrder[status].driver_id;
                itemDetails.push({ items: itd, order: mycustomObj });
            } else {
                console.log('no order, no order, no order')
            }

            mycustomObj = {};
            console.log('sdasdasdjbaskhdasdhashdkasdhkashdkashdklas', status)
        }

        itemDetails = itemDetails.sort(function (a, b) {
            // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',a,a.order)
            return a.order.priority - b.order.priority;
        });

        this.status = 200;
        this.body = { status: 200, data: "Request created", data: itemDetails };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, models: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        return;
        // throw (error);
    }
}

exports.reorder = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    console.log('==============================================================================')
    try {
        var cart = (yield msc.getCustomerOrder(user[0].username))
        let filteredData = cart.filter((item, index) => { return item.id == this.params.myorderId });
        this.status = 200;
        var data = filteredData[0];
        var cartreorder = (yield msc.cartCheckout(this.params.cartName, data))

        this.body = { status: 200, data: "Request created", data: cartreorder };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}

exports.getCartItems = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    console.log('==============================================================================')
    try {
        var cartItems = (yield msc.getCartItems(this.params.cartName))
        this.body = { status: 200, message: "Cart items listed here!", data: cartItems };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}

exports.deleteCartItem = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName, this.params.cartItemId));
    console.log('==============================================================================')
    try {
        var cartItems = (yield msc.deleteCartItem(this.params.cartName, this.params.cartItemId))
        this.body = { data: "Request created", data: cartItems };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}
exports.deleteCart = function* (next) {
    user = (yield User.getSingleUser(this.params.cartName));
    console.log('==============================================================================')
    try {
        var cartItems = (yield msc.deleteCart(this.params.cartName))
        this.body = { data: "Request created", data: cartItems };
    } catch (error) {
        if (error.code == '23505') {
            this.status = 422;
            this.body = { status: 422, message: 'Entry already exist' };
            return;
        }
        logger.error('Error creating request.');
        this.status = 500; // Internal Server Error - Operation Failed
        this.body = { status: 500, message: 'Error creating the request.' };
        // throw (error);
        return;
    }
}
