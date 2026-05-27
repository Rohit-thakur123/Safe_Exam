export const requireSEB = (req, res, next) => {
    console.log('SEB request headers:', req.headers);

    const userAgent = req.headers['user-agent'] || '';

    if (!userAgent.includes('SEB')) {
        return res.status(403).json({
            success: false,
            error: 'Use Safe Exam Browser'
        });
    }

    next();
};
