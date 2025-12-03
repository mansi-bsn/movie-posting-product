// Admin middleware - check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).redirect('/login');
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).render('error', {
            error: 'Access Denied',
            message: 'You do not have permission to access this page.',
            user: req.user
        });
    }
    
    next();
};

module.exports = { isAdmin };

