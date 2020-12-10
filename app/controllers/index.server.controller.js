
exports.render = function(req, res) {
    res.render('index', {
        title: 'SFEZ Login',
        user: JSON.stringify(req.user)
    });
};
