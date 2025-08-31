module.exports = {
    success: function (res, message = "", body = {}) {
        return res.status(200).json({
            success: true,
            code: 200,
            message: message,
            body: body,
        });
    },

    failed: function (res, message = "", body = {}) {
        return res.status(400).json({
            success: false,
            code: 400,
            message: message,
            body: body,
        });
    },
}