var storefront = require('../../app/controllers/storefront.server.controller');
var foodpark = require('../../app/controllers/foodpark.server.controller');
var moltinCart = require('../../app/controllers/cart.server.controller');
var auth = require('../../app/controllers/authentication.server.controller');
var config = require('../../config/config');
var passport = require('passport');
var Router = require('koa-router');

var ADMIN       = 'ADMIN',
    OWNER       = 'OWNER',
    UNITMGR     = 'UNITMGR',
    CUSTOMER    = 'CUSTOMER',
    FOODPARKMGR = 'FOODPARKMGR';

var requireJWT = passport.authenticate('jwt', { session: false });

module.exports=function(app) {
	var router = new Router();
	var relApiversion = '/api/'+ config.apiVersion + '/rel';
    var apiversion = '/api/'+ config.apiVersion + '/mol';
    var apibotversion = '/api/'+ config.apiVersion + '/bot';

	router.use(passport.authenticate(['jwt','anonymous'], {session:false}));

    /* Food Park Management */
    router.post(relApiversion + '/food_parks', requireJWT, foodpark.createHub)
    router.get(relApiversion + '/food_parks/:foodParkId/checkins', requireJWT, foodpark.getFoodParkCheckins)
    router.get(relApiversion + '/food_parks/:foodParkId/units', requireJWT, foodpark.getFoodParkUnits)
    router.get(relApiversion + '/food_parks/:foodParkId/companies', requireJWT, foodpark.getFoodParkCompanies);

    router.get(relApiversion + '/food_parks/:foodParkId/units/active_orders', foodpark.getUnitsActiveOrders)

    router.get(relApiversion + '/food_parks/:foodParkId/orders/:orderId/drivers/:driverId', requireJWT, foodpark.getDriverByOrder)
    router.post(relApiversion + '/food_parks/:foodParkId/units', requireJWT, foodpark.addFoodParkUnits)
    router.put(relApiversion + '/food_parks/:foodParkId/orders/:OrderId', requireJWT, foodpark.setDriverToOrder)
    router.delete(relApiversion + '/food_parks/:foodParkId/units/:fpUnitId', requireJWT, foodpark.removeFoodParkUnits)
    
    router.get(relApiversion + '/units/:unit_id/drivers', foodpark.getDriversForUnits);
    router.get(relApiversion + '/food_parks/:foodParkId/drivers', requireJWT, foodpark.getDrivers);

    router.post(relApiversion + '/food_parks/:foodParkId/drivers', requireJWT, foodpark.addDriver)
    router.delete(relApiversion + '/food_parks/:foodParkId/drivers/:userId', requireJWT, foodpark.deleteDriver)
    router.put(relApiversion + '/food_parks/:foodParkId/drivers/:userId/', requireJWT, foodpark.setAvailable)
    router.get(relApiversion + '/food_parks/foodparkmgr', foodpark.listFoodParkMgr);
    router.post(relApiversion + '/food_parks/setfoodparkmgrtohub', foodpark.setfoodparkmgrtohub);
    router.post(relApiversion + '/food_parks/setfooddrivertohub', foodpark.setfooddrivertohub);
    router.get(relApiversion + '/food_parks/getunassingndriver', foodpark.getunassingndriver);

    router.post(relApiversion + '/food_parks/getfoodparkmgrs', foodpark.getfoodparkmgrs);

    router.post(relApiversion + '/get-drivers-for-units', foodpark.getDriversForEveryUnits);

    router.get(relApiversion + '/get-units-by-foodpark/:food_park_id', foodpark.getUnitsbyFoodPark);


    /* Menu Management */
    router.get(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems', storefront.listOptionItems)
    router.get(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories', storefront.listOptionCategories)
    router.get(apiversion + '/companies/:companyId/categories/:categoryId/menuitems', storefront.listMenuItems)
    router.get(apiversion + '/companies/:companyId/categories/:categoryId/menuitemssize', storefront.listsizeMenuItems)
    router.get(apiversion + '/companies/:companyId/menuitems', storefront.listMenuItemsForComapny)
    router.get(apiversion + '/companies/:companyId/categories', storefront.listCategories)
    router.get(apiversion + '/companies/:companyId/getactivecategories', storefront.getactivecategories)
    
    router.get(apiversion + '/companies', storefront.listCompanies);
    router.get(relApiversion + '/states/:countryId', storefront.listState)


    router.get(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId', storefront.readOptionItem)
    router.get(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId', storefront.readOptionCategory)
    router.get(apiversion + '/companies/:companyId/menuitems/:menuItemId', storefront.readMenuItem)
    router.get(apiversion + '/companies/:companyId/categories/:categoryId/menuitems/:menuItemId', storefront.readMenuItem)
    router.get(apiversion + '/companies/:companyId/categories/:categoryId/menuitems/:menuItemId/:productId/:type', storefront.readProductItem)

    
    router.get(apiversion + '/companies/:companyId/categories/:categoryId', storefront.readCategory)
    router.post(apiversion + '/companies/:companyId/categories/:categoryId/images',  requireJWT, storefront.uploadCategoryImage)

    router.get(apiversion + '/companies/:companyId', storefront.readCompany)
    router.get(relApiversion + '/companies/:companyId/units/:unitId', storefront.getCompanyUnit);

	router.get(apiversion + '/companies/:compId/getunassignedOrders', storefront.getunassignedOrders);
	router.get(apiversion + '/companies/:compId/units', storefront.listUnits);

    router.post(apiversion + '/companies/:companyId/images',  requireJWT, storefront.uploadCompanyPhoto)
    router.post(apiversion + '/companies/:companyId/featureddish',  requireJWT, storefront.uploadCompanyFeaturedDish)
    router.post(apiversion + '/companies/:companyId/thumbnail',  requireJWT, storefront.uploadCompanyThumbnail)
    router.post(apiversion + '/companies/:companyId/categories', requireJWT, storefront.createCategory)
    router.post(apiversion + '/companies/:companyId/categories/:categoryId/menuitems', requireJWT, storefront.createMenuItem)
    router.post(apiversion + '/companies/:companyId/menuitems/:menuItemId/images',  requireJWT, storefront.uploadMenuItemImage)
    router.post(apiversion + '/companies/:companyId/categories/:categoryId/menuitems/:menuItemId/images',  requireJWT, storefront.uploadMenuItemImage)

    // for uploading menu items via google spread sheet

    router.get(relApiversion + '/parsegooglesheetuploadmenuitems', storefront.googlesheetuploadmenuitems);
    router.post(relApiversion + '/uploadgooglesheetuploadmenuitems',requireJWT, storefront.uploadgooglesheetuploadmenuitems);
    router.get(apiversion + '/companies/:companyId/getactivecategoriesnames', storefront.getactivecategoriesnames);
    router.get(relApiversion + '/getallproducts/:company_id/:category', storefront.getallproducts);


    // BOT API -- Only do changes in routes /api/v1/bot/
    router.get(apibotversion + '/companies/:companyId/getactivecategoriesnames', storefront.getactivecategoriesnames);
    router.get(apibotversion + '/companies/:companyId/categories/:categoryId/menuitems', storefront.listMenuItems)
    router.get(apibotversion + '/companies/:companyId/categories/:categoryId/menuitems/:menuItemId', storefront.readMenuItem)
    router.get(apibotversion + '/createCart/:cartName',                moltinCart.createCart);
    router.post(apibotversion + '/addItemsToCart/:cartName',           moltinCart.addItemsToCart);
    router.get(apibotversion + '/getAllOrder/:cartName',          moltinCart.getAllOrder);


    router.post(apiversion + '/calculateDistance',           moltinCart.calculateDistance);

    // CART API : 
    router.get(apiversion + '/createCart/:cartName',                moltinCart.createCart);
    router.post(apiversion + '/addItemsToCart/:cartName',           moltinCart.addItemsToCart);
    router.put(apiversion + '/updateItemsToCart/:cartName/:itemId', moltinCart.updateItemsToCart);
    router.post(apiversion + '/cartCheckout/:cartName',             moltinCart.cartCheckout);
    router.get(apiversion + '/getCustomerOrder/:userId/:customerId',          moltinCart.getCustomerOrder);
    
    router.post(apiversion + '/sendOrderToCustomer/:vendorId',           moltinCart.sendOrderToCustomer);
    router.post(apiversion + '/completeOrder/:orderId',           moltinCart.completeOrder);

    router.get(apiversion + '/complete-takeout-order/:orderId',   requireJWT, moltinCart.completeTakeoutOrder);

    router.post(apiversion + '/reorder/:cartName/:myorderId',       moltinCart.reorder);
    router.get(apiversion + '/getCartItems/:cartName',              moltinCart.getCartItems)
    router.delete(apiversion + '/deleteCartItem/:cartName/:cartItemId',              moltinCart.deleteCartItem)
    router.delete(apiversion + '/deleteCart/:cartName',              moltinCart.deleteCart);
 
    // 21st july,2020 Tuesday
    router.get(apiversion + '/getAllCustomerOrder/:userId',          moltinCart.getAllCustomerOrder);
    router.put(apiversion + '/setDriversToOrder', requireJWT,  foodpark.setDriversToOrder);

    router.put(apiversion + '/setOrderPriority', requireJWT, foodpark.setOrderPriority);
    router.put(apiversion + '/assignDriverToAParticularOrder', requireJWT,  foodpark.assignDriverToAParticularOrder);
    router.put(apiversion + '/deleteOrderFromDriverTaskList', requireJWT,  foodpark.deleteOrderFromDriverTaskList);


    router.get(apiversion + '/getAllPendingCustomers',          moltinCart.getAllPendingCustomers);
    router.delete(apiversion + '/deleteAllOrderForUser/:userId',          moltinCart.deleteAllOrderForUser);
    
    router.get(apiversion + '/calculateDriverWeekWages/:driverid', moltinCart.calculateDriverWeekWages);
    router.get(apiversion + '/calculateDriverDailyWages/:driverid', moltinCart.calculateDriverDailyWages);
    router.get(apiversion + '/calculateDriverWeekWagesOnworkingDay/:driverid', moltinCart.calculateDriverWeekWagesOnworkingDay);
    router.get(apiversion + '/calculateDriverWeekWagesOnDeliveryCharges/:driverid', moltinCart.calculateDriverWeekWagesOnDeliveryCharges);
    router.get(apiversion + '/calculateDriverPerDayWagesOnDeliveryCharges/:driverid', moltinCart.calculateDriverPerDayWagesOnDeliveryCharges);
    router.get(apiversion + '/getcodorderbyrestaurant/:driverid', moltinCart.getcodorderbyrestaurant);


    router.get(apiversion + '/getVendorDriverWagesForOrders', moltinCart.getVendorDriverWagesForOrders);

    
    router.get(apiversion + '/calculateVendorWagesPerdayForDriver/:vendorId', moltinCart.calculateVendorWagesPerdayForDriver);
    router.post(apiversion + '/moneyReceivedForVendorByDriver', moltinCart.moneyReceivedForVendorByDriver);
    
    router.get(apiversion+ '/getCompanyByVendorId/:vendorId', moltinCart.getCompanyByVendorId);

    router.get(apiversion + '/getAllCartItems/:userid',          moltinCart.getAllCartItems);
    router.get(apiversion + '/getAllOrder/:cartName',          moltinCart.getAllOrder);
    router.get(apiversion + '/getAllOrderFormattedResponse/:cartName',          moltinCart.getAllOrderFormattedResponse);
    router.get(apiversion + '/getAllrestaurantOrder/:vendor_id',          moltinCart.getAllrestaurantOrder);
    router.get(apiversion + '/acceptOrderByRestaurant/:order_id',          moltinCart.acceptOrderByRestaurant);
    router.get(apiversion + '/assignOrderToDriver/:order_id/:driver_id',          moltinCart.assignOrderToDriver);

    router.post(apiversion + '/orderPayment',  moltinCart.orderPayment)
    
    
    
    
    

    /* for create options without optionCategoriesID (variation id)  */ 
    router.post(apiversion + '/companies/:companyId/menuitems/:menuItemId/optionitems', requireJWT, storefront.createOptionItem)
    /*======= for create variations ===== */
    router.post(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories', requireJWT, storefront.createOptionCategory)
    /* For create options with optionCategoriesID (variation id)  */
    router.post(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems', requireJWT, storefront.createOptionItem)
    /*======= route for create modifer ======= */
    router.post(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId/modifier', requireJWT, storefront.createModifier)

    router.put(apiversion + '/companies/:companyId/categories/:categoryId', requireJWT, storefront.updateCategory);
    router.put(apiversion + '/companies/:companyId/menuitems/:menuItemId', requireJWT, storefront.updateMenuItem);
    //router.put(apiversion + '/companies/:companyId/categories/:categoryId/menuitems/:menuItemId/optionitems/:optionItemId', requireJWT, storefront.updateOptionItem);
    router.put(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId', requireJWT,  storefront.updateOptionCategory);
    router.put(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId', requireJWT, storefront.updateOptionItem);
    /* for update modifer */
    router.put(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId/modifier/:modifierId', requireJWT, storefront.updateModifier)

    router.delete(apiversion + '/companies/:companyId',requireJWT, storefront.deleteCompany);
    router.delete(apiversion + '/companies/:companyId/categories/:categoryId',requireJWT, storefront.deleteCategory);
    router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId', requireJWT, storefront.deleteMenuItem);
    router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId/images/:imageId', requireJWT, storefront.deleteImage)
    //router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId/optionitems/:optionItemId', requireJWT,  storefront.deleteOptionItem);
    router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId', requireJWT,  storefront.deleteOptionCategory);
    router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId', requireJWT,  storefront.deleteOptionItem);
    /* for delete modifer */
    router.delete(apiversion + '/companies/:companyId/menuitems/:menuItemId/optioncategories/:optionCategoryId/optionitems/:optionItemId/modifier/:modifierId', requireJWT, storefront.deleteModifier)

    router.post(relApiversion + '/loyalty/redeem', requireJWT, storefront.redeemLoyalty);
    router.get(relApiversion + '/companies/:companyId/customers/:customerId/loyalty', requireJWT, storefront.getLoyaltyInfo);
    router.get(relApiversion + '/companies/:companyId/loyalty', requireJWT, storefront.getCompanyLoyaltyInfo);

    router.param('menuItemId', storefront.getMenuItem);
    router.param('categoryId', storefront.getCategory);
    router.param('companyId', storefront.getCompany);
    router.param('optionCategoryId', storefront.getoptionCategory);
    router.param('optionItemId', storefront.getoptionItem) ;
    router.param('modifierId', storefront.getmodifier) ;

    /* Food Park Management */
    router.param('foodParkId', foodpark.getFoodPark);
    router.param('fpUnitId', foodpark.getFoodParkUnitId);
    
    router.param('driverId', foodpark.getDriverByOrder);
    // router.param('orderId', foodpark.getDriverByOrder);
    router.param('OrderId', foodpark.setDriverToOrder);
    router.param('userId', foodpark.getUser);

    router.param('countryId', foodpark.getCountryId);

    app.use(router.routes());
    app.use(router.allowedMethods());
};
