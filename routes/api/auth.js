const express =require('express');
const router =express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const config=require('config');
const { check, validationResult } = require("express-validator");
// @route GET api/auth
// @desc Test route
// @access Public
router.get('/',auth, async(req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

);
// @route GET api/auth
// @desc authenticate user and get token
// @access Public
router.post('/',[
    
    check('email','please include a avalid email').isEmail(),
    check('password',' password is required').exists()
  ],
  async(req,res) => {
      const errors =validationResult(req);
      if(!errors.isEmpty()){
          return res.status(400).json({errors: errors.array()});
      }
      
  
     const {email,password} = req.body;
  
     try{
       //to check user
       let user=await User.findOne({email});
       if(!user)
       {
        return res.status(400).json({errors:[{msg:'Invalid credentials'}]});
       }
       const isMatch = await bcrypt.compare(password,user.password);
       if(!isMatch){
        return res.status(400).json({errors:[{msg:'Invalid credentials'}]});
       }
       const payload ={
         user:{
           id:user.id
         }
       };
       jwt.sign(payload,
       config.get('jwtSecret'),
       {expiresIn:36000},
        (err,token) => {
          if(err) throw err;
          res.json({token});
        }
        );
      //res.send('User registered');
     }
     catch(err){
      console.error(err.message);
      res.status(500).send('server error');
     }
  
      
  }
  );
  // @route    PUT api/posts/unlike/:id
// @desc     Like a post
// @access   Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;