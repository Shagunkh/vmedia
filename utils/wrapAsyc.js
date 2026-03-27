module.exports = function wrapAsyc(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
};
