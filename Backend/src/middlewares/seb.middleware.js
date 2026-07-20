// Phase 7: Removed console.log of all request headers — this was a security
// leak because it exposed JWT tokens in server logs.
export const requireSEB = (req, res, next) => {
    // Dev-only escape hatch so the exam flow can be tested from a regular
    // browser without the real Safe Exam Browser. Must never be true in prod.
    if (process.env.BYPASS_SEB_CHECK === 'true') {
        return next();
    }

    const userAgent = req.headers['user-agent'] || '';

    if (!userAgent.includes('SEB')) {
        return res.status(403).json({
            success: false,
            error: 'Use Safe Exam Browser'
        });
    }

    next();
};
