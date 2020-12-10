angular.module('companies').factory('Companies', ['$resource',
    function($resource) {
        return $resource('/comapnies/:companyId', {
            companyId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
