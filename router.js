const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
    res.json({
        status: 200,
        message: 'Welcome to api.tawan475.dev! maybe documentations soon?'
    });
});



module.exoprts = router